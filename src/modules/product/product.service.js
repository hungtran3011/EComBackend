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
import mongoose from "mongoose";
import validateObjectId from "../../common/validators/objectId.validator.js";

/**
 * @name getAllProductsService
 * @description Lấy danh sách tất cả sản phẩm với phân trang
 * @param {number} page - Số trang
 * @param {number} limit - Số lượng sản phẩm trên mỗi trang
 * @returns {Promise<Object>} Danh sách sản phẩm và thông tin phân trang
 */
export const getAllProductsService = async (page, limit) => {
  try {
    const startIndex = (page - 1) * limit;
    const total = await Product.countDocuments();
    const products = await Product.find().skip(startIndex).limit(limit);
    console.log(products)
    const result = ProductListValidationSchema.parse({ page, limit, total, products });
    console.log(`Lấy ${products.length} sản phẩm từ database`);
    return result;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm:", error);
    throw new Error("Không thể lấy danh sách sản phẩm");
  }
};

/**
 * @name getProductByIdService
 * @description Lấy thông tin sản phẩm theo ID, sử dụng cache Redis hoặc bỏ qua cache nếu client yêu cầu
 * @param {string} id - ID của sản phẩm
 * @param {Object} options - Các tùy chọn truy vấn
 * @param {boolean} options.skipCache - Bỏ qua cache nếu true
 * @returns {Promise<Object>} Thông tin chi tiết sản phẩm
 */
export const getProductByIdService = async (id, options = {}) => {
  // Kiểm tra ID hợp lệ
  if (!isValidMongoId(id)) {
    throw new Error("Invalid product ID");
  }

  // Tạo khóa cache
  const cacheKey = `product:${id}`;

  // Kiểm tra xem có cần bỏ qua cache không
  if (!options.skipCache) {
    // Thử lấy dữ liệu từ cache
    const cachedProduct = await redisService.get(cacheKey, true);

    if (cachedProduct) {
      console.log(`Lấy sản phẩm ${id} từ cache`);
      return cachedProduct;
    }
  } else {
    console.log(`Bỏ qua cache cho sản phẩm ${id} theo yêu cầu của client`);
  }

  // Nếu không có trong cache hoặc bỏ qua cache, truy vấn từ database
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

  // Lưu vào cache nếu không yêu cầu bỏ qua cache
  if (!options.skipCache) {
    await redisService.set(cacheKey, result, 1800);
  }

  return result;
};

export const getProductCountService = async () => {
  try {
    const count = await Product.countDocuments();
    return count;
  } catch (error) {
    console.error("Lỗi khi đếm sản phẩm:", error);
    throw new Error("Không thể đếm sản phẩm");
  }
}

/**
 * @name createProductService
 * @description Tạo một sản phẩm mới với các trường động từ danh mục
 * @param {Object} productData - Dữ liệu sản phẩm
 * @returns {Promise<Object>} Sản phẩm vừa được tạo
 * @throws {Error} Nếu trường dữ liệu không khớp với định nghĩa danh mục
 */
