import { OrderModel } from "./order.schema.js";
import { debugLogger } from "../../common/middlewares/debug-logger.js";
import mailService from "../../common/services/mail.service.js";

const logger = debugLogger("order-service");

/**
 * Get all orders - admins see all orders, customers see their own
 * @param {string} status - Optional filter by status
 * @param {Object} user - User object
 * @param {number} page - Page number for pagination
 * @param {number} limit - Number of orders per page
 * @returns {Promise<Object>} List of orders with pagination info
 */
const getAllOrders = async (status, user, page = 1, limit = 10) => {
  logger.debug(`getAllOrders: Starting to fetch orders for user ${user?.id || 'unknown'} with role ${user?.role || 'unknown'}`);
  
  // Check if user object is valid
  if (!user || (!user.id && !user._id)) {
    logger.error('getAllOrders: Invalid user object provided');
    throw new Error("Invalid user information provided");
  }
  
  const allowedStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  let query = {};
  
  // Apply status filter if valid
  if (typeof status === "string" && allowedStatuses.includes(status)) {
    query.status = status;
    logger.debug(`getAllOrders: Filtering by status: ${status}`);
  } else if (status) {
    logger.error(`getAllOrders: Invalid status value provided: ${status}`);
    throw new Error("Invalid status value provided");
  }
  
  // If not admin, only show user's own orders
  if (user.role !== "admin") {
    // Use ObjectId or string based on what's available
    const userId = user.id || user._id;
    // Convert to string to avoid type issues
    query.user = userId.toString();
    logger.debug(`getAllOrders: Filtering by user ID: ${userId}`);
  } else {
    logger.debug('getAllOrders: Admin user - showing all orders');
  }
  
  try {
    // Convert page and limit to numbers with defaults
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    
    logger.debug(`getAllOrders: Pagination settings - page: ${pageNum}, limit: ${limitNum}, skip: ${skip}`);
    logger.debug(`getAllOrders: Executing query: ${JSON.stringify(query)}`);
    
    // Get total count for pagination info
    const total = await OrderModel.countDocuments(query);
    logger.debug(`getAllOrders: Total matching orders: ${total}`);
    
    // Query with pagination
    const orders = await OrderModel.find(query)
      .populate("user", "email name")
      .populate("items.product", "name price productImages")
      .sort({ createdAt: -1 })  // Sort by newest first
      .skip(skip)
      .limit(limitNum);
    
    logger.debug(`getAllOrders: Retrieved ${orders.length} orders`);
    
    // Return properly structured response
    return {
      orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    };
  } catch (error) {
    logger.error(`getAllOrders: Database query failed: ${error.message}`);
    throw new Error(`Failed to retrieve orders: ${error.message}`);
  }
};

/**
 * Get an order by ID - with permission check
 * @param {string} id - Order ID
 * @param {Object} user - User requesting the order
 * @returns {Promise<Object>} Order object
 */
const getOrderById = async (id, user) => {
  logger.debug(`getOrderById: Finding order ${id} for user ${user.id} with role ${user.role}`);
  
  const order = await OrderModel.findById(id)
    .populate("user", "email name")
    .populate("items.product", "name price productImages");
  
  if (!order) {
    logger.error(`getOrderById: Order ${id} not found`);
    throw new Error("Order not found");
  }
  
  logger.debug(`getOrderById: Found order ${id}, checking permissions`);
  
  // Check permissions - only admin or the order owner can see it
  if (user.role !== "admin" && order.user._id.toString() !== user.id.toString()) {
    logger.warn(`getOrderById: User ${user.id} unauthorized to access order ${id}`);
    throw new Error("Not authorized to access this order");
  }
  
  logger.debug(`getOrderById: Successfully retrieved order ${id}`);
  return order;
};

/**
 * Create a new order
 * @param {Object} orderData - Order data
 * @returns {Promise<Object>} Created order
 */
