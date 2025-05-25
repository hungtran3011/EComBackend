import morgan from 'morgan';
import fs from 'fs';
import path from 'path';

// Custom token for debug logs
morgan.token('debug', (req, res, param) => {
  if (process.env.DEBUG_MODE !== 'true') return '';
  return param || '';
});

// Create a write stream for debug logs
const debugLogStream = fs.createWriteStream(
  path.join(process.cwd(), 'logs', 'debug.log'), 
  { flags: 'a' }
);

// Debug logger for services
export const debugLogger = (context) => {
  return {
    debug: (message, data) => {
      if (process.env.DEBUG_MODE !== 'true') return;
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [DEBUG] [${context}]: ${message} ${data ? JSON.stringify(data) : ''}`;
      console.debug("\x1b[34m%s\x1b[0m", logMessage);
      debugLogStream.write(logMessage + '\n');
    },
    info: (message, data) => {
      if (process.env.DEBUG_MODE !== 'true') return;
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [INFO] [${context}]: ${message} ${data ? JSON.stringify(data) : ''}`;
      console.info("\x1b[32m%s\x1b[0m", logMessage);
      debugLogStream.write(logMessage + '\n');
    },
    error: (message, data) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [ERROR] [${context}]: ${message} ${data ? JSON.stringify(data) : ''}`;
      console.error("\x1b[31m%s\x1b[0m", logMessage);
      debugLogStream.write(logMessage + '\n');
    },
    warn: (message, data) => {
      if (process.env.DEBUG_MODE !== 'true') return;
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [WARN] [${context}]: ${message} ${data ? JSON.stringify(data) : ''}`;
      console.warn("\x1b[33m%s\x1b[0m", logMessage);
      debugLogStream.write(logMessage + '\n');
    }
  };
};

// HTTP request debug logger middleware
export const httpDebugLogger = morgan(
  (tokens, req, res) => {
    if (process.env.DEBUG_MODE !== 'true') return null;
    return [
      '[HTTP]',
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, 'content-length'), '-',
      tokens['response-time'](req, res), 'ms'
    ].join(' ');
  },
  {
    stream: debugLogStream
  }
);