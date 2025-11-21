type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  context: string;
  message: string;
  level: LogLevel;
  details?: string;
}

const MAX_LOGS = 100;
const logs: LogEntry[] = [];

const getErrorDetails = (error: unknown): string | undefined => {
  if (error == null) return undefined;
  if (error instanceof Error) {
    return import.meta.env.DEV
      ? `${error.message}\nStack: ${error.stack || 'No stack trace available'}`
      : error.message;
  }
  if (typeof error === 'object' && 'message' in (error as Record<string, unknown>)) {
    const msg = (error as Record<string, unknown>).message;
    return typeof msg === 'string' ? msg : String(msg);
  }
  const s = String(error);
  return s === 'undefined' ? undefined : s;
};

const logger = {
  log: (context: string, message: string, level: LogLevel = 'info', error?: unknown) => {
    const timestamp = new Date().toISOString();
    let details = getErrorDetails(error);

    if (import.meta.env.PROD && level === 'error') {
      const isCriticalError =
        error instanceof Error &&
        (error.message.includes('Permission denied') ||
          error.message.includes('Network error') ||
          error.message.includes('Security error'));

      if (!isCriticalError) {
        level = 'warn';
        details =
          error == null ? undefined : error instanceof Error ? error.message : String(error);
      }
    }

    if (level === 'debug' && import.meta.env.PROD) {
      return;
    }

    const entry: LogEntry = {
      timestamp,
      context,
      message,
      level,
      details,
    };

    // Store log entry
    logs.push(entry);
    if (logs.length > MAX_LOGS) {
      logs.shift();
    }

    const c = console;
    const logMessage = `${timestamp} [${context}] ${message}`;
    switch (level) {
      case 'error':
        c.error(logMessage);
        if (details) c.error('Error Details:', details);
        break;
      case 'warn':
        c.warn(logMessage);
        if (details) c.warn('Warning Details:', details);
        break;
      case 'debug':
        if (import.meta.env.DEV) {
          c.debug(logMessage);
          if (details) c.debug('Debug Details:', details);
        }
        break;
      case 'info':
        c.log(logMessage);
        if (details) c.log('Details:', details);
        break;
      default:
        c.log(logMessage);
        if (details) c.log('Details:', details);
    }
  },

  error: (context: string, message: string, error?: unknown) => {
    logger.log(context, message, 'error', error);
  },

  warn: (context: string, message: string, error?: unknown) => {
    logger.log(context, message, 'warn', error);
  },

  info: (context: string, message: string) => {
    logger.log(context, message, 'info');
  },

  debug: (context: string, message: string, error?: unknown) => {
    logger.log(context, message, 'debug', error);
  },

  getLogs: async () => {
    return logs;
  },
};

export { logger };

const normalizeMessage = (message: unknown): string => {
  if (typeof message === 'string') return message;
  if (message instanceof Error) return message.message;
  return String(message);
};

const isSystemPageMessage = (msg: string): boolean => {
  const lower = msg.toLowerCase();
  return (
    lower.includes('browser system pages cannot be analyzed') ||
    lower.includes('regular webpage') ||
    lower.includes('extensions gallery cannot be scripted') ||
    lower.includes('cannot be scripted') ||
    lower.includes('chrome web store') ||
    lower.includes('chrome.google.com/webstore') ||
    lower.includes('chromewebstore')
  );
};

const logSystemAware = (
  context: string,
  message: unknown
): { msg: string; isSystemPage: boolean } => {
  const msg = normalizeMessage(message);
  const isSystemPage = isSystemPageMessage(msg);
  logger.log(context, msg, isSystemPage ? 'info' : 'error');
  return { msg, isSystemPage };
};

const createLoggedError = <E>(
  context: string,
  message: unknown,
  factory: (msg: string) => E
): E => {
  const { msg } = logSystemAware(context, message);
  return factory(msg);
};

export { logSystemAware, createLoggedError };