const createOrder = async (orderData) => {
  logger.debug('createOrder: Starting to create new order');
  const { items, shippingAddress, paymentDetails, user } = orderData;
  
  logger.debug(`createOrder: Order for user: ${user}, payment method: ${paymentDetails?.method}, items count: ${items?.length || 0}`);
  
  // Validate required parameters
  if (!items || !Array.isArray(items) || items.length === 0) {
    logger.error('createOrder: Missing or empty items array');
    throw new Error("Order must contain at least one item");
  }
  if (!shippingAddress) {
    logger.error('createOrder: Missing shipping address');
    throw new Error("Shipping address is required");
  }
  if (!paymentDetails) {
    logger.error('createOrder: Missing payment details');
    throw new Error("Payment details are required");
  }
  if (!user) {
    logger.error('createOrder: Missing user');
    throw new Error("User is required");
  }
  
  // Calculate total amount from items
  const totalAmount = items.reduce(
    (sum, item) => sum + (item.unitPrice * item.quantity) + (item.deliveryFee || 0), 
    0
  );
  
  logger.debug(`createOrder: Calculated total amount: ${totalAmount}`);
  
  const newOrder = new OrderModel({
    items,
    shippingAddress,
    paymentDetails,
    user,
    status: "pending",
    totalAmount
  });
  
  logger.debug('createOrder: Saving order to database');
  const savedOrder = await newOrder.save();
  logger.debug(`createOrder: Order saved successfully with ID: ${savedOrder._id}`);
  
  // Send order confirmation email
  try {
    logger.debug(`createOrder: Sending confirmation email to user`);
    await mailService.sendOrderConfirmation(
      savedOrder.user.email,
      savedOrder._id,
      savedOrder.items,
      savedOrder.shippingAddress,
      savedOrder.totalAmount
    );
    logger.debug('createOrder: Confirmation email sent successfully');
  } catch (error) {
    logger.error(`createOrder: Failed to send order confirmation email: ${error.message}`);
  }
  
  logger.debug('createOrder: Returning order with populated product info');
  return savedOrder.populate("items.product");
};

/**
 * Create a new order for guest users
 * @param {Object} orderData - Order data
 * @returns {Promise<Object>} Created order
 */
const createGuestOrderService = async (orderData) => {
  logger.debug('createGuestOrderService: Starting to create new guest order');
  const { items, shippingAddress, paymentDetails, customerInfo } = orderData;
  
  logger.debug(`createGuestOrderService: Guest order with ${items?.length || 0} items, contact: ${customerInfo?.email || customerInfo?.phoneNumber || 'unknown'}`);
  
  // Validate required parameters
  if (!items || !Array.isArray(items) || items.length === 0) {
    logger.error('createGuestOrderService: Missing or empty items array');
    throw new Error("Order must contain at least one item");
  }
  if (!shippingAddress) {
    logger.error('createGuestOrderService: Missing shipping address');
    throw new Error("Shipping address is required");
  }
  if (!customerInfo) {
    logger.error('createGuestOrderService: Missing customer information');
    throw new Error("Customer information is required");
  }
  if (!customerInfo.phoneNumber) {
    logger.error('createGuestOrderService: Missing phone number');
    throw new Error("Phone number is required for guest orders");
  }
  
  // Ensure COD payment method
  if (paymentDetails.method !== "cash") {
    logger.error(`createGuestOrderService: Invalid payment method: ${paymentDetails.method} - guest orders only support cash`);
    throw new Error("Guest checkout only supports Cash on Delivery");
  }
  
  // Calculate total amount from items
  const totalAmount = items.reduce(
    (sum, item) => sum + (item.unitPrice * item.quantity) + (item.deliveryFee || 0), 
    0
  );
  
  logger.debug(`createGuestOrderService: Calculated total amount: ${totalAmount}`);
  
  // Generate a random tracking code for guests to check their order
  const trackingCode = generateTrackingCode();
  logger.debug(`createGuestOrderService: Generated tracking code: ${trackingCode}`);
  
  const newOrder = new OrderModel({
    items,
    shippingAddress,
    paymentDetails,
    customerInfo,
    isGuestOrder: true,
    trackingCode,
    status: "pending",
    totalAmount
  });
  
  logger.debug('createGuestOrderService: Saving guest order to database');
  const savedOrder = await newOrder.save();
  logger.debug(`createGuestOrderService: Guest order saved successfully with ID: ${savedOrder._id}`);
  
  // Return the saved order with populated product info
  return savedOrder.populate("items.product");
};

