import mongoose from "mongoose";
import {ProductSchema} from "product.schema.js";

/**
 * @name StorageItem
 * @description Thông tin hàng trong kho, có thể query tới để check số lượng
 * @typedef {Object} StorageItem
 * @property {mongoose.Schema.Types.ObjectId} product - Tham chiếu đến sản phẩm
 * @property {Number} quantity - Số lượng sản phẩm
 * @property {Date} createdAt - Ngày tạo
 * @property {Date} updatedAt - Ngày cập nhật
 */
export const StorageItemSchema = mongoose.Schema({
  product: {type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true},
  quantity: {type: Number, required: true},
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now},
})

// Update the updatedAt timestamp on save
StorageItemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

/**
 * @name StorageItemModel
 * @type {mongoose.Model}
 * @description Model cho StorageItemSchema, cho phép thực hiện các thao tác CRUD trên StorageItem
 */
export const StorageItemModel = mongoose.model('StorageItem', StorageItemSchema);

export const StorageSchema = mongoose.Schema({
  items: [StorageItemSchema],
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now},
})

// Update the updatedAt timestamp on save
StorageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});