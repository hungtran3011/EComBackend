import mongoose from "mongoose";

/**
 * @name OrderItem
 * @author hungtran3011
 * @description Dữ liệu của một sản phẩm trong đơn hàng
 * @type {mongoose.Schema}
 * @property {mongoose.Schema.Types.ObjectId} product - Tham chiếu đến dữ liệu sản phẩm
 * @property {Number} quantity - Số lượng sản phẩm
 * @property {String} voucher - Mã giảm giá
 * @property {String} note - Ghi chú tuỳ chọn, sau này có thể set giới hạn ký tự
 * @property {Date} deliveryDate - Ngày giao hàng
 * @property {Number} unitPrice - Giá sản phẩm
 * @property {Number} deliveryFee - Phí giao hàng, việc triển khai tính toán cần thêm trình tự để thực hiện
 */
export const OrderItemSchema = mongoose.Schema({
  product: {type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true},
  quantity: {type: Number, required: true},
  voucher: {type: String, required: false},
  note: {type: String, required: false},
  unitPrice: {type: Number, required: true},
  deliveryDate: {type: Date, required: true},
  deliveryFee: {type: Number, required: true},
})

/**
 * @name OrderItemModel
 * @author hungtran3011
 * @type {mongoose.Model}
 * @description Model cho OrderItemSchema, cho phép thực hiện các thao tác CRUD trên OrderItem
 * @remarks Chúng ta cần OrderItemModel riêng biệt vì:
 * 1. Nó cho phép thực hiện các thao tác CRUD trực tiếp trên OrderItem (tìm kiếm, tạo mới, cập nhật)
 * 2. Có thể xác thực dữ liệu OrderItem độc lập với Order
 * 3. Cho phép tái sử dụng OrderItem trong các ngữ cảnh khác
 * 4. Giúp tổ chức mã nguồn rõ ràng, dễ bảo trì hơn
 */
export const OrderItemModel = mongoose.model("OrderItem", OrderItemSchema);

/**
 * @name OrderSchema
 * @author hungtran3011
 * @description Dữ liệu của một đơn hàng
 * @type {mongoose.Schema}
 * @property {Array<OrderItem>} items - Danh sách sản phẩm trong đơn hàng
 * @property {mongoose.Schema.Types.ObjectId} user - Tham chiếu đến dữ liệu người dùng
 */
export const OrderSchema = mongoose.Schema({  
  items: [OrderItem],  
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  
  status: { type: String, required: true, default: 'pending' },  
  shippingAddress: {  
    street: { type: String, required: true },  
    city: { type: String, required: true },  
    state: { type: String, required: true },  
    zip: { type: String, required: true },  
    country: { type: String, required: true }  
  },  
  paymentDetails: {  
    method: { type: String, required: true },  
    transactionId: { type: String, required: false }  
  },  
  orderDate: { type: Date, default: Date.now },  
  totalAmount: { type: Number, required: true }  
});  

export const OrderModel = mongoose.model('Order', OrderSchema);