// Generate a unique tracking code for guest orders
const generateTrackingCode = () => {
  logger.debug('generateTrackingCode: Generating new tracking code');
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  const code = `GC-${timestamp}-${randomStr}`;
  logger.debug(`generateTrackingCode: Generated code: ${code}`);
  return code;
};

/**
 * Cancel an order
 * @param {string} id - Order ID
 * @param {Object} user - User cancelling the order
 * @returns {Promise<Object>} Updated order
 */
const cancelOrder = async (id, user) => {
  logger.debug(`cancelOrder: Attempting to cancel order ${id} by user ${user.id} with role ${user.role}`);
  
  const order = await OrderModel.findById(id);
  if (!order) {
    logger.error(`cancelOrder: Order ${id} not found`);
    throw new Error("Order not found");
  }
  
  logger.debug(`cancelOrder: Found order ${id} with status ${order.status}`);
  
  // Check permissions
  if (user.role !== "admin" && order.user.toString() !== user.id) {
    logger.warn(`cancelOrder: User ${user.id} not authorized to cancel order ${id}`);
    throw new Error("Not authorized to cancel this order");
  }
  
  // Business rules: can't cancel shipped or delivered orders
  if (order.status === "shipped" || order.status === "delivered") {
    logger.warn(`cancelOrder: Cannot cancel order ${id} with status ${order.status}`);
    throw new Error("Order cannot be cancelled as it has already been shipped");
  }
  
  logger.debug(`cancelOrder: Setting order ${id} status to cancelled`);
  order.status = "cancelled";
  const updatedOrder = await order.save();
  logger.debug(`cancelOrder: Order ${id} successfully cancelled`);
  
  // Notify user by email
  try {
    if (order.isGuestOrder && order.customerInfo?.email) {
      logger.debug(`cancelOrder: Sending cancellation email to guest ${order.customerInfo.email}`);
      await mailService.sendOrderStatusUpdate(
        order.customerInfo.email,
        updatedOrder._id,
        "cancelled"
      );
    } else if (updatedOrder.user) {
      logger.debug(`cancelOrder: Sending cancellation email to registered user`);
      await mailService.sendOrderStatusUpdate(
        updatedOrder.user.email,
        updatedOrder._id,
        "cancelled"
      );
    }
    logger.debug('cancelOrder: Cancellation email sent successfully');
  } catch (error) {
    logger.error(`cancelOrder: Failed to send cancellation email: ${error.message}`);
  }
  
  return updatedOrder;
};

/**
 * Mark order as complete (admin only)
 * @param {string} id - Order ID
 * @returns {Promise<Object>} Updated order
 */
const completeOrder = async (id) => {
  logger.debug(`completeOrder: Attempting to mark order ${id} as delivered`);
  
  const order = await OrderModel.findById(id);
  if (!order) {
    logger.error(`completeOrder: Order ${id} not found`);
    throw new Error("Order not found");
  }
  
  logger.debug(`completeOrder: Found order ${id} with status ${order.status}`);
  
  // Business rules: only shipped orders can be completed
  if (order.status !== "shipped") {
    logger.warn(`completeOrder: Cannot complete order ${id} with status ${order.status}`);
    throw new Error("Order cannot be completed as it has not been shipped yet");
  }
  
  logger.debug(`completeOrder: Setting order ${id} status to delivered`);
  order.status = "delivered";
  const updatedOrder = await order.save();
  logger.debug(`completeOrder: Order ${id} successfully marked as delivered`);
  
  // Notify user by email
  try {
    // Handle both guest and registered users
    if (order.isGuestOrder && order.customerInfo?.email) {
      logger.debug(`completeOrder: Sending delivery confirmation to guest ${order.customerInfo.email}`);
      await mailService.sendOrderStatusUpdate(
        order.customerInfo.email,
        updatedOrder._id,
        "delivered"
      );
    } else if (updatedOrder.user) {
      logger.debug(`completeOrder: Sending delivery confirmation to registered user`);
      await mailService.sendOrderStatusUpdate(
        updatedOrder.user.email,
        updatedOrder._id,
        "delivered"
      );
    }
    logger.debug('completeOrder: Delivery confirmation email sent successfully');
  } catch (error) {
    logger.error(`completeOrder: Failed to send delivery confirmation email: ${error.message}`);
  }
  
  return updatedOrder;
};

