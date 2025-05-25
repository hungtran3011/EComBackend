import mongoose from "mongoose";
import OrderService from "./order.service.js";
import { debugLogger } from "../../common/middlewares/debug-logger.js";

const logger = debugLogger("order-controller");

/**
 * @swagger
 * /order:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *         description: Filter orders by status
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized access
 *       500:
 *         description: Server error
 */
/**
 * Get all orders (filtered by user role)
 */
const getAllOrders = async (req, res) => {
  logger.debug(`getAllOrders: Starting for user ${req.user?.user?.id || 'unknown'} with role ${req.user?.user?.role || 'unknown'}`);
  const { status, page, limit } = req.query;
  
  // Validate user is authenticated
  if (!req.user) {
    logger.error('getAllOrders: No user object in request');
    return res.status(401).json({ message: "Authentication required" });
  }
  
  try {
    // Disable caching to prevent 304 responses
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    logger.debug(`getAllOrders: Calling order service with page=${page}, limit=${limit}`);
    const result = await OrderService.getAllOrders(status, req.user.user, page, limit);
    
    logger.debug(`getAllOrders: Retrieved ${result.orders.length} orders of ${result.pagination.total} total`);
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`getAllOrders: Error getting orders: ${error.message}`);
    
    if (error.message.includes("Invalid user information")) {
      return res.status(400).json({ message: "Invalid user information provided" });
    }
    
    return res.status(500).json({ 
      message: "Error retrieving orders", 
      error: error.message 
    });
  }
};

/**
 * @swagger
 * /api/order/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized access
 *       500:
 *         description: Server error
 */
/**
 * Get order by ID
 */
const getOrderById = async (req, res) => {
  const { id } = req.params;
  logger.debug(`getOrderById: Finding order ${id} for user ${req.user.id}`);
  
  try {
    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn(`getOrderById: Invalid order ID format: ${id}`);
      return res.status(400).json({ message: "Invalid order ID format" });
    }
    
    logger.debug(`getOrderById: Calling order service for order ${id}`);
    const order = await OrderService.getOrderById(id, req.user);
    
    logger.debug(`getOrderById: Successfully retrieved order ${id}`);
    res.status(200).json(order);
  } catch (error) {
    logger.error(`getOrderById: Error getting order ${id}:`, error);
    
    if (error.message === "Order not found") {
      return res.status(404).json({ message: error.message });
    }
    
    if (error.message === "Not authorized to access this order") {
      return res.status(403).json({ message: error.message });
    }
    
    res.status(500).json({ message: "Error retrieving order", error: error.message });
  }
};

/**
 * @swagger
 * /order:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - shippingAddress
 *               - paymentDetails
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/OrderItem'
 *               shippingAddress:
 *                 $ref: '#/components/schemas/ShippingAddress'
 *               paymentDetails:
 *                 $ref: '#/components/schemas/PaymentDetails'
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized access
 *       500:
 *         description: Server error
 */
/**
 * Create a new order
 */
const createOrder = async (req, res) => {
  logger.debug(`createOrder: Starting order creation for user ${req.user.id}`);
  
  try {
    const { items, shippingAddress, paymentDetails } = req.body;
    logger.debug(`createOrder: Order with ${items?.length || 0} items, payment method: ${paymentDetails?.method || 'not specified'}`);
    
    // Validate required fields
    if (!items || !shippingAddress || !paymentDetails) {
      logger.warn('createOrder: Missing required fields in request');
      return res.status(400).json({ 
        message: "Missing required fields",
        requiredFields: ["items", "shippingAddress", "paymentDetails"]
      });
    }
    
    logger.debug('createOrder: Calling order service to create order');
    logger.debug('req.user.id: ', req.user.user.id);
    const newOrder = await OrderService.createOrder({
      items,
      shippingAddress,
      paymentDetails,
      user: req.user.user.id, // Ensure user ID is always provided
    });
    
    logger.info(`createOrder: Order created successfully with ID ${newOrder._id}`);
    res.status(201).json({
      message: "Order created successfully",
      order: newOrder
    });
  } catch (error) {
    logger.error("createOrder: Error creating order:", error);
    
    if (error.message.includes("must contain at least one item") || 
        error.message.includes("is required")) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: "Error creating order", error: error.message });
  }
};

