import express from "express";
import { config } from "dotenv";

config();

const app = express();
const port = process.env.PORT || 3001;

app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
})

app.listen(port, () => {
  console.log(`Server running on port ${process.env.PORT}`);
})