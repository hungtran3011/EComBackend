import express from "express";
import { config } from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import morgan from "morgan";
import fs from 'fs';
import path from "path";
import { fileURLToPath } from 'url';
import { httpDebugLogger } from "./common/middlewares/debug-logger.js";

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

app.set('trust proxy', true);

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


securityMiddleware(app);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(morgan("combined"))
app.use(httpDebugLogger);

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

// Run in all environments with different schedules
const CLEANUP_INTERVAL = process.env.NODE_ENV === 'production'
  ? 12 * 60 * 60 * 1000  // 12 hours in production
  : 1  * 60 * 60 * 1000; // 1 hour in development

const FILE_AGE_LIMIT = process.env.NODE_ENV === 'production'
  ? 60 * 60 * 1000   // 1 hour in production
  : 15 * 60 * 1000;  // 15 minutes in development

if (true) {
  // Clean temp files older than the configured age on the configured interval
  setInterval(() => {
    const cleanupTempFiles = async () => {
      try {
        const tempDir = path.join(__dirname, "..", "uploads", "temp");
        const files = await fs.promises.readdir(tempDir);

        const now = Date.now();
        const ageLimit = now - FILE_AGE_LIMIT;

        const fileStats = await Promise.all(
          files.map(async (file) => {
            const filePath = path.join(tempDir, file);
            try {
              const stats = await fs.promises.stat(filePath);
              return { file, filePath, stats };
            } catch (err) {
              console.error(`Error stating file ${file}:`, err);
              return null;
            }
          })
        );

        // Filter out nulls and files older than the limit
        const oldFiles = fileStats
          .filter(item => item && item.stats.mtimeMs < ageLimit);

        // Delete old files
        await Promise.all(
          oldFiles.map(async ({ file, filePath }) => {
            try {
              await fs.promises.unlink(filePath);
              console.log(`Deleted old temp file: ${file}`);
            } catch (err) {
              console.error(`Error deleting old temp file ${file}:`, err);
            }
          })
        );

        const deletedCount = oldFiles.length;
        if (deletedCount > 0) {
          console.log(`Cleanup completed: ${deletedCount} files removed`);
        }
      } catch (err) {
        console.error('Error during temp file cleanup:', err);
      }
    };

    cleanupTempFiles();
  }, CLEANUP_INTERVAL);
}