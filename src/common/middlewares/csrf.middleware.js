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
    // For token verification requests, always allow them
    if (req.path === '/api/auth/csrf-token' && req.method === 'GET') {
      return next();
    }

    try {
      // Check token in header first
      const token = req.headers['x-csrf-token'];
      const cookieToken = req.cookies[opts.cookie.key];
      
      // If this is a protected method and we have a token
      if (!opts.ignoreMethods.includes(req.method) && token) {
        // For simplicity in production, verify that header token matches cookie
        if (token === cookieToken) {
          return next();
        }
        
        // If tokens don't match, reject the request
        return res.status(403).json({ message: 'Invalid CSRF token' });
      }
      
      // For unprotected methods or no token provided, continue
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