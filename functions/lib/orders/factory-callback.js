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
Object.defineProperty(exports, "__esModule", { value: true });
exports.factoryStatusCallback = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const firestore_1 = require("firebase-admin/firestore");
const zod_1 = require("zod");
const db = admin.firestore();
const factoryStatusSchema = zod_1.z.enum(['printing', 'shipped', 'delivered']);
const payloadSchema = zod_1.z.object({
    orderId: zod_1.z.string().min(1),
    lineItemId: zod_1.z.string().min(1).optional(),
    status: factoryStatusSchema,
    notes: zod_1.z.string().optional(),
});
const statusMap = {
    printing: 'processing',
    shipped: 'shipped',
    delivered: 'delivered',
};
const resolveFactoryToken = () => {
    const fromConfig = functions.config().factory?.token;
    return fromConfig ?? process.env.FACTORY_WEBHOOK_TOKEN;
};
const verifyFactoryToken = (req) => {
    const expected = resolveFactoryToken();
    if (!expected) {
        return true;
    }
    const header = req.headers['x-factory-token'];
    const provided = Array.isArray(header) ? header[0] : header;
    return provided === expected;
};
exports.factoryStatusCallback = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, X-Factory-Token');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'method_not_allowed' });
        return;
    }
    if (!verifyFactoryToken(req)) {
        res.status(401).json({ error: 'unauthorized' });
        return;
    }
    const parseResult = payloadSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({ error: 'invalid_payload', details: parseResult.error.flatten() });
        return;
    }
    const { orderId, lineItemId, status, notes } = parseResult.data;
    const mappedStatus = statusMap[status];
    try {
        const orderRef = db.collection('orders').doc(orderId);
        await db.runTransaction(async (txn) => {
            const snapshot = await txn.get(orderRef);
            if (!snapshot.exists) {
                throw new functions.https.HttpsError('not-found', 'Order not found');
            }
            txn.update(orderRef, {
                status: mappedStatus,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
                statusHistory: firestore_1.FieldValue.arrayUnion({
                    status: mappedStatus,
                    occurredAt: firestore_1.FieldValue.serverTimestamp(),
                    source: 'factory',
                    note: notes ?? null,
                }),
            });
            if (lineItemId) {
                const itemRef = orderRef.collection('items').doc(lineItemId);
                txn.set(itemRef, {
                    fulfillmentStatus: status,
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                    fulfillmentEvents: firestore_1.FieldValue.arrayUnion({
                        status,
                        occurredAt: firestore_1.FieldValue.serverTimestamp(),
                        note: notes ?? null,
                    }),
                }, { merge: true });
            }
        });
        functions.logger.info('orders.factory.status_updated', {
            orderId,
            lineItemId: lineItemId ?? null,
            status,
        });
        res.status(200).json({ ok: true });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'internal_error';
        functions.logger.error('orders.factory.update_failed', {
            orderId,
            lineItemId: lineItemId ?? null,
            status,
            error: message,
        });
        if (error instanceof functions.https.HttpsError && error.code === 'not-found') {
            res.status(404).json({ error: 'order_not_found' });
            return;
        }
        res.status(500).json({ error: 'internal_error' });
    }
});
