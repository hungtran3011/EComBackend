import Cart from './cart.schema.js';
import redisService from '../../common/services/redis.service.js';

const getCartByUserId = async (userId) => {
  // Check Redis cache first
  const cacheKey = `cart_${userId}`;
  try {
    const cachedCart = await redisService.get(cacheKey, true); // true for JSON parsing
    if (cachedCart) {
      return cachedCart;
    }
  } catch (error) {
    console.error(`Cache get error: ${error.message}`);
    // Continue execution even if cache fails
  }
  
  // Retrieve from database if not in cache
  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  
  // Cache the result for 5 minutes (300 seconds)
  if (cart) {
    try {
      await redisService.set(cacheKey, cart, 300);
    } catch (error) {
      console.error(`Cache set error: ${error.message}`);
    }
  }
  
  return cart;
};

const addItemToCart = async (userId, productId, quantity) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = new Cart({ user: userId, items: [] });
  }

  const existingItem = cart.items.find(item => item.product.toString() === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({ product: productId, quantity });
  }

  await cart.save();
  
  // Invalidate the cache after updating
  try {
    await redisService.delete(`cart_${userId}`);
  } catch (error) {
    console.error(`Cache invalidation error: ${error.message}`);
  }
  
  return cart;
};

const updateCartItemQuantity = async (userId, productId, quantity) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new Error('Cart not found');

  const item = cart.items.find(item => item.product.toString() === productId);
  if (!item) throw new Error('Item not found in cart');

  item.quantity = quantity;
  await cart.save();
  
  // Invalidate the cache after updating
  try {
    await redisService.delete(`cart_${userId}`);
  } catch (error) {
    console.error(`Cache invalidation error: ${error.message}`);
  }
  
  return cart;
};

const deleteCartItem = async (userId, productId) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new Error('Cart not found');

  cart.items = cart.items.filter(item => item.product.toString() !== productId);
  await cart.save();
  
  // Invalidate the cache after updating
  try {
    await redisService.delete(`cart_${userId}`);
  } catch (error) {
    console.error(`Cache invalidation error: ${error.message}`);
  }
  
  // Return populated cart for consistency
  return await Cart.findById(cart._id).populate('items.product');
};

export default {
  getCartByUserId,
  addItemToCart,
  updateCartItemQuantity,
  deleteCartItem,
};