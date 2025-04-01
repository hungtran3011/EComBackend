import { Product, Category } from "./product.schema.js";
import { 
  ProductValidationSchema, 
  ProductListValidationSchema, 
  CategoryValidationSchema, 
  CategoriesValidationSchema,
  validateFieldType,
  isValidMongoId,
} from "../../common/validators/product.validator.js";
import redisService from '../../common/services/redis.service.js';

/**
 * @name getAllProductsService
 * @description Lấy danh sách tất cả sản phẩm với phân trang
 * @param {number} page - Số trang
 * @param {number} limit - Số lượng sản phẩm trên mỗi trang
 * @returns {Promise<Object>} Danh sách sản phẩm và thông tin phân trang
 */
export const getAllProductsService = async (page, limit) => {
  const startIndex = (page - 1) * limit;
  const total = await Product.countDocuments();
  const products = await Product.find().skip(startIndex).limit(limit);
  return ProductListValidationSchema.parse({ page, limit, total, products });
};

/**
 * @name getProductByIdService
 * @description Lấy thông tin sản phẩm theo ID, sử dụng cache Redis
 * @param {string} id - ID của sản phẩm
 * @returns {Promise<Object>} Thông tin chi tiết sản phẩm
 */
export const getProductByIdService = async (id) => {
  // Tạo khóa cache
  const cacheKey = `product:${id}`;
  
  // Thử lấy dữ liệu từ cache
  const cachedProduct = await redisService.get(cacheKey, true);
  
  if (cachedProduct) {
    console.log(`Lấy sản phẩm ${id} từ cache`);
    return cachedProduct;
  }
  
  // Nếu không có trong cache, truy vấn từ database
  const product = await Product.findById(id).populate('category');
  
  if (!product) {
    throw new Error("Không tìm thấy sản phẩm");
  }
  
  // Chuyển đổi sang object thuần túy
  const productObject = product.toObject();
  
  // Format response với fields
  const result = {
    ...productObject,
    fields: formatFieldValues(productObject.fieldValues)
  };
  
  delete result.fieldValues;
  
  // Lưu vào cache với thời gian hết hạn 30 phút
  await redisService.set(cacheKey, result, 1800);
  
  return result;
};

/**
 * @name createProductService
 * @description Tạo một sản phẩm mới với các trường động từ danh mục
 * @param {Object} productData - Dữ liệu sản phẩm
 * @returns {Promise<Object>} Sản phẩm vừa được tạo
 * @throws {Error} Nếu trường dữ liệu không khớp với định nghĩa danh mục
 */
export const createProductService = async (productData) => {
  // Validate basic product data
  const { category, fields, ...basicProductData } = productData;
  
  // Check if category exists
  if (!isValidMongoId(category)) {
    throw new Error("ID danh mục không hợp lệ");
  }
  
  const categoryDoc = await Category.findById(category);
  if (!categoryDoc) {
    throw new Error("Không tìm thấy danh mục");
  }
  
  // Process dynamic fields
  let fieldValues = [];
  if (fields && Object.keys(fields).length > 0) {
    // Create map of category fields for validation
    const categoryFieldsMap = {};
    categoryDoc.fields.forEach(field => {
      categoryFieldsMap[field.name] = {
        type: field.type,
        required: field.required
      };
    });
    
    // Validate required fields
    const missingRequiredFields = [];
    categoryDoc.fields.forEach(field => {
      if (field.required && fields[field.name] === undefined) {
        missingRequiredFields.push(field.name);
      }
    });
    
    if (missingRequiredFields.length > 0) {
      throw new Error(`Thiếu các trường bắt buộc: ${missingRequiredFields.join(', ')}`);
    }
    
    // Process and validate provided fields
    for (const [fieldName, fieldValue] of Object.entries(fields)) {
      const categoryField = categoryFieldsMap[fieldName];
      
      // Check if field is defined in category
      if (!categoryField) {
        throw new Error(`Trường "${fieldName}" không được định nghĩa trong danh mục này`);
      }
      
      // Type validation
      const validationError = validateFieldType(fieldValue, categoryField.type);
      if (validationError) {
        throw new Error(validationError);
      }
      
      // Add to fieldValues
      fieldValues.push({
        name: fieldName,
        value: fieldValue
      });
    }
  }
  
  // Create product with validated data
  const productToCreate = {
    ...basicProductData,
    category,
    fieldValues
  };
  
  const addedProduct = new Product(productToCreate);
  await addedProduct.save();
  
  // Format response to include fields as object
  const result = addedProduct.toObject();
  result.fields = formatFieldValues(result.fieldValues);
  delete result.fieldValues;
  
  return result;
};

/**
 * Helper to format fieldValues array into fields object
 * @param {Array} fieldValues - Array of field name-value pairs
 * @returns {Object} Object with field names as keys and values as values
 */
