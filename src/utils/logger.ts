export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const shouldLogDebug = process.env.NODE_ENV !== 'production';

const log = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
  if (level === 'debug' && !shouldLogDebug) {
    return;
  }

  const payload = meta ? `${message} ${JSON.stringify(meta)}` : message;
  switch (level) {
    case 'debug':
      console.debug(payload);
      break;
    case 'info':
      console.info(payload);
      break;
    case 'warn':
      console.warn(payload);
      break;
    case 'error':
      console.error(payload);
      break;
    default:
      console.log(payload);
  }
};

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
};

export default logger;
