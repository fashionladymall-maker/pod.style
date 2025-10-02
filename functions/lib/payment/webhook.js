"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhookHandler = void 0;
const functions = __importStar(require("firebase-functions"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
const getStripeSecret = () => {
    const configSecret = functions.config().stripe?.secret;
    return configSecret ?? process.env.STRIPE_SECRET_KEY ?? process.env.STRIPE_API_KEY;
};
const stripeSecret = getStripeSecret();
if (!stripeSecret) {
    throw new Error('Stripe secret key is not configured.');
}
const stripe = new stripe_1.default(stripeSecret, {
    apiVersion: '2025-09-30.clover',
});
const webhookSecret = functions.config().stripe?.webhook ?? process.env.STRIPE_WEBHOOK_SECRET;
const updateOrderStatus = async (paymentIntentId, status, paidAt) => {
    const db = firebase_admin_1.default.firestore();
    const snapshot = await db
        .collection('orders')
        .where('payment.stripePaymentIntentId', '==', paymentIntentId)
        .limit(1)
        .get();
    if (snapshot.empty) {
        return;
    }
    const doc = snapshot.docs[0];
    const updates = {
        status: status === 'paid' ? 'paid' : 'cancelled',
        updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
    };
    if (paidAt) {
        updates['payment.paidAt'] = firebase_admin_1.default.firestore.Timestamp.fromDate(paidAt);
    }
    await doc.ref.update(updates);
};
exports.stripeWebhookHandler = functions.https.onRequest(async (req, res) => {
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type,Stripe-Signature');
        res.status(204).send('');
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    let event;
    try {
        if (webhookSecret) {
            const signature = req.headers['stripe-signature'];
            if (!signature) {
                res.status(400).send('Missing Stripe signature');
                return;
            }
            event = stripe.webhooks.constructEvent(req.rawBody, signature, webhookSecret);
        }
        else {
            event = req.body;
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'invalid_signature';
        functions.logger.error('stripe.webhook.signature_error', message);
        res.status(400).send(`Webhook Error: ${message}`);
        return;
    }
    try {
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const intent = event.data.object;
                functions.logger.info('stripe.webhook.payment_succeeded', { id: intent.id });
                await updateOrderStatus(intent.id, 'paid', intent.created ? new Date(intent.created * 1000) : new Date());
                break;
            }
            case 'payment_intent.payment_failed': {
                const intent = event.data.object;
                functions.logger.warn('stripe.webhook.payment_failed', { id: intent.id, error: intent.last_payment_error?.message });
                await updateOrderStatus(intent.id, 'failed');
                break;
            }
            default:
                functions.logger.debug('stripe.webhook.unhandled_event', { type: event.type });
        }
        res.status(200).send({ received: true });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'webhook_processing_failed';
        functions.logger.error('stripe.webhook.processing_error', message);
        res.status(500).send({ error: message });
    }
});
