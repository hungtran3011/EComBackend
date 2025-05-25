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
}, {timestamps: true})

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
 * @property {String} status - Trạng thái của đơn hàng
 * - `pending`: Chờ xử lý
 * - `processing`: Đang xử lý
 * - `shipped`: Đã giao hàng
 * - `delivered`: Đã nhận hàng
 * - `cancelled`: Đã hủy
 * @property {Object} shippingAddress - Địa chỉ giao hàng
 * @property {String} shippingAddress.home - Số nhà
 * @property {String} shippingAddress.street - Tên đường
 * @property {String} shippingAddress.city - Thành phố
 * @property {String} shippingAddress.state - Tiểu bang/Tỉnh (không bắt buộc)
 * @property {String} shippingAddress.zip - Mã bưu điện
 * @property {String} shippingAddress.country - Quốc gia
 * @property {Object} paymentDetails - Chi tiết thanh toán
 * @property {String} paymentDetails.method - Phương thức thanh toán
 * - `cash`: Thanh toán bằng tiền mặt
 * - `card`: Thanh toán bằng thẻ
 * - `paypal`: Thanh toán qua PayPal
 * - `stripe`: Thanh toán qua Stripe
 * - `momo`: Thanh toán qua MoMo
 * - `zalo`: Thanh toán qua ZaloPay
 * - `bank`: Thanh toán qua ngân hàng
 * @property {String} paymentDetails.transactionId - Mã giao dịch (không bắt buộc)
 * @property {Number} totalAmount - Tổng số tiền của đơn hàng, phải lớn hơn hoặc bằng 0
 */
export const OrderSchema = mongoose.Schema({  
  items: [OrderItemSchema],  
  
  // Make user optional for guest orders
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: function() { return !this.isGuestOrder; }  // Only required for registered users
  },
  
  // Add guest order flag and customer info
  isGuestOrder: {
    type: Boolean,
    default: false
  },
  
  customerInfo: {
    name: { type: String },
    email: { type: String },
    phoneNumber: { type: String }
  },
  
  trackingCode: {
    type: String,
    sparse: true  // Sparse index for tracking codes
  },
  
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending' 
  },  
  shippingAddress: {  
    home: { type: String, required: true },
    street: { type: String, required: true },  
    city: { type: String, required: true },  
    state: { type: String, required: false },  
    zip: { type: String, required: true },  
    country: { type: String, required: true }  
  },  
  paymentDetails: {  
    method: { 
      type: String, 
      required: true,
      enum: [
        'cash', 
        'card', 
        'paypal', 
        'stripe', 
        'momo', 
        'zalo', 
        'bank'
      ] 
    },  
    transactionId: { type: String, required: false }  
  },  
  totalAmount: { type: Number, required: true, min: 0 },

}, {timestamps: true});  

/**
 * @name OrderModel
 * @type {mongoose.Model}
 * @description Model cho OrderSchema, cho phép thực hiện các thao tác CRUD trên Order
 */
export const OrderModel = mongoose.model('Order', OrderSchema);
