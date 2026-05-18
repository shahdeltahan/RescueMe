const pool = require("../db");

const paymentRepository = {
    createPaymentAndDonation: async (data) => {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const {
                user_id,
                amount,
                payment_type,
                payment_method,
                campaign_id,
                masked_account,
                gateway_token,
            } = data;

            const [paymentResult] = await connection.query(
                `INSERT INTO PAYMENT 
        (user_id, amount, payment_type, payment_method, status)
        VALUES (?, ?, ?, ?, 'pending')`,
                [user_id, amount, payment_type, payment_method]
            );

            const paymentId = paymentResult.insertId;

            let donationId = null;

            if (payment_type === "donation") {
                const [donationResult] = await connection.query(
                    `INSERT INTO donation
                    (user_id, campaign_id, payment_id, amount, payment_method, donated_at, masked_account, gateway_token)
                    VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)`,
                    [
                        user_id,
                        campaign_id,
                        paymentId,
                        amount,
                        payment_method,
                        masked_account || "****-****-****-0000",
                        gateway_token || `TOKEN-${paymentId}-${Date.now()}`
                    ]
                );

                donationId = donationResult.insertId;
            }

            await connection.query(
                `UPDATE PAYMENT 
         SET status = 'completed', reference_id = ?
         WHERE payment_id = ?`,
                [`REF-${paymentId}-${Date.now()}`, paymentId]
            );

            await connection.commit();

            return {
                payment_id: paymentId,
                donation_id: donationId,
                status: "completed",
            };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    },

    findById: async (paymentId) => {
        const [rows] = await pool.query(
            `SELECT p.*, u.full_name, u.email
       FROM PAYMENT p
       JOIN USER u ON p.user_id = u.user_id
       WHERE p.payment_id = ?`,
            [paymentId]
        );

        return rows[0];
    },

    findByUserId: async (userId) => {
        const [rows] = await pool.query(
            `SELECT 
          p.*,
          d.donation_id,
          d.campaign_id,
          c.title AS campaign_title
       FROM PAYMENT p
       LEFT JOIN donation d 
          ON d.user_id = p.user_id 
          AND d.amount = p.amount
       LEFT JOIN campaign c 
          ON d.campaign_id = c.campaign_id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
            [userId]
        );

        return rows;
    },

    findAll: async () => {
        const [rows] = await pool.query(
            `SELECT 
          p.*,
          u.full_name,
          u.email,
          d.donation_id,
          d.campaign_id,
          c.title AS campaign_title
       FROM PAYMENT p
       JOIN USER u ON p.user_id = u.user_id
       LEFT JOIN donation d 
          ON d.user_id = p.user_id 
          AND d.amount = p.amount
       LEFT JOIN campaign c 
          ON d.campaign_id = c.campaign_id
       ORDER BY p.created_at DESC`
        );

        return rows;
    },

    updateStatus: async (paymentId, status) => {
        await pool.query(
            `UPDATE PAYMENT
       SET status = ?
       WHERE payment_id = ?`,
            [status, paymentId]
        );
    },
};

module.exports = paymentRepository;