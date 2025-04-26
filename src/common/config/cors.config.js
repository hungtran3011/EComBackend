import { config } from "dotenv";

config();

const whitelist = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  "http://localhost:5555",
].filter(Boolean); // Filter out undefined values

console.log("CORS whitelist:", whitelist);  

// Update your existing CORS configuration
export const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    console.log('Origin:', origin);
    
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // This is important for cookies/auth to work
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-CSRF-Token',
    "Cache-Control",
  ],
};