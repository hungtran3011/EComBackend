import express from "express";
import { config } from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import router from "./routes/product.route.js";

import logger from "./middleware/log.middleware.js";
import { corsOptions } from "./middleware/cors.middleware.js";

config();

const app = express();
const port = process.env.PORT || 3001;

const queryString = process.env.MONGO_READ_URI;

mongoose.connect(queryString).then(() => {
  console.log("Connected to MongoDB");
}).catch((error) => {
  console.error(error);
})

app.use(express.urlencoded({ extended: false }))

app.use(logger("access.log"));

app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
})

app.use("/products", router);

app.listen(port, () => {
  console.log(`Server running on port ${process.env.PORT}`);
})