/**
 * Create a new order for guest (non-authenticated) users
 */
const createGuestOrder = async (req, res) => {
  logger.debug('createGuestOrder: Starting guest checkout process');
  
  try {
    const { items, shippingAddress, customerInfo } = req.body;
    
    logger.debug(`createGuestOrder: Request received with ${items?.length || 0} items, contact: ${customerInfo?.email || customerInfo?.phoneNumber || 'not provided'}`);
    
    // Validate required fields
    if (!items || !shippingAddress || !customerInfo) {
      logger.warn('createGuestOrder: Missing required fields in request');
      return res.status(400).json({ 
        message: "Missing required fields",
        requiredFields: ["items", "shippingAddress", "customerInfo"]
      });
    }
    
    // Validate customer information
    if (!customerInfo.email && !customerInfo.phoneNumber) {
      logger.warn('createGuestOrder: No contact information provided');
      return res.status(400).json({
        message: "Either email or phone number is required"
      });
    }
    
    // Force payment method to COD for guest users
    logger.debug('createGuestOrder: Setting payment method to Cash on Delivery');
    const paymentDetails = {
      method: "cash",
      paymentStatus: "pending"
    };
    
    logger.debug('createGuestOrder: Calling order service to create guest order');
    const guestOrder = await OrderService.createGuestOrderService({
      items,
      shippingAddress,
      paymentDetails,
      customerInfo
    });
    
    logger.info(`createGuestOrder: Guest order created successfully with ID: ${guestOrder._id}, tracking code: ${guestOrder.trackingCode}`);
    
    res.status(201).json({
      message: "Order created successfully",
      order: guestOrder,
      trackingCode: guestOrder.trackingCode
    });
  } catch (error) {
    logger.error(`createGuestOrder: Error creating guest order: ${error.message}`, error);
    
    if (error.message.includes("must contain at least one item") || 
        error.message.includes("is required")) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: "Error creating order", error: error.message });
  }
};

/**
 * @swagger
 * /order/{id}/cancel:
 *   put:
 *     summary: Cancel an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Order cannot be cancelled
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized access
 *       500:
 *         description: Server error
 */
/**
 * Cancel an order
 */
const cancelOrder = async (req, res) => {
  const { id } = req.params;
  logger.debug(`cancelOrder: Attempting to cancel order ${id} by user ${req.user.id}`);
  
  try {
    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn(`cancelOrder: Invalid order ID format: ${id}`);
      return res.status(400).json({ message: "Invalid order ID format" });
    }
    
    logger.debug(`cancelOrder: Calling order service to cancel order ${id}`);
    const order = await OrderService.cancelOrder(id, req.user);
    
    logger.info(`cancelOrder: Order ${id} cancelled successfully`);
    res.status(200).json({
      message: "Order cancelled successfully",
      order
    });
  } catch (error) {
    logger.error(`cancelOrder: Error cancelling order ${id}:`, error);
    
    if (error.message === "Order not found") {
      return res.status(404).json({ message: error.message });
    }
    
    if (error.message === "Not authorized to cancel this order") {
      return res.status(403).json({ message: error.message });
    }
    
    if (error.message.includes("cannot be cancelled")) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: "Error cancelling order", error: error.message });
  }
};

/**
 * @swagger
 * /order/{id}/complete:
 *   put:
 *     summary: Mark order as complete
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order completed successfully
 *       400:
 *         description: Order cannot be completed
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized access
 *       500:
 *         description: Server error
 */
/**
 * Mark an order as complete (delivered)
 */
