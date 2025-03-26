/**
 * @name product.validator.js
 * @author hungtran3011
 * @description Module chứa các schema xác thực dữ liệu cho sản phẩm và danh mục, sử dụng thư viện Zod.
 * Module này tách riêng logic xác thực ra khỏi controllers để tuân thủ nguyên tắc phân tách trách nhiệm,
 * giúp code dễ bảo trì và tái sử dụng hơn.
 */
import mongoose from "mongoose";
import { z } from "zod";

/**
 * @name isValidObjectIdWithOptions
 * @author hungtran3011
 * @description Hàm cốt lõi để kiểm tra tính hợp lệ của MongoDB ObjectId với các tùy chọn cấu hình
 * @param {string|undefined|null} val - Giá trị cần kiểm tra
 * @param {Object} [options] - Tùy chọn kiểm tra
 * @param {boolean} [options.allowEmpty=false] - Cho phép giá trị undefined/null (cho trường không bắt buộc)
 * @returns {boolean} true nếu giá trị hợp lệ theo tiêu chí, false nếu không hợp lệ
 */
const isValidObjectIdWithOptions = (val, options = { allowEmpty: false }) => {
  // Xử lý các giá trị falsy (empty string, undefined, null)
  if (!val) {
    // Chuỗi rỗng luôn không hợp lệ
    if (val === '') return false;
    
    // Với undefined/null, phụ thuộc vào tùy chọn
    return options.allowEmpty;
  }
  
  // Kiểm tra có phải là MongoDB ObjectId hợp lệ không
  return mongoose.Types.ObjectId.isValid(val);
};

/**
 * @name isValidSchemaObjectId
 * @author hungtran3011
 * @description Trình xác thực ObjectId cho schema Zod, cho phép undefined/null cho trường không bắt buộc
 * @param {string|undefined|null} val - Giá trị cần kiểm tra
 * @returns {boolean} true nếu giá trị là ObjectId hợp lệ hoặc undefined/null, false nếu không hợp lệ
 */
const isValidObjectIdAllowEmpty = (val) => isValidObjectIdWithOptions(val, { allowEmpty: true });

/**
 * @name isValidMongoId
 * @author hungtran3011
 * @description Hàm trợ giúp kiểm tra ID MongoDB dùng trong controllers, yêu cầu ID phải tồn tại và hợp lệ
 * @param {string} id - ID cần kiểm tra
 * @returns {boolean} true nếu ID tồn tại và hợp lệ, false nếu không
 */
export const isValidMongoId = (id) => isValidObjectIdWithOptions(id);

/**
 * @name ProductSchema
 * @description Schema xác thực dữ liệu sản phẩm trước khi thực hiện các thao tác CRUD.
 * Đảm bảo rằng dữ liệu sản phẩm đầy đủ và đúng định dạng, bao gồm biến đổi dữ liệu như cắt khoảng trắng
 * và làm tròn giá tiền.
 * @type {z.ZodObject}
 */
export const ProductSchema = z.object({
  name: z.string()
    .min(1, "Product name cannot be empty")
    .max(200, "Product name too long")
    .transform(val => val.trim()),
    
  description: z.string()
    .max(5000, "Description too long")
    .optional()
    .transform(val => val ? val.trim() : val),
    
  price: z.number()
    .positive("Price must be positive")
    .transform(val => Math.round(val * 100) / 100), // Round to 2 decimal places
    
  category: z.string()
    .refine(isValidObjectIdAllowEmpty, "Invalid category ID format")
    .optional(),
    
  fields: z.array(
    z.object({
      name: z.string().min(1, "Field name required").max(100),
      type: z.enum([
        'String', 'Number', 'Date', 'Boolean', 
        'ObjectId', 'Array', 'Mixed'
      ]),
      required: z.boolean().default(false)
    })
  ).max(50, "Too many custom fields").optional(),
  
  createdBy: z.string()
    .refine(isValidObjectIdAllowEmpty, "Invalid user ID format")
    .optional()
});

/**
 * @name ProductListSchema
 * @description Schema xác thực danh sách sản phẩm kèm thông tin phân trang.
 * Được sử dụng để đảm bảo dữ liệu trả về khi lấy danh sách sản phẩm có cấu trúc phù hợp,
 * bao gồm số trang, giới hạn sản phẩm trên mỗi trang, tổng số sản phẩm và danh sách sản phẩm.
 * @type {z.ZodObject}
 */
export const ProductListSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  total: z.number().optional(),
  products: z.array(ProductSchema),
});

/**
 * @name CategorySchema
 * @description Schema xác thực dữ liệu danh mục sản phẩm.
 * Đảm bảo rằng dữ liệu danh mục đầy đủ và đúng định dạng, bao gồm tên, mô tả,
 * các trường dữ liệu đặc thù của danh mục và thông tin người tạo.
 * @type {z.ZodObject}
 */
export const CategorySchema = z.object({
  id: z.string()
    .refine(isValidObjectIdAllowEmpty, "Invalid category ID format")
    .optional(),
  name: z.string()
    .min(1, "Tên danh mục không được để trống")
    .transform(val => val.trim()),
  description: z.string()
    .optional()
    .transform(val => val ? val.trim() : val),
  fields: z.array(z.object({
    name: z.string()
      .min(1, "Tên trường không được để trống")
      .transform(val => val.trim()),
    type: z.enum([
      'String', 
      'Number', 
      'Date', 
      'Boolean', 
      'ObjectId', 
      'Array', 
      'Mixed'
    ], "Loại trường không hợp lệ"),
    required: z.boolean().default(false)
  })).optional(),
  createdBy: z.string()
    .refine(isValidObjectIdAllowEmpty, "Invalid user ID format")
    .optional(),
});

export const PaginationValidation = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().default(10),
});
