import { MongoClient } from "mongodb";

const URI = process.env.MONGO_READ_WRITE_URI;

const client = new MongoClient(URI)
                .connect()
                .then(() => {
                    console.log("MongoDB connected");
                })
                .catch((error) => {
                    console.error("MongoDB connection error:", error);
                });

export { client as MongoDBClient };