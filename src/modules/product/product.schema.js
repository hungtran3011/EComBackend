/**
 * @name product.schema.js
 * @description Khi vận hành website bán hàng, việc đoán trước được cấu trúc dữ liệu của tất cả các danh mục là bất khả thi
 * Vì thế, sẽ cần 1 collection cho phép lưu trữ cấu trúc của các danh mục
 * Có thể tham khảo tại đây https://copilot.microsoft.com/shares/KThwGo1whr7kp6qd8s1L5
 */

import mongoose from "mongoose";

/**
 * @name FieldDefinitionSchema
 * @author hungtran3011
 * @description Định nghĩa cấu trúc của một trường dữ liệu trong sản phẩm hoặc danh mục
 * @type {mongoose.Schema}
 * @property {String} name - Tên của trường dữ liệu, bắt buộc phải có
 * @property {String} type - Kiểu dữ liệu của trường, bắt buộc phải có
 * - `String`: Chuỗi văn bản
 * - `Number`: Số
 * - `Date`: Ngày tháng
 * - `Boolean`: Giá trị đúng/sai
 * - `ObjectId`: ID tham chiếu đến đối tượng khác
 * - `Array`: Mảng dữ liệu
 * - `Mixed`: Dữ liệu hỗn hợp
 * @property {Boolean} required - Xác định trường dữ liệu có bắt buộc hay không, mặc định là false
 */
export const FieldDefinitionSchema = mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: [
      'String', 
      'Number', 
      'Date', 
      'Boolean', 
      'ObjectId', 
      'Array', 
      'Mixed'
    ]
  },
  required: { type: Boolean, default: false },
});

/**
 * @name CategorySchema
 * @author hungtran3011
 * @description Định nghĩa cấu trúc của một danh mục sản phẩm
 * @type {mongoose.Schema}
 * @property {String} name - Tên danh mục, bắt buộc phải có
 * @property {String} description - Mô tả chi tiết về danh mục, không bắt buộc
 * @property {Array<FieldDefinitionSchema>} fields - Danh sách các trường dữ liệu của danh mục
 * @property {mongoose.Schema.Types.ObjectId} createdBy - Tham chiếu đến người tạo danh mục
 */
export const CategorySchema = mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  fields: [FieldDefinitionSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

/**
 * @name CategoryModel
 * @author hungtran3011
 * @type {mongoose.Model}
 * @description Model cho CategorySchema, cho phép thực hiện các thao tác CRUD trên danh mục
 */
const CategoryModel = mongoose.model(
  'Category', 
  CategorySchema
);

/**
 * @name ProductFieldValueSchema
 * @author hungtran3011
 * @description Schema lưu trữ giá trị của trường dữ liệu tùy chỉnh trong sản phẩm
 * @type {mongoose.Schema}
 * @property {String} name - Tên của trường dữ liệu, bắt buộc phải có
 * @property {mongoose.Schema.Types.Mixed} value - Giá trị của trường
 */
export const ProductFieldValueSchema = mongoose.Schema({
  name: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
});

/**
 * @name ProductSchema
 * @author hungtran3011
 * @description Định nghĩa cấu trúc của một sản phẩm trong hệ thống
 * @type {mongoose.Schema}
 * @property {String} name - Tên sản phẩm, bắt buộc phải có
 * @property {String} description - Mô tả chi tiết về sản phẩm, không bắt buộc
 * @property {Number} price - Giá sản phẩm, bắt buộc phải có
 * @property {mongoose.Schema.Types.ObjectId} category - Tham chiếu đến danh mục chứa sản phẩm, bắt buộc phải có
 * @property {Array<ProductFieldValueSchema>} fieldValues - Danh sách các trường dữ liệu tùy chỉnh của sản phẩm
 * @property {mongoose.Schema.Types.ObjectId} createdBy - Tham chiếu đến người tạo sản phẩm
 * @property {Date} createdAt - Thời điểm tạo sản phẩm, mặc định là thời điểm hiện tại
 * @property {Date} updatedAt - Thời điểm cập nhật sản phẩm gần nhất, mặc định là thời điểm hiện tại
 */
export const ProductSchema = mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  price: { type: Number, required: true },
  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category', 
    required: true 
  },
  productImages: { // Fix typo: image -> images
    type: [String], // Changed to array of strings for multiple images
    required: false,
  },
  fieldValues: [ProductFieldValueSchema], // Replace fields with fieldValues
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {timestamps: true}) // Fix typo: timestamp -> timestamps

/**
 * @name ProductModel
 * @author hungtran3011
 * @type {mongoose.Model}
 * @description Model cho ProductSchema, cho phép thực hiện các thao tác CRUD trên sản phẩm
 */
const ProductModel = mongoose.model(
  'Product', 
  ProductSchema
);

export {ProductModel as Product, CategoryModel as Category};
