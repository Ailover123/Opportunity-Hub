const Stripe = require('stripe');
const Razorpay = require('razorpay');
const crypto = require('crypto');

class PaymentService {
    constructor() {
        this.stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
        this.razorpay = process.env.RAZORPAY_KEY_ID ? new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        }) : null;
    }

    // Stripe Checkout (International)
    async createStripeSession(userId, planId) {
        if (!this.stripe) throw new Error('Stripe is not configured');

        const prices = {
            pro: process.env.STRIPE_PRO_PRICE_ID,
            team: process.env.STRIPE_TEAM_PRICE_ID
        };

        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price: prices[planId],
                quantity: 1,
            }],
            mode: 'subscription',
            success_url: `${process.env.FRONTEND_URL}/dashboard?payment=success`,
            cancel_url: `${process.env.FRONTEND_URL}/billing?payment=cancelled`,
            metadata: { userId, planId }
        });

        return session.url;
    }

    // Razorpay Order (India UPI / NetBanking)
    async createRazorpayOrder(userId, planId) {
        if (!this.razorpay) throw new Error('Razorpay is not configured');

        const amounts = {
            pro: 49900, // INR 499.00
            team: 199900 // INR 1999.00
        };

        const options = {
            amount: amounts[planId],
            currency: "INR",
            receipt: `receipt_${userId}_${Date.now()}`,
            notes: { userId, planId }
        };

        const order = await this.razorpay.orders.create(options);
        return order;
    }

    // UPI Verification
    verifyUPIPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature) {
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        return expectedSignature === razorpay_signature;
    }
}

module.exports = new PaymentService();
