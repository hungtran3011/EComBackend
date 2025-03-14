import mongoose from "mongoose";
import { CartItem } from "./types.schema.js";

/**
 * @name Cart
 * @description A user's shopping cart containing items they intend to purchase
 * @typedef {Object} Cart
 * @property {Array<CartItem>} items - Array of cart items
 * @property {ObjectId} user - Reference to the user who owns the cart
 * @property {Date} createdAt - When the cart was created
 * @property {Date} updatedAt - When the cart was last updated
 */
const Cart = mongoose.Schema({
  items: [CartItem],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp on save
Cart.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Cart', Cart);