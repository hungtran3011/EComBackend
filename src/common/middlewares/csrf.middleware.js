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
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600 * 24 // 24 hours
    },
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
    ...options
  };

  return async (req, res, next) => {
    // Ensure sessions are available
    if (!req.session) {
      logger.error('Session middleware must be used before CSRF middleware');
      return next(new Error('Session middleware required'));
    }
    
    // Generate a new CSRF token if needed
    if (!req.session.csrfSecret) {
      try {
        logger.debug("Generating new CSRF secret for session");
        // Create a new CSRF secret
        const secret = await tokens.secret();
        req.session.csrfSecret = secret;
      } catch (error) {
        logger.error('CSRF secret generation error:', error);
      }
    }
    
    // Always create the token from the secret
    try {
      const token = tokens.create(req.session.csrfSecret);
      
      // Set cookie with the token, but don't keep resetting it if it exists
      // This prevents unpredictable rotation
      if (!req.cookies[opts.cookie.key]) {
        logger.debug("Setting new CSRF token cookie");
        res.cookie(opts.cookie.key, token, opts.cookie);
      }
      
      // Always make token available to templates/responses
      res.locals.csrfToken = token;
    } catch (error) {
      logger.error('CSRF token creation error:', error);
    }
    
    // Skip CSRF check for ignored methods
    if (opts.ignoreMethods.includes(req.method)) {
      return next();
    }
    
    // Verify the CSRF token for other methods
    try {
      const secret = req.session.csrfSecret;
      const token = req.headers['x-csrf-token'] || req.body._csrf;
      
      if (!secret || !token) {
        logger.warn(`CSRF validation failed: ${!secret ? 'Missing secret' : 'Missing token'}`);
        return res.status(403).json({ 
          message: 'CSRF token missing', 
          detail: !secret ? 'Session expired' : 'Token not provided' 
        });
      }
      
      if (!tokens.verify(secret, token)) {
        logger.warn(`CSRF validation failed: Invalid token`);
        return res.status(403).json({ message: 'Invalid CSRF token' });
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