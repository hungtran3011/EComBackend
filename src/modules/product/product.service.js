import { Product, Category, ProductVariation } from "./product.schema.js";
import {
  ProductValidationSchema,
  ProductListValidationSchema,
  CategoryValidationSchema,
  CategoriesValidationSchema,
  validateFieldType,
  isValidMongoId,
} from "../../common/validators/product.validator.js";
import redisService from '../../common/services/redis.service.js';
import mongoose, { get } from "mongoose";
import validateObjectId from "../../common/validators/objectId.validator.js";
import { validateProductVariation } from "../../common/validators/variation.validator.js";
import StorageService from "../storage/storage.service.js";
import { debugLogger } from "../../common/middlewares/debug-logger.js";

const logger = debugLogger("product-service");

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

    const result = ProductListValidationSchema.parse({ page, limit, total, products });
    logger.info(`Lấy ${products.length} sản phẩm từ database`);
    return result;
  } catch (error) {
    logger.error("Lỗi khi lấy danh sách sản phẩm:", error);
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

  if (!isValidMongoId(id)) {
    throw new Error("Invalid product ID");
  }


  const cacheKey = `product:${id}`;


  if (!options.skipCache) {

    const cachedProduct = await redisService.get(cacheKey, true);

    if (cachedProduct) {
      logger.info(`Lấy sản phẩm ${id} từ cache`);
      return cachedProduct;
    }
  } else {
    logger.info(`Bỏ qua cache cho sản phẩm ${id} theo yêu cầu của client`);
  }


  const product = await Product.findById(id).populate('category');

  if (!product) {
    throw new Error("Không tìm thấy sản phẩm");
  }


  const productObject = product.toObject();


  const result = {
    ...productObject,
    fields: formatFieldValues(productObject.fieldValues)
  };

  delete result.fieldValues;


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
    logger.error("Lỗi khi đếm sản phẩm:", error);
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
  logger.info(productData);
  const { productImages, variations, ...otherData } = productData;


  const { category, fields, ...basicProductData } = otherData;

  let categoryObjectId;

  try {
    categoryObjectId = validateObjectId(category?._id ?? category);
  }
  catch (error) {
    logger.error("Error validating category ID:", error);
    throw new Error("Invalid category ID");
  }

  const categoryDoc = await Category.findOne({ _id: { $eq: categoryObjectId } });
  if (!categoryDoc) {
    throw new Error("Không tìm thấy danh mục");
  }

  let fieldValues = [];
  if (fields && Object.keys(fields).length > 0) {
    const categoryFieldsMap = {};
    categoryDoc.fields.forEach(field => {
      categoryFieldsMap[field.name] = {
        type: field.type,
        required: field.required
      };
    });

    const missingRequiredFields = [];
    categoryDoc.fields.forEach(field => {
      if (field.required && fields[field.name] === undefined) {
        missingRequiredFields.push(field.name);
      }
    });

    if (missingRequiredFields.length > 0) {
      throw new Error(`Thiếu các trường bắt buộc: ${missingRequiredFields.join(', ')}`);
    }

    for (const [fieldName, fieldValue] of Object.entries(fields)) {
      const categoryField = categoryFieldsMap[fieldName];

      if (!categoryField) {
        throw new Error(`Trường "${fieldName}" không được định nghĩa trong danh mục này`);
      }


      const validationError = validateFieldType(fieldValue, categoryField.type);
      if (validationError) {
        throw new Error(validationError);
      }


      fieldValues.push({
        name: fieldName,
        value: fieldValue
      });
    }
  }


  const productToCreate = {
    ...basicProductData,
    category,
    fieldValues,
    hasVariations: true
  };


  if (productImages && Array.isArray(productImages) && productImages.length > 0) {
    productToCreate.productImages = productImages;
  }

  const addedProduct = new Product(productToCreate);
  await addedProduct.save();

  const result = addedProduct.toObject();
  result.fields = formatFieldValues(result.fieldValues);
  delete result.fieldValues;

  if (!variations || !Array.isArray(variations) || variations.length === 0) {
    await new ProductVariation({
      product: addedProduct._id,
      name: `${addedProduct.name} - Default`,
      price: addedProduct.price,
      sku: addedProduct.sku || `${addedProduct._id}-default`,
      isDefault: true,
      attributes: []
    }).save();
  } else {

    const variationPromises = variations.map(variation => {
      return new ProductVariation({
        product: addedProduct._id,
        ...variation,
        isDefault: variation.isDefault || false
      }).save();
    });
    await Promise.all(variationPromises);
  }

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

  if (!isValidMongoId(id)) {
    throw new Error("Invalid product ID");
  }

  const existingProduct = await Product.findOne({ _id: { $eq: id } });
  if (!existingProduct) {
    throw new Error("Product not found");
  }

  let processedData = { ...updateData };

  if (updateData.category && typeof updateData.category === 'object' && updateData.category._id) {
    processedData.category = updateData.category._id;
  }

  if (updateData.fields && typeof updateData.fields === 'object' && !Array.isArray(updateData.fields)) {


    const fieldMap = {};
    if (existingProduct.fieldValues && existingProduct.fieldValues.length > 0) {
      existingProduct.fieldValues.forEach(field => {
        fieldMap[field.name] = field.value;
      });
    }


    Object.entries(updateData.fields).forEach(([name, value]) => {

      if (value !== undefined && value !== null && value !== '') {
        fieldMap[name] = value;
      }
    });



    const updatedFieldValues = Object.entries(fieldMap).map(([name, value]) => ({
      name,
      value
    }));

    const { fields, ...dataWithoutFields } = processedData;
    processedData = { ...dataWithoutFields, fieldValues: updatedFieldValues };
  }
  if (updateData.productImages !== undefined) {
    processedData.productImages = updateData.productImages;
  }


  if (updateData.variations && Array.isArray(updateData.variations)) {


    for (const variation of updateData.variations) {
      if (variation._id) {

        await updateProductVariationService(variation._id, variation);
      } else {

        variation.product = id;
        await createProductVariationService(id, variation);
      }
    }


    const { variations, ...dataWithoutVariations } = processedData;
    processedData = dataWithoutVariations;
  }

  try {
    const validatedData = ProductValidationSchema.partial().parse(processedData);

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: { $eq: id } },
      { $set: validatedData },
      { new: true, runValidators: true }
    ).populate('category');

    if (!updatedProduct) {
      throw new Error("Failed to update product");
    }

    const result = updatedProduct.toObject();
    result.fields = formatFieldValues(result.fieldValues || []);

    const cacheKey = `product:${id}`;
    await redisService.set(cacheKey, result, 1800);

    return result;
  } catch (error) {
    if (error.name === 'ZodError') {
      logger.error('Validation error:', error.errors);
      throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
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
  const deletedProduct = await Product.findOneAndDelete({ _id: { $eq: id } });
  if (!deletedProduct) throw new Error("Product not found");


  const cacheKey = `product:${id}`;
  await redisService.del(cacheKey);
  logger.info(`Removed product ${id} from cache`);

  return { message: "Product deleted successfully" };
};

/**
 * @name getAllCategoriesService
 * @description Lấy danh sách tất cả các danh mục sản phẩm
 * @returns {Promise<Array>} Danh sách các danh mục
 */
export const getAllCategoriesService = async () => {
  const categories = await Category.find();
  logger.info(categories);
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
  const category = await Category.findOne({ _id: { $eq: id } });
  if (!category) throw new Error("Category not found");
  return CategoryValidationSchema.parse(category);
};

/**
 * @name getCategoryByNameService
 * @description Get category by name with its products, supporting pagination and sorting
 * @param {string} name - Category name
 * @param {Object} options - Query options (optional)
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Products per page (default: 10)
 * @param {string} options.sortBy - Field to sort by (default: 'createdAt')
 * @returns {Promise<Object>} Category with paginated products
 * @throws {Error} If name is invalid or category not found
 */
export const getCategoryByNameService = async (name, options = {}) => {
  logger.info(`Finding category by name: ${name}${options ? ' with options' : ''}`);
  
  if (!name) {
    logger.error("Category name is required but was not provided");
    throw new Error("Category name is required");
  }
  
  // Process name (first letter uppercase, rest lowercase)
  const processedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  logger.info(`Searching for category with processed name: ${processedName}`);
  
  // Find category
  const category = await Category.findOne({ name: { $eq: processedName } });
  
  if (!category) {
    logger.error(`Category with name '${processedName}' not found`);
    throw new Error("Category not found");
  }
  
  logger.info(`Found category: ${category._id} with name '${category.name}'`);
  
  // Return just category if no options provided
  if (!options || Object.keys(options).length === 0) {
    return CategoryValidationSchema.parse(category);
  }
  
  // Sanitize pagination parameters
  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(options.limit) || 10));
  
  // Handle MongoDB sort syntax with hyphen prefix
  let sortField = 'createdAt'; // Default field
  let sortDirection = -1;      // Default direction (newest first)
  
  if (options.sortBy) {
    // Check if sortBy starts with hyphen (indicating descending order)
    if (options.sortBy.startsWith('-')) {
      sortField = options.sortBy.substring(1);
      sortDirection = -1; // Descending
    } else {
      sortField = options.sortBy;
      sortDirection = 1;  // Ascending
    }
    
    // Validate sort field to prevent injection
    const validSortFields = ['name', 'price', 'createdAt', 'updatedAt', 'stock'];
    if (!validSortFields.includes(sortField)) {
      logger.warn(`Invalid sort field: ${sortField}, defaulting to createdAt`);
      sortField = 'createdAt';
      sortDirection = -1;
    }
  }
  
  // Build MongoDB sort object
  const sortOption = {};
  sortOption[sortField] = sortDirection;
  
  logger.info(`Finding products for category ${category._id} with sort: ${JSON.stringify(sortOption)}`);
  
  // Calculate skip for pagination
  const skip = (page - 1) * limit;
  
  // Find products with pagination and sorting
  const products = await Product.find({ category: category._id })
    .sort(sortOption)
    .skip(skip)
    .limit(limit)
    .lean();
  
  // Get total count for pagination
  const total = await Product.countDocuments({ category: category._id });
  
  logger.info(`Found ${products.length} products out of ${total} total for category ${category.name}`);
  
  // Format products to include field values
  const formattedProducts = products.map(product => {
    const result = { ...product };
    if (product.fieldValues) {
      result.fields = formatFieldValues(product.fieldValues);
      delete result.fieldValues;
    }
    return result;
  });
  
  // Return comprehensive response
  return {
    category: CategoryValidationSchema.parse(category),
    products: formattedProducts,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1
    }
  };
};

