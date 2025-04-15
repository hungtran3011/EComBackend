import { OrderModel } from "./order.schema.js";

const getAllOrders = async (status) => {
  const allowedStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  const query = allowedStatuses.includes(status) ? { status: { $eq: status } } : {};
  return await OrderModel.find(query);
};

const getOrderById = async (id) => {
  return await OrderModel.findById(id);
};

const createOrder = async ({ items, shippingAddress, paymentDetails, user }) => {
  const newOrder = new OrderModel({
    items,
    shippingAddress,
    paymentDetails,
    user,
  });
  return await newOrder.save();
};

const cancelOrder = async (id) => {
  const order = await OrderModel.findById(id);
  if (!order) throw new Error("Order not found");
  if (order.status === "shipped" || order.status === "delivered") {
    throw new Error("Order cannot be cancelled");
  }
  order.status = "cancelled";
  return await order.save();
};

const completeOrder = async (id) => {
  const order = await OrderModel.findById(id);
  if (!order) throw new Error("Order not found");
  if (order.status !== "shipped") {
    throw new Error("Order cannot be completed");
  }
  order.status = "delivered";
  return await order.save();
};

const updateOrder = async (id, { status, shippingAddress, paymentDetails }) => {
  const order = await OrderModel.findById(id);
  if (!order) throw new Error("Order not found");
  order.status = status || order.status;
  order.shippingAddress = shippingAddress || order.shippingAddress;
  order.paymentDetails = paymentDetails || order.paymentDetails;
  return await order.save();
};

const OrderService = {
  getAllOrders,
  getOrderById,
  createOrder,
  cancelOrder,
  completeOrder,
  updateOrder,
};

export default OrderService;