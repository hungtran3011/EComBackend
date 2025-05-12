import { config } from "dotenv";
import { debugLogger } from "../middlewares/debug-logger.js";

config();

const whitelist = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  process.env.BACKEND_URL,
].filter(Boolean);

const logger = debugLogger("cors");


function isOriginAllowed(origin) {
  if (whitelist.includes(origin)) return true;
  const originWithoutTrailingSlash = origin.endsWith('/') ? origin.slice(0, -1) : origin;
  const originWithTrailingSlash = origin.endsWith('/') ? origin : `${origin}/`;
  if (whitelist.includes(originWithoutTrailingSlash) 
    || whitelist.includes(originWithTrailingSlash)) 
    return true;
  return whitelist.some(allowed => {
    try {
      const allowedUrl = new URL(allowed);
      const originUrl = new URL(origin);
      return allowedUrl.hostname === originUrl.hostname && 
             allowedUrl.port === originUrl.port;
    } catch (error) {
      logger.error('Error parsing URL:', error);
      return false;
    }
  });
}

export const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    logger.info('Origin:', origin);
    
    if (isOriginAllowed(origin) || !origin) {
      callback(null, true);
    } else {
      logger.error('Origin not allowed:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-CSRF-Token',
    "Cache-Control",
    'Cookie',
  ],
  exposedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-CSRF-Token',
    "Cache-Control",
    'Set-Cookie',
    'Cookie'
  ],
};