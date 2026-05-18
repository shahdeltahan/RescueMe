const paymentService = require("../services/paymentService");
const notificationService = require("../services/notificationService");

const paymentController = {
    // POST /api/payments
    processPayment: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const result = await paymentService.processPayment(userId, req.body);
            
            if (req.body.payment_type === 'donation') {
                await notificationService.createNotification(userId, 'system', 'Donation Successful', '1. Donation request created\n2. Payment processing\n3. Donation payment successful');
                await notificationService.notifyAdmins('alert', 'New Donation', '1. New donation received from user\n2. Donation payment successful');
            }

            return res.status(201).json(result);
        } catch (err) {
            const userId = req.user.user_id;
            if (req.body.payment_type === 'donation') {
                await notificationService.createNotification(userId, 'system', 'Donation Failed', '1. Donation request created\n2. Payment processing\n3. Donation payment failed');
                await notificationService.notifyAdmins('alert', 'Donation Failed', '1. New donation received from user\n2. Donation payment failed');
            }
            return res.status(err.status || 500).json({ 
                error: err.message || "Server error." 
            });
        }
    },

    // GET /api/payments/my
    getMyPayments: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const payments = await paymentService.getUserPayments(userId);
            return res.json(payments);
        } catch (err) {
            return res.status(err.status || 500).json({ 
                error: err.message || "Server error." 
            });
        }
    },

    // GET /api/payments — admin only
    getAllPayments: async (req, res) => {
        try {
            const payments = await paymentService.getAllPayments();
            return res.json(payments);
        } catch (err) {
            return res.status(500).json({ error: "Server error." });
        }
    },

    // POST /api/payments/:id/refund
    refundPayment: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const paymentId = req.params.id;
            const result = await paymentService.refundPayment(paymentId, userId);
            return res.json(result);
        } catch (err) {
            return res.status(err.status || 500).json({ 
                error: err.message || "Server error." 
            });
        }
    }
};

module.exports = paymentController;