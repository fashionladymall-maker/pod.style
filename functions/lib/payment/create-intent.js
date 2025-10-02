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
exports.createPaymentIntentHandler = exports.createPaymentIntent = void 0;
const functions = __importStar(require("firebase-functions"));
const stripe_1 = __importDefault(require("stripe"));
const zod_1 = require("zod");
const getStripeSecret = () => {
    const configSecret = functions.config().stripe?.secret;
    return configSecret ?? process.env.STRIPE_SECRET_KEY ?? process.env.STRIPE_API_KEY;
};
const stripeSecret = getStripeSecret();
if (!stripeSecret) {
    throw new Error('Stripe secret key is not configured. Set functions config stripe.secret or STRIPE_SECRET_KEY.');
}
const stripe = new stripe_1.default(stripeSecret, {
    apiVersion: '2025-09-30.clover',
});
const payloadSchema = zod_1.z.object({
    amount: zod_1.z.number().int().positive(),
    currency: zod_1.z.string().min(1),
    items: zod_1.z
        .array(zod_1.z.object({
        sku: zod_1.z.string(),
        quantity: zod_1.z.number().int().positive(),
        price: zod_1.z.number().nonnegative(),
    }))
        .nonempty(),
    shipping: zod_1.z.object({
        method: zod_1.z.enum(['standard', 'express']),
        cost: zod_1.z.number().nonnegative(),
        name: zod_1.z.string(),
        phone: zod_1.z.string(),
        email: zod_1.z.string().email().optional(),
        address: zod_1.z.string(),
    }),
    userId: zod_1.z.string().nullable().optional(),
});
const createPaymentIntent = async (rawData) => {
    const data = payloadSchema.parse(rawData);
    const intent = await stripe.paymentIntents.create({
        amount: data.amount,
        currency: data.currency,
        automatic_payment_methods: { enabled: true },
        metadata: {
            userId: data.userId ?? 'anonymous',
            shippingMethod: data.shipping.method,
            shippingCost: data.shipping.cost.toString(),
            items: JSON.stringify(data.items),
        },
        shipping: {
            name: data.shipping.name,
            phone: data.shipping.phone,
            address: {
                line1: data.shipping.address,
            },
        },
    });
    return {
        id: intent.id,
        clientSecret: intent.client_secret,
    };
};
exports.createPaymentIntent = createPaymentIntent;
exports.createPaymentIntentHandler = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    try {
        const result = await (0, exports.createPaymentIntent)(req.body);
        res.status(200).json(result);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'unknown_error';
        functions.logger.error('stripe.create_intent.failed', message);
        res.status(400).json({ error: message });
    }
});
