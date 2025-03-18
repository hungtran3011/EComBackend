import express from "express";
import { config } from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import morgan from "morgan";
import fs from 'fs';
import path from "path";
import { fileURLToPath } from 'url';

import { corsOptions } from "./config/cors.config.js";
import { MainRouter } from "./routes/index.js";
import { IPRateLimiter } from "./config/rate-limit.js";


// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config();

// Create logs directory if it doesn't exist
const logDirectory = path.join(__dirname, "logs");
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory, { recursive: true });

const app = express();
const port = process.env.PORT || 3001;

const queryString = process.env.MONGO_READ_WRITE_URI;

mongoose.connect(queryString).then(() => {
  console.log("Connected to MongoDB");
}).catch((error) => {
  console.error(error);
})

app.use(express.urlencoded({ extended: false }))
app.use(express.json()) // Add this to parse JSON request bodies

app.use(morgan('dev', {
  skip: function (req, res) { return res.statusCode < 400 }
}))

// Fix morgan configuration syntax
app.use(morgan("combined", {
  stream: fs.createWriteStream(path.join(__dirname, "logs", "access.log"), {
    flags: "a"
  })
}));

app.use(cors(corsOptions));
app.use(IPRateLimiter); // Apply rate limiting middleware

app.get("/", (req, res) => {
  res.json({ message: "Server is healthy" });
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