/**
 * @name createCategoryService
 * @description Tạo một danh mục mới
 * @param {Object} categoryData - Dữ liệu danh mục
 * @returns {Promise<Object>} Danh mục vừa được tạo
 */
export const createCategoryService = async (categoryData) => {
  logger.info(categoryData);
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
  logger.info("Attempting to update category %s with data:", id, updateData);

  try {
    if (!isValidMongoId(id)) {
      logger.error(`Invalid category ID format: ${id}`);
      throw new Error("Invalid category ID");
    }

    const validatedData = {};

    try {
      if (updateData.name !== undefined) {
        logger.info(`Validating category name: ${updateData.name}`);
        validatedData.name = CategoryValidationSchema.shape.name.parse(updateData.name);
      }
    } catch (error) {
      logger.error(`Validation error for category name: ${error.message}`, error);
      throw new Error(`Invalid category name: ${error.message}`);
    }

    try {
      if (updateData.description !== undefined) {
        logger.info(`Validating category description`);
        validatedData.description = CategoryValidationSchema.shape.description.parse(updateData.description);
      }
    } catch (error) {
      logger.error(`Validation error for category description: ${error.message}`, error);
      throw new Error(`Invalid category description: ${error.message}`);
    }

    try {
      if (updateData.fields !== undefined) {
        logger.info(`Validating ${updateData.fields.length} category fields`);
        validatedData.fields = CategoryValidationSchema.shape.fields.parse(updateData.fields);
      }
    } catch (error) {
      logger.error(`Validation error for category fields:`, error);
      throw new Error(`Invalid category fields: ${error.message}`);
    }

    logger.info(`Updating category %s with validated data:`, id, validatedData);

    const updatedCategory = await Category.findOneAndUpdate(
      { _id: { $eq: id } },
      { $set: validatedData },
      { new: true }
    );

    if (!updatedCategory) {
      logger.error(`Category not found with ID: ${id}`);
      throw new Error("Category not found");
    }

    logger.info(`Category ${id} updated successfully`);
    return CategoryValidationSchema.parse(updatedCategory.toObject());
  } catch (error) {
    logger.error(`Error updating category %s:`, id, error);
    if (error.errors) {

      logger.error(`Validation errors:`, JSON.stringify(error.errors, null, 2));
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
  const deletedCategory = await Category.findOneAndDelete({ _id: { $eq: id } });
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


  const product = await Product.findOne({ _id: { $eq: id } });
  if (!product) {
    throw new Error("Product not found");
  }


  const currentImages = product.productImages || [];
  const updatedImages = [...currentImages, ...imageUrls];


  const updatedProduct = await Product.findOneAndUpdate(
    { _id: { $eq: id } },
    { $set: { productImages: updatedImages } },
    { new: true }
  );


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


  const product = await Product.findOne({ _id: { $eq: productId } });
  if (!product) {
    throw new Error("Product not found");
  }


  const currentImages = product.productImages || [];
  const updatedImages = currentImages.filter(img => {

    return !img.includes(imageId);
  });


  const updatedProduct = await Product.findOneAndUpdate(
    { _id: { $eq: productId } },
    { $set: { productImages: updatedImages } },
    { new: true }
  );


  const cacheKey = `product:${productId}`;
  const result = updatedProduct.toObject();
  result.fields = formatFieldValues(result.fieldValues || []);
  await redisService.set(cacheKey, result, 1800);

  return result;
};

/**
 * @name createProductVariationService
 * @description Create a new variation for a product
 * @param {string} productId - ID of the parent product
 * @param {Object} variationData - Data for the new variation
 * @returns {Promise<Object>} The created variation
 */
export const createProductVariationService = async (productId, variationData) => {
  if (!isValidMongoId(productId)) {
    throw new Error("Invalid product ID");
  }

  const product = await Product.findOne({ _id: { $eq: productId } });
  if (!product) {
    throw new Error("Product not found");
  }


  const validatedData = validateProductVariation({
    ...variationData,
    product: productId
  });


  const variation = new ProductVariation(validatedData);
  await variation.save();


  await Product.findOneAndUpdate({ _id: { $eq: productId } }, { hasVariations: true });


  if (variation.stock !== undefined) {
    await StorageService.updateVariationQuantity(variation._id, variation.stock);
  }

  return variation.toObject();
};

/**
 * @name getProductVariationsService
 * @description Get all variations for a product
 * @param {string} productId - ID of the product
 * @returns {Promise<Array>} List of variations
 */
export const getProductVariationsService = async (productId) => {
  if (!isValidMongoId(productId)) {
    throw new Error("Invalid product ID");
  }

  return await ProductVariation.find({ product: productId });
};

/**
 * @name updateProductVariationService
 * @description Update a product variation
 * @param {string} variationId - ID of the variation to update
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated variation
 */
export const updateProductVariationService = async (variationId, updateData) => {
  logger.debug(`Starting updateProductVariationService for variation: ${variationId}`);
  logger.debug("Update data received:", updateData);

  if (!isValidMongoId(variationId)) {
    logger.error(`Invalid variation ID format: ${variationId}`);
    throw new Error("Invalid variation ID");
  }
  logger.debug("Variation ID validated successfully");


  logger.debug(`Fetching existing variation with ID: ${variationId}`);
  const existingVariation = await ProductVariation.findOne({ _id: { $eq: variationId } });

  if (!existingVariation) {
    logger.error(`Variation not found with ID: ${variationId}`);
    throw new Error("Variation not found");
  }
  logger.debug(`Found variation: ${existingVariation._id}, product: ${existingVariation.product}`);


  try {
    logger.debug("Validating variation data");
    const validatedData = validateProductVariation({
      ...updateData,
      _id: variationId,
      product: existingVariation.product
    });

    logger.debug("Data validation successful", validatedData);
    logger.debug(`Updating variation in database: ${variationId}`);


    const variation = await ProductVariation.findOneAndUpdate(
      { _id: { $eq: variationId } },
      { $set: validatedData },
      { new: true }
    );

    if (!variation) {
      logger.error(`Database update failed for variation: ${variationId}`);
      throw new Error("Failed to update variation");
    }

    logger.debug(`Variation ${variationId} updated successfully in database`);
    logger.debug(`Updated fields: ${Object.keys(validatedData).join(', ')}`);


    if (updateData.stock !== undefined) {
      logger.debug(`Stock changed to ${updateData.stock}, updating storage for variation: ${variation._id}`);
      await StorageService.updateVariationQuantity(variation._id, variation.stock);
      logger.debug("Storage quantity updated successfully");
    } else {
      logger.debug("Stock unchanged, skipping storage update");
    }

    logger.debug(`Returning updated variation: ${variation._id}`);
    return variation.toObject();
  } catch (error) {
    logger.error(`Error updating variation ${variationId}:`, error);
    logger.error(`Error stack: ${error.stack}`);
    throw error;
  }
};

/**
 * @name deleteProductVariationService
 * @description Delete a product variation
 * @param {string} variationId - ID of the variation to delete
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteProductVariationService = async (variationId) => {
  if (!isValidMongoId(variationId)) {
    throw new Error("Invalid variation ID");
  }

  const variation = await ProductVariation.findByIdAndDelete(variationId);
  if (!variation) {
    throw new Error("Variation not found");
  }


  const remainingVariations = await ProductVariation.countDocuments({
    product: variation.product
  });

  if (remainingVariations === 0) {

    await Product.findOneAndUpdate({ _id: { $eq: variation.product } }, { hasVariations: false });
  }

  return { message: "Variation deleted successfully" };
};

const ProductService = {
  getAllProductsService,
  getProductByIdService,
  createProductService,
  updateProductService,
  deleteProductService,
  getAllCategoriesService,
  getCategoryByIdService,
  getCategoryByNameService,
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
  addProductImagesService,
  removeProductImageService,
  getProductCountService,
  formatFieldValues,
  createProductVariationService,
  getProductVariationsService,
  updateProductVariationService,
  deleteProductVariationService,
}

export default ProductService;
