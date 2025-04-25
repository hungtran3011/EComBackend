import searchService from './search.service.js';
import { cacheMiddleware } from '../../common/middlewares/cache.middleware.js';

const searchProducts = async (req, res) => {
  try {
    const { 
      query, 
      minPrice, 
      maxPrice, 
      category, 
      sort, 
      sortDirection, 
      page, 
      limit,
      ...rest
    } = req.query;

    // Extract custom field filters from query params
    const fieldFilters = {};
    for (const [key, value] of Object.entries(rest)) {
      if (key.startsWith('field.')) {
        const fieldName = key.replace('field.', '');
        fieldFilters[fieldName] = value;
      }
    }

    // Prepare search options
    const searchOptions = {
      query,
      filters: {
        minPrice,
        maxPrice,
        category,
        fields: Object.keys(fieldFilters).length > 0 ? fieldFilters : undefined
      },
      sort,
      sortDirection,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    };

    const results = await searchService.searchProducts(searchOptions);
    return res.status(200).json(results);
  } catch (error) {
    console.error('Search controller error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi tìm kiếm sản phẩm',
      error: error.message
    });
  }
};

const getProductSuggestions = async (req, res) => {
  try {
    const { text, limit } = req.query;

    if (!text) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tham số văn bản là bắt buộc' 
      });
    }

    const suggestions = await searchService.getProductSuggestions(
      text,
      parseInt(limit) || 5
    );

    return res.status(200).json(suggestions);
  } catch (error) {
    console.error('Suggestion controller error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy gợi ý sản phẩm',
      error: error.message
    });
  }
};

const SearchController = {
  searchProducts,
  getProductSuggestions
};

export default SearchController;