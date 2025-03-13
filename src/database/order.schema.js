import mongoose from "mongoose";

const OrderItem = mongoose.Schema({
  product: {type: String, required: true},
  quantity: {type: Number, required: true},
  voucher: {type: String, required: false},
  note: {type: String, required: false},
  unitPrice: {type: Number, required: true},
  deliveryDate: {type: Date, required: true},
  deliveryFee: {type: Number, required: true},
})