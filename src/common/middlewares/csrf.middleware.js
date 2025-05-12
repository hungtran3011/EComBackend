import Tokens from 'csrf';
import { config } from 'dotenv';
import { debugLogger } from "./debug-logger.js";

config();

const tokens = new Tokens();
const logger = debugLogger("csrf-middleware");

/**
 * @name csrfProtection
 * @description Middleware that provides CSRF protection
 * Uses Double Submit Cookie pattern with custom header verification
 * Prevents unpredictable token rotation in production
 */
export const csrfProtection = (options = {}) => {
  // Set defaults
  const opts = {
    cookie: {
      key: 'csrf-token',
      path: '/',
      httpOnly: false,
      sameSite: 'none', // Change to 'none' for cross-site requests
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600 * 24 // 24 hours
    },
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
    ...options
  };

  return async (req, res, next) => {
    logger.debug(`CSRF check for ${req.method} ${req.path}`);
    logger.debug(`Headers: ${JSON.stringify(Object.keys(req.headers))}`);
    
    // For token verification requests, always allow them
    if (req.path === '/api/auth/csrf-token' && req.method === 'GET') {
      logger.debug(`CSRF token endpoint accessed, bypassing protection`);
      return next();
    }

    try {
      // Check token in header first
      const token = req.headers['x-csrf-token'];
      const cookieToken = req.cookies[opts.cookie.key];
      
      logger.debug(`CSRF Header token present: ${!!token}`);
      logger.debug(`CSRF Cookie token present: ${!!cookieToken}`);
      
      if (token) {
        // Log token details (only first and last 4 chars for security)
        const tokenPreview = token.length > 8 
          ? `${token.substring(0, 4)}...${token.substring(token.length - 4)}`
          : '***';
        logger.debug(`CSRF token preview: ${tokenPreview}`);
      }
      
      // Log if this method requires CSRF protection
      logger.debug(`Method ${req.method} is ${!opts.ignoreMethods.includes(req.method) ? '' : 'not '}protected`);
      
      // If this is a protected method and we have a token
      if (!opts.ignoreMethods.includes(req.method) && token) {
        // For simplicity in production, verify that header token matches cookie
        const tokensMatch = token === cookieToken;
        logger.debug(`CSRF tokens match: ${tokensMatch}`);
        
        if (tokensMatch) {
          logger.debug(`CSRF validation successful`);
          return next();
        }
        
        // If tokens don't match, reject the request
        logger.error(`CSRF validation failed: tokens do not match`);
        return res.status(403).json({ message: 'Invalid CSRF token' });
      }
      
      // For unprotected methods or no token provided
      if (opts.ignoreMethods.includes(req.method)) {
        logger.debug(`CSRF check skipped for ${req.method} request`);
      } else if (!token) {
        logger.debug(`No CSRF token provided for ${req.method} request`);
      }
      
      next();
    } catch (error) {
      logger.error('CSRF validation error:', error);
      res.status(403).json({ message: 'CSRF validation failed' });
    }
  };
};

/**
 * @name csrfErrorHandler
 * @description Middleware to handle CSRF errors
 */
export const csrfErrorHandler = (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    logger.warn("CSRF attack detected");
    return res.status(403).json({ message: 'CSRF attack detected' });
  }
  next(err);
};

/**
 * @name generateCsrfToken
 * @description Generate a CSRF token from the existing or new secret
 * @param {Object} req - Express request object
 * @returns {Promise<string>} CSRF token
 */
export const generateCsrfToken = async (req) => {
  if (!req.session) {
    throw new Error('Session middleware required');
  }
  
  if (!req.session.csrfSecret) {
    const secret = await tokens.secret();
    req.session.csrfSecret = secret;
  }
  
  return tokens.create(req.session.csrfSecret);
};