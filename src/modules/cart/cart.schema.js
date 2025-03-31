import mongoose from "mongoose";
// import { CartItem } from "./types.schema.js";

/**
 * @module schemas
 * @name CartItem
 * @description An item in a user's shopping cart
 * @typedef {Object} CartItem
 * @property {ObjectId} product - Reference to the product in the cart
 * @property {number} quantity - Number of units of the product in the cart
 * @property {Date} createdAt - When the item was added to the cart
 * @property {Date} updatedAt - When the item was last updated
 */
const CartItem = mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
});

/**
 * @module schemas
 * @name Cart
 * @author hungtran3011
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
}, {timestamps: true});

export default mongoose.model('Cart', Cart);