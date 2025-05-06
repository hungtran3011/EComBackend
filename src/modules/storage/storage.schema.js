import mongoose from "mongoose";
// import {ProductSchema} from "../product/product.schema.js";

/**
 * @name StorageItem
 * @description Thông tin hàng trong kho, có thể query tới để check số lượng
 * @typedef {Object} StorageItem
 * @property {mongoose.Schema.Types.ObjectId} product - Tham chiếu đến sản phẩm
 * @property {Number} quantity - Số lượng sản phẩm
 * @property {Date} createdAt - Ngày tạo (tự động)
 * @property {Date} updatedAt - Ngày cập nhật (tự động)
 * @property {mongoose.Schema.Types.ObjectId} _id - ID của StorageItem (tự động)
 */
export const StorageItemSchema = mongoose.Schema({
  product: {type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true},
  quantity: {type: Number, required: true},
}, {timestamps: true})

/**
 * @name StorageItemModel
 * @type {mongoose.Model}
 * @description Model cho StorageItemSchema, cho phép thực hiện các thao tác CRUD trên StorageItem
 */
export const StorageItemModel = mongoose.model('StorageItem', StorageItemSchema);

export const StorageSchema = mongoose.Schema({
  items: [StorageItemSchema],
}, {timestamps: true})

export const VariationStorageSchema = mongoose.Schema({
  variation: {type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariation', required: true},
  quantity: {type: Number, required: true, default: 0},
}, {timestamps: true});

const VariationStorageModel = mongoose.model('VariationStorage', VariationStorageSchema);

export {
  VariationStorageModel
};