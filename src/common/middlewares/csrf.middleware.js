import Tokens from 'csrf';
import { config } from 'dotenv';

config();

const tokens = new Tokens();
const SECRET = process.env.CSRF_SECRET;

/**
 * @name csrfProtection
 * @description Middleware that provides CSRF protection
 * Uses Double Submit Cookie pattern with custom header verification
 * Allows tokens to be used for multiple requests
 */
export const csrfProtection = (options = {}) => {
  // Set defaults
  const opts = {
    cookie: {
      key: 'csrf-token',
      path: '/',
      httpOnly: false, // Must be accessible to JavaScript
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
      console.error('Session middleware must be used before CSRF middleware');
      return next(new Error('Session middleware required'));
    }
    
    // Generate a new CSRF token only if one doesn't exist
    if (!req.session.csrfSecret || !req.cookies[opts.cookie.key]) {
      try {
        // Create a new CSRF token
        const secret = await tokens.secret();
        const token = tokens.create(secret);
        
        // Store the secret in session
        req.session.csrfSecret = secret;
        
        // Set cookie with the token
        res.cookie(opts.cookie.key, token, opts.cookie);
        
        // For API responses, let's attach the token to res.locals
        // so it can be included in API responses if needed
        res.locals.csrfToken = token;
      } catch (error) {
        console.error('CSRF token generation error:', error);
      }
    } else {
      // If token exists, make it available to the response
      const existingToken = req.cookies[opts.cookie.key];
      res.locals.csrfToken = existingToken;
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
        return res.status(403).json({ 
          message: 'CSRF token missing', 
          detail: !secret ? 'Session expired' : 'Token not provided' 
        });
      }
      
      if (!tokens.verify(secret, token)) {
        return res.status(403).json({ message: 'Invalid CSRF token' });
      }
      
      // Don't regenerate the token after verification - let it be reused
      next();
    } catch (error) {
      console.error('CSRF validation error:', error);
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
    return res.status(403).json({ message: 'CSRF attack detected' });
  }
  next(err);
};

/**
 * @name generateCsrfToken
 * @description Generate a new CSRF token for explicit token rotation
 * @param {Object} req - Express request object
 * @returns {Promise<string>} New CSRF token
 */
export const generateCsrfToken = async (req) => {
  if (!req.session) {
    throw new Error('Session middleware required');
  }
  
  const secret = await tokens.secret();
  req.session.csrfSecret = secret;
  return tokens.create(secret);
};