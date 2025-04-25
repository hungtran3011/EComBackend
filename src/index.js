import express from "express";
import { config } from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import morgan from "morgan";
import fs from 'fs';
import path from "path";
import { fileURLToPath } from 'url';
import cookieParser from "cookie-parser";
import session from "express-session";

import { corsOptions } from "./common/config/cors.config.js";
import { MainRouter } from "./api/routes.js";
import swaggerDocs from "./swagger.js";
import { securityMiddleware } from "./common/middlewares/security.middleware.js";
import redisService from './common/services/redis.service.js';
import { csrfProtection } from "./common/middlewares/csrf.middleware.js";

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config();

// Create logs directory if it doesn't exist
const logDirectory = path.join(__dirname, "..", "logs");
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory, { recursive: true });

// Create uploads/temp directory for temporary file storage
const uploadsDirectory = path.join(__dirname, "..", "uploads", "temp");
fs.existsSync(uploadsDirectory) || fs.mkdirSync(uploadsDirectory, { recursive: true });

const app = express();
const port = process.env.PORT || 3001;

const queryString = process.env.MONGO_READ_WRITE_URI;

mongoose.connect(queryString, {
  ssl: true,
  tls: true
}).then(() => {
  console.log("Connected to MongoDB");

}).catch((error) => {
  console.error(error);
})

// Đảm bảo Redis cũng được kết nối
if (!redisService.isConnected()) {
  redisService.connect()
    .then(() => console.log('Redis service initialized'))
    .catch(err => console.error('Failed to initialize Redis:', err));
}

// Fix the middleware order - make sure these are in correct sequence:

// Security middleware
securityMiddleware(app);

// Body parsers first
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// // Cookie parser next
// app.use(cookieParser());

// // Session middleware before CSRF
// app.use(session({
//   secret: process.env.SESSION_SECRET,
//   resave: false,
//   saveUninitialized: false,
//   cookie: { 
//     secure: process.env.NODE_ENV === 'production',
//     httpOnly: true,
//     sameSite: 'lax',
//     maxAge: 24 * 60 * 60 * 1000 // 24 hours
//   }
// }));

// app.use(csrfProtection())

app.use(morgan('dev', {
  skip: function (req, res) { return res.statusCode < 400 }
}))

// Fix morgan configuration syntax
// app.use(morgan("combined", {
//   stream: fs.createWriteStream(path.join(__dirname, "logs", "access.log"), {
//     flags: "a"
//   })
// }));

app.use(morgan("combined"));

app.use(cors(corsOptions));

app.get("/health-check", (req, res) => {
  res.json({ message: "Server is healthy" });
})

// Serve all static assets for the docs
app.use("/docs", express.static(path.join(__dirname, "..", "docs")));

app.get("/docs", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "docs", "index.html"));
})

// Apply routers with URL prefixes
app.use("/api", MainRouter);

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
})

swaggerDocs(app, port);

// Và thêm vào phần tắt ứng dụng
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  
  // Đóng kết nối Redis
  await redisService.disconnect();
  
  // Đóng kết nối MongoDB
  await mongoose.disconnect();
  
  process.exit(0);
});

// Optional: Add cleanup for old temporary files (add near the bottom of index.js)
if (process.env.NODE_ENV === 'production') {
  // Clean temp files older than 1 hour every 12 hours
  setInterval(() => {
    const tempDir = path.join(__dirname, "..", "uploads", "temp");
    fs.readdir(tempDir, (err, files) => {
      if (err) return console.error('Error reading temp directory:', err);
      
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      
      files.forEach(file => {
        const filePath = path.join(tempDir, file);
        fs.stat(filePath, (err, stats) => {
          if (err) return console.error(`Error stating file ${file}:`, err);
          
          if (stats.mtimeMs < oneHourAgo) {
            fs.unlink(filePath, err => {
              if (err) console.error(`Error deleting old temp file ${file}:`, err);
              else console.log(`Deleted old temp file: ${file}`);
            });
          }
        });
      });
    });
  }, 12 * 60 * 60 * 1000); // Run every 12 hours
}