import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const writeLog = async (message, logFile) => {
  const date = new Date();
  try {
    if (!fs.existsSync(path.join(__dirname, "..", "logs"))) {
      await fs.mkdirSync(path.join(__dirname, "..", "logs"));
    }
    const logFullDir = path.join(__dirname, "..", "logs", logFile);
    fs.createWriteStream(logFullDir, { flags: "a" }).write(message);
  }
  catch (err) {
    console.error(err);
  }
}

const logger = (logFile) => (req, res, next) => {
  writeLog(`${new Date()} \t ${req.method} \t ${req.originURL} \t ${req.path} \n`, logFile);
  next();
}

export default logger;