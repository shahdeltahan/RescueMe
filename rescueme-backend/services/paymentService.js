const paymentRepository = require("../repositories/paymentRepository");

const paymentService = {
  processPayment: async (userId, paymentData) => {
    const {
      amount,
      payment_type,
      payment_method,
      campaign_id,
      masked_account,
      gateway_token,
    } = paymentData;

    if (!amount || amount <= 0) {
      throw { status: 400, message: "Invalid amount." };
    }

    const validTypes = ["donation", "adoption_fee", "rescue_fee"];
    if (!validTypes.includes(payment_type)) {
      throw { status: 400, message: "Invalid payment type." };
    }

    const validMethods = ["credit_card", "wallet", "cash"];
    if (!validMethods.includes(payment_method)) {
      throw { status: 400, message: "Invalid payment method." };
    }

    if (payment_type === "donation" && !campaign_id) {
      throw { status: 400, message: "campaign_id is required for donations." };
    }

    const result = await paymentRepository.createPaymentAndDonation({
      user_id: userId,
      amount,
      payment_type,
      payment_method,
      campaign_id,
      masked_account,
      gateway_token,
    });

    return {
      message: "Payment completed successfully.",
      ...result,
      amount,
      payment_type,
      payment_method,
    };
  },

  getUserPayments: async (userId) => {
    return await paymentRepository.findByUserId(userId);
  },

  getAllPayments: async () => {
    return await paymentRepository.findAll();
  },

  refundPayment: async (paymentId, userId) => {
    const payment = await paymentRepository.findById(paymentId);

    if (!payment) {
      throw { status: 404, message: "Payment not found." };
    }

    if (payment.user_id !== userId) {
      throw { status: 403, message: "Not authorized." };
    }

    if (payment.status !== "completed") {
      throw { status: 400, message: "Only completed payments can be refunded." };
    }

    await paymentRepository.updateStatus(paymentId, "refunded");

    return { message: "Payment refunded successfully." };
  },
};

module.exports = paymentService;