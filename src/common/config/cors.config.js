import { config } from "dotenv";

config();

const whitelist = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  "http://localhost:5555",
].filter(Boolean);


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
      console.error('Error parsing URL:', error);
      return false;
    }
  });
}

export const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    console.log('Origin:', origin);
    
    if (isOriginAllowed(origin) || !origin) {
      callback(null, true);
    } else {
      console.error('Origin not allowed:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-CSRF-Token',
    "Cache-Control",
  ],
};