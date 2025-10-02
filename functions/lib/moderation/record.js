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
exports.createModerationRecord = void 0;
const admin = __importStar(require("firebase-admin"));
const utils_1 = require("./utils");
const db = admin.firestore();
const DEFAULT_APPEAL_STATUS = 'none';
const createModerationRecord = async (input, options = {}) => {
    const collection = db.collection('moderations');
    let docRef;
    let existingData;
    if (options.upsertByHash) {
        const existing = await collection
            .where('contentHash', '==', input.contentHash)
            .where('context', '==', input.context ?? null)
            .limit(1)
            .get();
        if (!existing.empty) {
            docRef = existing.docs[0].ref;
            existingData = existing.docs[0].data();
        }
        else {
            docRef = collection.doc();
        }
    }
    else {
        docRef = collection.doc();
    }
    const now = admin.firestore.FieldValue.serverTimestamp();
    const payload = {
        recordType: input.recordType,
        status: input.status,
        userId: input.userId ?? null,
        referenceId: input.referenceId ?? null,
        context: input.context ?? null,
        metadata: input.metadata ?? {},
        textResult: input.textResult ?? null,
        imageResult: input.imageResult ?? null,
        contentHash: input.contentHash,
        source: input.source,
        updatedAt: now,
    };
    if (options.textSample !== undefined) {
        payload.textSample = options.textSample ? (0, utils_1.truncateForSnapshot)(options.textSample) : null;
    }
    else if (existingData?.textSample !== undefined) {
        payload.textSample = existingData.textSample;
    }
    if (options.imageSource !== undefined) {
        payload.imageSource = options.imageSource;
    }
    else if (existingData?.imageSource !== undefined) {
        payload.imageSource = existingData.imageSource;
    }
    if (options.imageReference !== undefined) {
        payload.imageReference = options.imageReference;
    }
    else if (existingData?.imageReference !== undefined) {
        payload.imageReference = existingData.imageReference;
    }
    if (!existingData) {
        payload.createdAt = now;
        payload.appealStatus = DEFAULT_APPEAL_STATUS;
    }
    await docRef.set(payload, { merge: true });
    const snapshot = await docRef.get();
    const data = snapshot.data();
    const createdAt = (data.createdAt ?? new admin.firestore.Timestamp(0, 0)).toDate().toISOString();
    const updatedAt = (data.updatedAt ?? new admin.firestore.Timestamp(0, 0)).toDate().toISOString();
    return {
        id: docRef.id,
        recordType: data.recordType ?? input.recordType,
        status: data.status ?? input.status,
        userId: data.userId ?? input.userId ?? null,
        referenceId: data.referenceId ?? input.referenceId ?? null,
        context: data.context ?? input.context ?? null,
        metadata: data.metadata ?? input.metadata ?? {},
        textResult: data.textResult ?? input.textResult,
        imageResult: data.imageResult ?? input.imageResult,
        contentHash: data.contentHash ?? input.contentHash,
        source: data.source ?? input.source,
        createdAt,
        updatedAt,
        appealStatus: data.appealStatus ?? DEFAULT_APPEAL_STATUS,
    };
};
exports.createModerationRecord = createModerationRecord;
