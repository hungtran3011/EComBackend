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
    
    // Skip CSRF check for token endpoint
    if (req.path === '/api/auth/csrf-token' && req.method === 'GET') {
      logger.debug(`CSRF token endpoint accessed, bypassing protection`);
      return next();
    }

    try {
      // Check for token in various places
      const token = 
        req.headers['x-csrf-token'] || 
        (req.body && req.body._csrf) || 
        req.query._csrf;
        
      const cookieToken = req.cookies && req.cookies[opts.cookie.key];
      
      logger.debug(`CSRF Header/Body token present: ${!!token}`);
      logger.debug(`CSRF Cookie token present: ${!!cookieToken}`);
      
      // Skip CSRF for ignored methods
      if (opts.ignoreMethods.includes(req.method)) {
        logger.debug(`CSRF check skipped for ${req.method} request`);
        return next();
      }
      
      // No token at all
      if (!token) {
        logger.error(`CSRF validation failed: No token provided`);
        return res.status(403).json({ message: 'CSRF token required' });
      }
      
      // If we have both cookie and header token
      if (cookieToken && token) {
        // Match them
        if (token === cookieToken) {
          logger.debug(`CSRF validation successful: tokens match`);
          return next();
        }
      } 
      // If we only have header token but no cookie (cookie issue)
      else if (token && !cookieToken) {
        // Fallback to secret validation in production
        const isValid = tokens.verify(process.env.CSRF_TOKEN_SECRET, token);
        
        if (isValid) {
          logger.debug(`CSRF validation successful with secret+token`);
          return next();
        }
      }
      
      logger.error(`CSRF validation failed`);
      return res.status(403).json({ message: 'Invalid CSRF token' });
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