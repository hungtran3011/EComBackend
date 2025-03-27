import Tokens from 'csrf';
import { config } from 'dotenv';

config();

const tokens = new Tokens();
const SECRET = process.env.CSRF_SECRET;

/**
 * @name csrfProtection
 * @description Middleware that provides CSRF protection
 * Uses Double Submit Cookie pattern with custom header verification
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
    // Generate CSRF token if it doesn't exist
    if (!req.cookies[opts.cookie.key]) {
      // Create a new CSRF token
      const secret = await tokens.secret();
      const token = tokens.create(secret);
      
      // Store the secret in session or dedicated Redis store for high security
      req.session = req.session || {};
      req.session.csrfSecret = secret;
      
      // Set cookie with the token
      res.cookie(opts.cookie.key, token, opts.cookie);
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
        return res.status(403).json({ message: 'CSRF token missing' });
      }
      
      if (!tokens.verify(secret, token)) {
        return res.status(403).json({ message: 'Invalid CSRF token' });
      }
      
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
 * @description Helper function to generate CSRF token - useful for testing or manual operations
 * @returns {Promise<{secret: string, token: string}>} CSRF secret and token
 */
export const generateCsrfToken = async () => {
  const secret = await tokens.secret();
  const token = tokens.create(secret);
  return { secret, token };
};

export default { csrfProtection, csrfErrorHandler, generateCsrfToken };