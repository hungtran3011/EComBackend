import mongoose from "mongoose";
import { CartItem } from "./types.schema";

const Cart = mongoose.Schema([CartItem]);