import { MongoDBClient } from "../../common/services/mongo.service";
import { Product } from "../product/product.schema.js";
import redisService from '../../common/services/redis.service.js';

/**
 * Search for products with various filter options
 * @param {Object} options - Search options
 * @param {string} [options.query=''] - Text to search in name and description
 * @param {Object} [options.filters={}] - Additional filters
 * @param {number} [options.filters.minPrice] - Minimum price
 * @param {number} [options.filters.maxPrice] - Maximum price
 * @param {string} [options.filters.category] - Category ID to filter by
 * @param {Object} [options.filters.fields] - Custom field filters
 * @param {string} [options.sort='createdAt'] - Field to sort by
 * @param {string} [options.sortDirection='desc'] - Sort direction ('asc' or 'desc')
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=10] - Number of results per page
 * @returns {Promise<Object>} Search results with pagination info
 */
export const searchProducts = async (options = {}) => {
  try {
    const {
      query = '',
      filters = {},
      sort = 'createdAt',
      sortDirection = 'desc',
      page = 1,
      limit = 10
    } = options;

    // Prepare cache key
    const cacheKey = `search:${JSON.stringify({
      query, filters, sort, sortDirection, page, limit
    })}`;

    // Check cache first
    const cachedResults = await redisService.get(cacheKey, true);
    if (cachedResults) {
      console.log(`Retrieved search results from cache: ${cacheKey}`);
      return cachedResults;
    }

    // Prepare search query
    const searchQuery = {};
    
    // Text search
    if (query && query.trim() !== '') {
      // Use text index if available, otherwise use regex
      // Note: This requires a text index on name and description fields
      // db.products.createIndex({ name: "text", description: "text" })
      try {
        searchQuery.$text = { $search: query };
      } catch (error) {
        // Fallback to regex if text search fails or index doesn't exist
        searchQuery.$or = [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ];
      }
    }
    
    // Price range filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      searchQuery.price = {};
      if (filters.minPrice !== undefined) {
        searchQuery.price.$gte = Number(filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        searchQuery.price.$lte = Number(filters.maxPrice);
      }
    }
    
    // Category filter
    if (filters.category) {
      searchQuery.category = filters.category;
    }
    
    // Custom field filters
    if (filters.fields && Object.keys(filters.fields).length > 0) {
      // Handle custom field filtering
      // This approach works with MongoDB's dot notation
      for (const [fieldName, fieldValue] of Object.entries(filters.fields)) {
        searchQuery[`fieldValues.name`] = fieldName;
        searchQuery[`fieldValues.value`] = fieldValue;
      }
    }

    // Prepare sort options
    const sortOptions = {};
    sortOptions[sort] = sortDirection === 'asc' ? 1 : -1;
    
    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const total = await Product.countDocuments(searchQuery);
    const products = await Product.find(searchQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('category');
    
    // Format products to include fields as object
    const formattedProducts = products.map(product => {
      const productObj = product.toObject();
      
      // Convert fieldValues array to object for easier client-side handling
      if (productObj.fieldValues && Array.isArray(productObj.fieldValues)) {
        productObj.fields = {};
        productObj.fieldValues.forEach(field => {
          productObj.fields[field.name] = field.value;
        });
        delete productObj.fieldValues;
      }
      
      return productObj;
    });
    
    // Prepare result
    const result = {
      products: formattedProducts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
    
    // Cache results for 5 minutes
    await redisService.set(cacheKey, result, 300);
    
    return result;
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
};

/**
 * Get product suggestions based on partial text input
 * @param {string} text - Partial text to get suggestions for
 * @param {number} [limit=5] - Maximum number of suggestions
 * @returns {Promise<Array>} - Array of product name suggestions
 */
export const getProductSuggestions = async (text, limit = 5) => {
  try {
    if (!text || text.trim() === '') {
      return [];
    }
    
    const cacheKey = `suggestions:${text}:${limit}`;
    
    // Check cache first
    const cachedSuggestions = await redisService.get(cacheKey, true);
    if (cachedSuggestions) {
      return cachedSuggestions;
    }
    
    // Find products with names starting with the text
    const regex = new RegExp(`^${text}`, 'i');
    const suggestions = await Product.find({ name: regex })
      .select('name')
      .limit(limit);
    
    const result = suggestions.map(product => product.name);
    
    // Cache for 15 minutes
    await redisService.set(cacheKey, result, 900);
    
    return result;
  } catch (error) {
    console.error('Suggestion error:', error);
    throw error;
  }
};

export default {
  searchProducts,
  getProductSuggestions
};