const formatFieldValues = (fieldValues) => {
  if (!fieldValues || fieldValues.length === 0) return {};
  
  return fieldValues.reduce((obj, field) => {
    obj[field.name] = field.value;
    return obj;
  }, {});
};

/**
 * @name updateProductService
 * @description Cập nhật thông tin sản phẩm
 * @param {string} id - ID của sản phẩm
 * @param {Object} updateData - Dữ liệu cần cập nhật
 * @returns {Promise<Object>} Sản phẩm sau khi được cập nhật
 * @throws {Error} Nếu ID không hợp lệ hoặc không tìm thấy sản phẩm
 */
export const updateProductService = async (id, updateData) => {
  if (!isValidMongoId(id)) throw new Error("Invalid product ID");
  const validatedData = ProductValidationSchema.partial().parse(updateData);
  const updatedProduct = await Product.findByIdAndUpdate(id, { $set: validatedData }, { new: true });
  if (!updatedProduct) throw new Error("Product not found");
  return ProductValidationSchema.parse(updatedProduct.toObject());
};

/**
 * @name deleteProductService
 * @description Xóa sản phẩm theo ID
 * @param {string} id - ID của sản phẩm
 * @returns {Promise<Object>} Thông báo xóa thành công
 * @throws {Error} Nếu ID không hợp lệ hoặc không tìm thấy sản phẩm
 */
export const deleteProductService = async (id) => {
  if (!isValidMongoId(id)) throw new Error("Invalid product ID");
  const deletedProduct = await Product.findByIdAndDelete(id);
  if (!deletedProduct) throw new Error("Product not found");
  return { message: "Product deleted successfully" };
};

/**
 * @name getAllCategoriesService
 * @description Lấy danh sách tất cả các danh mục sản phẩm
 * @returns {Promise<Array>} Danh sách các danh mục
 */
export const getAllCategoriesService = async () => {
  const categories = await Category.find();
  return CategoriesValidationSchema.parse(categories);
};

/**
 * @name getCategoryByIdService
 * @description Lấy thông tin chi tiết của danh mục theo ID
 * @param {string} id - ID của danh mục
 * @returns {Promise<Object>} Thông tin chi tiết của danh mục
 * @throws {Error} Nếu ID không hợp lệ hoặc không tìm thấy danh mục
 */
export const getCategoryByIdService = async (id) => {
  if (!isValidMongoId(id)) throw new Error("Invalid category ID");
  const category = await Category.findById(id);
  if (!category) throw new Error("Category not found");
  return CategoryValidationSchema.parse(category);
};

/**
 * @name createCategoryService
 * @description Tạo một danh mục mới
 * @param {Object} categoryData - Dữ liệu danh mục
 * @returns {Promise<Object>} Danh mục vừa được tạo
 */
export const createCategoryService = async (categoryData) => {
  const newCategory = CategoryValidationSchema.parse(categoryData);
  const addedCategory = new Category(newCategory);
  await addedCategory.save();
  return CategoryValidationSchema.parse(addedCategory.toObject());
};

/**
 * @name updateCategoryService
 * @description Cập nhật thông tin danh mục
 * @param {string} id - ID của danh mục
 * @param {Object} updateData - Dữ liệu cần cập nhật
 * @returns {Promise<Object>} Danh mục sau khi được cập nhật
 * @throws {Error} Nếu ID không hợp lệ hoặc không tìm thấy danh mục
 */
export const updateCategoryService = async (id, updateData) => {
  if (!isValidMongoId(id)) throw new Error("Invalid category ID");
  const validatedData = {};
  if (updateData.name !== undefined) validatedData.name = CategoryValidationSchema.shape.name.parse(updateData.name);
  if (updateData.description !== undefined) validatedData.description = CategoryValidationSchema.shape.description.parse(updateData.description);
  if (updateData.fields !== undefined) validatedData.fields = CategoryValidationSchema.shape.fields.parse(updateData.fields);
  const updatedCategory = await Category.findByIdAndUpdate(id, { $set: validatedData }, { new: true });
  if (!updatedCategory) throw new Error("Category not found");
  return CategoriesValidationSchema.parse(updatedCategory.toObject());
};

/**
 * @name deleteCategoryService
 * @description Xóa danh mục theo ID
 * @param {string} id - ID của danh mục
 * @returns {Promise<Object>} Thông báo xóa thành công
 * @throws {Error} Nếu ID không hợp lệ hoặc không tìm thấy danh mục
 */
export const deleteCategoryService = async (id) => {
  if (!isValidMongoId(id)) throw new Error("Invalid category ID");
  const deletedCategory = await Category.findByIdAndDelete(id);
  if (!deletedCategory) throw new Error("Category not found");
  return { message: "Category deleted successfully" };
};
