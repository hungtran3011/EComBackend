import Cart from './cart.schema.js';

const getCartByUserId = async (userId) => {
  return await Cart.findOne({ user: userId }).populate('items.product');
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

  return await cart.save();
};

const updateCartItemQuantity = async (userId, productId, quantity) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new Error('Cart not found');

  const item = cart.items.find(item => item.product.toString() === productId);
  if (!item) throw new Error('Item not found in cart');

  item.quantity = quantity;
  return await cart.save();
};

const deleteCartItem = async (userId, productId) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new Error('Cart not found');

  cart.items = cart.items.filter(item => item.product.toString() !== productId);
  return await cart.save();
};

export default {
  getCartByUserId,
  addItemToCart,
  updateCartItemQuantity,
  deleteCartItem,
};