import mongoose from "mongoose";
import OrderService from "./order.service.js";

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
const getAllOrders = async (req, res) => {
  const { status } = req.query;
  try {
    const orders = await OrderService.getAllOrders(status);
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

/**
 * @swagger
 * /order/{id}:
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
const getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await OrderService.getOrderById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
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
const createOrder = async (req, res) => {
  const { items, shippingAddress, paymentDetails } = req.body;
  try {
    const newOrder = await OrderService.createOrder({
      items,
      shippingAddress,
      paymentDetails,
      user: req.user._id,
    });
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
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
const cancelOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await OrderService.cancelOrder(id);
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
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
const completeOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await OrderService.completeOrder(id);
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
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
const updateOrder = async (req, res) => {
  const { id } = req.params;
  const { status, shippingAddress, paymentDetails } = req.body;
  try {
    const order = await OrderService.updateOrder(id, {
      status,
      shippingAddress,
      paymentDetails,
    });
    res.status(200).json(order);
  } catch (error) {
    if (error.message === "Order not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error });
  }
};

const OrderControllers = {
  getAllOrders,
  getOrderById,
  createOrder,
  cancelOrder,
  completeOrder,
  updateOrder,
};

export default OrderControllers;