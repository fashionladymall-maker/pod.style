import crypto from 'node:crypto';
import type { ModerationStatus } from './types';

export const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const hashContent = (value: string): string =>
  crypto.createHash('sha256').update(value).digest('hex');

export const resolveStatus = (...statuses: ModerationStatus[]): ModerationStatus => {
  if (statuses.includes('reject')) {
    return 'reject';
  }
  if (statuses.includes('warn')) {
    return 'warn';
  }
  return 'pass';
};

export const truncateForSnapshot = (value: string, length = 120): string => {
  if (value.length <= length) {
    return value;
  }
  return `${value.slice(0, length)}…`;
};

