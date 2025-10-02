"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.truncateForSnapshot = exports.resolveStatus = exports.hashContent = exports.escapeRegExp = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
exports.escapeRegExp = escapeRegExp;
const hashContent = (value) => node_crypto_1.default.createHash('sha256').update(value).digest('hex');
exports.hashContent = hashContent;
const resolveStatus = (...statuses) => {
    if (statuses.includes('reject')) {
        return 'reject';
    }
    if (statuses.includes('warn')) {
        return 'warn';
    }
    return 'pass';
};
exports.resolveStatus = resolveStatus;
const truncateForSnapshot = (value, length = 120) => {
    if (value.length <= length) {
        return value;
    }
    return `${value.slice(0, length)}…`;
};
exports.truncateForSnapshot = truncateForSnapshot;
