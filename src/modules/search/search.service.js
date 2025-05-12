import { Product } from "../product/product.schema.js";
import redisService from '../../common/services/redis.service.js'; 
import { debugLogger } from '../../common/middlewares/debug-logger.js'; 
 
const logger = debugLogger('search-service');

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
      logger.info(`Retrieved search results from cache: ${cacheKey}`);
      return cachedResults;
    }

    // Prepare aggregation pipeline
    const pipeline = [];

    // Add $search stage for full-text search
    if (query && query.trim() !== '') {
      pipeline.push({
        $search: {
          index: 'default', // Replace 'default' with your index name if different
          text: {
            query: query,
            path: ['name', 'description'] // Fields to search
          }
        }
      });
    }

    // Add filters
    const matchStage = {};
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      matchStage.price = {};
      if (filters.minPrice !== undefined) {
        matchStage.price.$gte = Number(filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        matchStage.price.$lte = Number(filters.maxPrice);
      }
    }
    if (filters.category) {
      matchStage.category = filters.category;
    }
    if (filters.fields && Object.keys(filters.fields).length > 0) {
      for (const [fieldName, fieldValue] of Object.entries(filters.fields)) {
        matchStage[`fieldValues.name`] = fieldName;
        matchStage[`fieldValues.value`] = fieldValue;
      }
    }
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Add sorting
    const sortStage = {};
    sortStage[sort] = sortDirection === 'asc' ? 1 : -1;
    pipeline.push({ $sort: sortStage });

    // Add pagination
    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Execute aggregation pipeline
    const products = await Product.aggregate(pipeline).exec();

    // Count total documents (for pagination)
    const total = await Product.aggregate([
      ...pipeline.slice(0, pipeline.length - 2), // Exclude $skip and $limit
      { $count: 'total' }
    ]).exec();
    const totalCount = total.length > 0 ? total[0].total : 0;

    // Format products to include fields as object
    const formattedProducts = products.map(product => {
      const productObj = product;
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
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    };

    // Cache results for 5 minutes
    await redisService.set(cacheKey, result, 300);

    return result;
  } catch (error) {
    logger.error('Search error:', error);
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
    
    // Escape special regex characters to prevent regex injection
    const escapedText = escapeRegExp(text);
    
    // Create safe regex with escaped user input
    const regex = new RegExp(`^${escapedText}`, 'i');
    
    const suggestions = await Product.find({ name: regex })
      .select('name')
      .limit(limit);
    
    const result = suggestions.map(product => product.name);
    
    // Cache for 15 minutes
    await redisService.set(cacheKey, result, 900);
    
    return result;
  } catch (error) {
    logger.error('Suggestion error:', error);
    throw error;
  }
};

/**
 * Escapes special characters in a string for use in a regular expression
 * @param {string} string - The string to escape
 * @returns {string} - The escaped string
 */
function escapeRegExp(string) {
  // Escape special regex characters: ^ $ \ . * + ? ( ) [ ] { } |
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default {
  searchProducts,
  getProductSuggestions
};