/**
 * Update order details (admin only)
 * @param {string} id - Order ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated order
 */
const updateOrder = async (id, updateData) => {
  logger.debug(`updateOrder: Attempting to update order ${id}`);
  logger.debug(`updateOrder: Update data: ${JSON.stringify(updateData, (key, value) => 
    key === 'paymentDetails' ? '[REDACTED]' : value)}`);
  
  const { status, shippingAddress, paymentDetails } = updateData;
  
  const order = await OrderModel.findById(id);
  if (!order) {
    logger.error(`updateOrder: Order ${id} not found`);
    throw new Error("Order not found");
  }
  
  logger.debug(`updateOrder: Found order ${id} with current status ${order.status}`);
  
  // Update fields if provided
  if (status) {
    logger.debug(`updateOrder: Attempting to change order status from ${order.status} to ${status}`);
    // Validate status transitions
    validateStatusTransition(order.status, status);
    order.status = status;
    logger.debug(`updateOrder: Status updated to ${status}`);
  }
  
  if (shippingAddress) {
    logger.debug(`updateOrder: Updating shipping address for order ${id}`);
    order.shippingAddress = {
      ...order.shippingAddress,
      ...shippingAddress
    };
  }
  
  if (paymentDetails) {
    logger.debug(`updateOrder: Updating payment details for order ${id}`);
    order.paymentDetails = {
      ...order.paymentDetails,
      ...paymentDetails
    };
  }
  
  logger.debug(`updateOrder: Saving updated order ${id}`);
  const updatedOrder = await order.save();
  logger.debug(`updateOrder: Order ${id} updated successfully`);
  
  // Notify user about order status change
  if (status && status !== order.status) {
    try {
      // Handle both guest and registered users
      if (order.isGuestOrder && order.customerInfo?.email) {
        logger.debug(`updateOrder: Sending status update to guest ${order.customerInfo.email}`);
        await mailService.sendOrderStatusUpdate(
          order.customerInfo.email,
          updatedOrder._id,
          status
        );
      } else if (updatedOrder.user) {
        logger.debug(`updateOrder: Sending status update to registered user`);
        await mailService.sendOrderStatusUpdate(
          updatedOrder.user.email,
          updatedOrder._id,
          status
        );
      }
      logger.debug(`updateOrder: Status update email sent successfully`);
    } catch (error) {
      logger.error(`updateOrder: Failed to send status update email: ${error.message}`);
    }
  }
  
  return updatedOrder;
};

/**
 * Validate if the status transition is allowed
 * @param {string} currentStatus - Current status
 * @param {string} newStatus - New status
 */
const validateStatusTransition = (currentStatus, newStatus) => {
  logger.debug(`validateStatusTransition: Validating transition from ${currentStatus} to ${newStatus}`);
  
  const allowedTransitions = {
    'pending': ['processing', 'cancelled'],
    'processing': ['shipped', 'cancelled'],
    'shipped': ['delivered'],
    'delivered': [],  // Terminal state
    'cancelled': []   // Terminal state
  };
  
  if (!allowedTransitions[currentStatus].includes(newStatus)) {
    logger.warn(`validateStatusTransition: Invalid transition from ${currentStatus} to ${newStatus}`);
    throw new Error(`Cannot change order status from ${currentStatus} to ${newStatus}`);
  }
  
  logger.debug(`validateStatusTransition: Transition from ${currentStatus} to ${newStatus} is valid`);
};

export default {
  getAllOrders,
  getOrderById,
  createOrder,
  createGuestOrderService,
  cancelOrder,
  completeOrder,
  updateOrder,
};