const completeOrder = async (req, res) => {
  const { id } = req.params;
  logger.debug(`completeOrder: Attempting to mark order ${id} as delivered by admin ${req.user.id}`);
  
  try {
    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn(`completeOrder: Invalid order ID format: ${id}`);
      return res.status(400).json({ message: "Invalid order ID format" });
    }
    
    logger.debug(`completeOrder: Calling order service to complete order ${id}`);
    const order = await OrderService.completeOrder(id);
    
    logger.info(`completeOrder: Order ${id} marked as delivered successfully`);
    res.status(200).json({
      message: "Order marked as delivered",
      order
    });
  } catch (error) {
    logger.error(`completeOrder: Error completing order ${id}:`, error);
    
    if (error.message === "Order not found") {
      return res.status(404).json({ message: error.message });
    }
    
    if (error.message.includes("cannot be completed")) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: "Error completing order", error: error.message });
  }
};

/**
 * @swagger
 * /order/{id}:
 *   put:
 *     summary: Update order details
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *               shippingAddress:
 *                 $ref: '#/components/schemas/ShippingAddress'
 *               paymentDetails:
 *                 $ref: '#/components/schemas/PaymentDetails'
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized access
 *       500:
 *         description: Server error
 */
/**
 * Update order details
 */
const updateOrder = async (req, res) => {
  const { id } = req.params;
  const { status, shippingAddress, paymentDetails } = req.body;
  
  logger.debug(`updateOrder: Admin ${req.user.id} attempting to update order ${id}`);
  logger.debug(`updateOrder: Update data - status: ${status || 'unchanged'}, shippingAddress: ${shippingAddress ? 'provided' : 'unchanged'}, paymentDetails: ${paymentDetails ? 'provided' : 'unchanged'}`);
  
  try {
    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn(`updateOrder: Invalid order ID format: ${id}`);
      return res.status(400).json({ message: "Invalid order ID format" });
    }
    
    // Ensure at least one field to update is provided
    if (!status && !shippingAddress && !paymentDetails) {
      logger.warn(`updateOrder: No update fields provided for order ${id}`);
      return res.status(400).json({ 
        message: "No update fields provided",
        updatableFields: ["status", "shippingAddress", "paymentDetails"]
      });
    }
    
    logger.debug(`updateOrder: Calling order service to update order ${id}`);
    const order = await OrderService.updateOrder(id, {
      status,
      shippingAddress,
      paymentDetails,
    });
    
    logger.info(`updateOrder: Order ${id} updated successfully${status ? ' with new status: ' + status : ''}`);
    res.status(200).json({
      message: "Order updated successfully",
      order
    });
  } catch (error) {
    logger.error(`updateOrder: Error updating order ${id}:`, error);
    
    if (error.message === "Order not found") {
      return res.status(404).json({ message: error.message });
    }
    
    if (error.message.includes("Cannot change order status")) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: "Error updating order", error: error.message });
  }
};

/**
 * @swagger
 * /order/{id}/status:
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Invalid status transition
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized access
 *       500:
 *         description: Server error
 */
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  logger.debug(`updateOrderStatus: Admin ${req.user.id} attempting to update status of order ${id} to ${status}`);
  
  try {
    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn(`updateOrderStatus: Invalid order ID format: ${id}`);
      return res.status(400).json({ message: "Invalid order ID format" });
    }
    
    // Validate status
    if (!status) {
      logger.warn(`updateOrderStatus: No status provided for order ${id}`);
      return res.status(400).json({ message: "Status is required" });
    }
    
    // We can reuse the existing updateOrder service but only pass the status
    logger.debug(`updateOrderStatus: Calling order service to update status of order ${id} to ${status}`);
    const order = await OrderService.updateOrder(id, { status });
    
    logger.info(`updateOrderStatus: Order ${id} status updated successfully to ${status}`);
    res.status(200).json({
      message: "Order status updated successfully",
      order
    });
  } catch (error) {
    logger.error(`updateOrderStatus: Error updating order ${id} status:`, error);
    
    if (error.message === "Order not found") {
      return res.status(404).json({ message: error.message });
    }
    
    if (error.message.includes("Cannot change order status")) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: "Error updating order status", error: error.message });
  }
};

const OrderControllers = {
  getAllOrders,
  getOrderById,
  createOrder,
  createGuestOrder,
  cancelOrder,
  completeOrder,
  updateOrder,
  updateOrderStatus  // Add this new controller
};

export default OrderControllers;