import mongoose from "mongoose";

const generateSchema = (schema) => {
  return mongoose.Schema(schema);
}