export const createProductService = async (productData) => {
  console.log(productData);
  const { productImages, ...otherData } = productData;

  // Validate basic product data
  const { category, fields, ...basicProductData } = otherData;

  // Check if category exists
  let categoryObjectId = category._id;
  if (!validateObjectId(categoryObjectId)) {
    throw new Error("Invalid category ID");
  }

  // Now use the categoryObjectId for the database query
  const categoryDoc = await Category.findById(categoryObjectId);
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

  // Add productImages to the product if provided
  if (productImages && Array.isArray(productImages) && productImages.length > 0) {
    productToCreate.productImages = productImages;
  }

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
 * @description Cập nhật thông tin sản phẩm và cập nhật cache
 * @param {string} id - ID của sản phẩm
 * @param {Object} updateData - Dữ liệu cần cập nhật
 * @returns {Promise<Object>} Sản phẩm sau khi được cập nhật
 * @throws {Error} Nếu ID không hợp lệ hoặc không tìm thấy sản phẩm
 */
export const updateProductService = async (id, updateData) => {
  if (!isValidMongoId(id)) throw new Error("Invalid product ID");

  // First, get the existing product to properly handle field updates
  const existingProduct = await Product.findById(id);
  if (!existingProduct) throw new Error("Product not found");

  // Process category if it's an object with _id
  let processedData = { ...updateData };
  if (updateData.category && typeof updateData.category === 'object' && updateData.category._id) {
    processedData.category = updateData.category._id;
  }

  // Handle fields update
  if (updateData.fields && typeof updateData.fields === 'object' && !Array.isArray(updateData.fields)) {
    // Create a map of existing fieldValues for easy lookup
    const existingFieldsMap = {};
    if (existingProduct.fieldValues && existingProduct.fieldValues.length > 0) {
      existingProduct.fieldValues.forEach(field => {
        existingFieldsMap[field.name] = field.value;
      });
    }

    // First, verify the category has these fields defined
    if (processedData.category) {
      const categoryId = processedData.category;
      const categoryDoc = await Category.findById(categoryId);

      if (categoryDoc) {
        // Create map of valid fields for this category
        const validFieldsMap = {};
        categoryDoc.fields.forEach(field => {
          validFieldsMap[field.name] = {
            type: field.type,
            required: field.required
          };
        });

        // Verify required fields are included
        const missingRequiredFields = categoryDoc.fields
          .filter(field => field.required)
          .filter(field => !updateData.fields[field.name] && !existingFieldsMap[field.name])
          .map(field => field.name);

        if (missingRequiredFields.length > 0) {
          throw new Error(`Thiếu các trường bắt buộc: ${missingRequiredFields.join(', ')}`);
        }
      }
    }

    // Convert object fields to the fieldValues array format
    const updatedFieldValues = [];

    // Add all fields that are being updated
    Object.entries(updateData.fields).forEach(([name, value]) => {
      // Skip empty or undefined values
      if (value !== undefined && value !== null) {
        updatedFieldValues.push({
          name,
          value
        });
      }
    });

    // Add any existing fields that weren't in the update payload
    if (existingProduct.fieldValues && existingProduct.fieldValues.length > 0) {
      existingProduct.fieldValues.forEach(field => {
        // Only add if not already included in the update
        if (updateData.fields[field.name] === undefined) {
          updatedFieldValues.push({
            name: field.name,
            value: field.value
          });
        }
      });
    }

    // Replace fields with fieldValues in the update data
    delete processedData.fields;
    processedData.fieldValues = updatedFieldValues;
  }

  // Handle productImages update if provided
  if (updateData.productImages !== undefined) {
    processedData.productImages = updateData.productImages;
  }

  // Update the product directly without validation
  const updatedProduct = await Product.findByIdAndUpdate(
    id,
    { $set: processedData },
    { new: true, runValidators: false }
  ).populate('category');

  if (!updatedProduct) {
    throw new Error("Failed to update product");
  }

  // Format response to include fields as object
  const result = updatedProduct.toObject();
  result.fields = formatFieldValues(result.fieldValues || []);

  // Update the cache with the latest product data
  const cacheKey = `product:${id}`;
  await redisService.set(cacheKey, result, 1800);
  console.log(`Updated cache for product ${id}`);

  return result;
};

/**
 * @name deleteProductService
 * @description Xóa sản phẩm theo ID và xóa khỏi cache
 * @param {string} id - ID của sản phẩm
 * @returns {Promise<Object>} Thông báo xóa thành công
 * @throws {Error} Nếu ID không hợp lệ hoặc không tìm thấy sản phẩm
 */
export const deleteProductService = async (id) => {
  if (!isValidMongoId(id)) throw new Error("Invalid product ID");
  const deletedProduct = await Product.findByIdAndDelete(id);
  if (!deletedProduct) throw new Error("Product not found");

  // Delete from cache
  const cacheKey = `product:${id}`;
  await redisService.del(cacheKey);
  console.log(`Removed product ${id} from cache`);

  return { message: "Product deleted successfully" };
};

/**
 * @name getAllCategoriesService
 * @description Lấy danh sách tất cả các danh mục sản phẩm
 * @returns {Promise<Array>} Danh sách các danh mục
 */
export const getAllCategoriesService = async () => {
  const categories = await Category.find();
  console.log(categories);
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
  console.log(categoryData);
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
  console.log("Attempting to update category %s with data:", id, updateData);

  try {
    if (!isValidMongoId(id)) {
      console.error(`Invalid category ID format: ${id}`);
      throw new Error("Invalid category ID");
    }

    const validatedData = {};

    try {
      if (updateData.name !== undefined) {
        console.log(`Validating category name: ${updateData.name}`);
        validatedData.name = CategoryValidationSchema.shape.name.parse(updateData.name);
      }
    } catch (error) {
      console.error(`Validation error for category name: ${error.message}`, error);
      throw new Error(`Invalid category name: ${error.message}`);
    }

    try {
      if (updateData.description !== undefined) {
        console.log(`Validating category description`);
        validatedData.description = CategoryValidationSchema.shape.description.parse(updateData.description);
      }
    } catch (error) {
      console.error(`Validation error for category description: ${error.message}`, error);
      throw new Error(`Invalid category description: ${error.message}`);
    }

    try {
      if (updateData.fields !== undefined) {
        console.log(`Validating ${updateData.fields.length} category fields`);
        validatedData.fields = CategoryValidationSchema.shape.fields.parse(updateData.fields);
      }
    } catch (error) {
      console.error(`Validation error for category fields:`, error);
      throw new Error(`Invalid category fields: ${error.message}`);
    }

    console.log(`Updating category ${id} with validated data:`, validatedData);

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { $set: validatedData },
      { new: true }
    );

    if (!updatedCategory) {
      console.error(`Category not found with ID: ${id}`);
      throw new Error("Category not found");
    }

    console.log(`Category ${id} updated successfully`);
    return CategoryValidationSchema.parse(updatedCategory.toObject());
  } catch (error) {
    console.error(`Error updating category ${id}:`, error);
    if (error.errors) {
      // Log validation errors in detail
      console.error(`Validation errors:`, JSON.stringify(error.errors, null, 2));
    }
    throw error;
  }
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

/**
 * @name addProductImagesService
 * @description Add images to an existing product
 * @param {string} id - Product ID
 * @param {Array<string>} imageUrls - Array of image URLs to add
 * @returns {Promise<Object>} Updated product
 */
export const addProductImagesService = async (id, imageUrls) => {
  if (!isValidMongoId(id)) {
    throw new Error("Invalid product ID");
  }

  // Find the product first
  const product = await Product.findById(id);
  if (!product) {
    throw new Error("Product not found");
  }

  // Add new images to the existing array
  const currentImages = product.productImages || [];
  const updatedImages = [...currentImages, ...imageUrls];

  // Update the product
  const updatedProduct = await Product.findByIdAndUpdate(
    id,
    { $set: { productImages: updatedImages } },
    { new: true }
  );

  // Update cache
  const cacheKey = `product:${id}`;
  const result = updatedProduct.toObject();
  result.fields = formatFieldValues(result.fieldValues || []);
  await redisService.set(cacheKey, result, 1800);

  return result;
};

/**
 * @name removeProductImageService
 * @description Remove an image from a product
 * @param {string} productId - Product ID
 * @param {string} imageId - Cloudinary public ID or URL of the image to remove
 * @returns {Promise<Object>} Updated product
 */
export const removeProductImageService = async (productId, imageId) => {
  if (!isValidMongoId(productId)) {
    throw new Error("Invalid product ID");
  }

  // Find the product first
  const product = await Product.findById(productId);
  if (!product) {
    throw new Error("Product not found");
  }

  // Filter out the image to remove
  const currentImages = product.productImages || [];
  const updatedImages = currentImages.filter(img => {
    // Check if the image URL contains the public ID
    return !img.includes(imageId);
  });

  // Update the product
  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    { $set: { productImages: updatedImages } },
    { new: true }
  );

  // Update cache
  const cacheKey = `product:${productId}`;
  const result = updatedProduct.toObject();
  result.fields = formatFieldValues(result.fieldValues || []);
  await redisService.set(cacheKey, result, 1800);

  return result;
};

const ProductService = {
  getAllProductsService,
  getProductByIdService,
  createProductService,
  updateProductService,
  deleteProductService,
  getAllCategoriesService,
  getCategoryByIdService,
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
  addProductImagesService,
  removeProductImageService,
  getProductCountService,
  formatFieldValues,
}

export default ProductService;
