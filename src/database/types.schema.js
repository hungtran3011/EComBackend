import mongoose from "mongoose";

export const Camera = mongoose.SchemaType({
  name: {type: String, required: false},
  resolution: {type: String, required: true},
  sensor: {type: String, required: true},
  aperture: {type: String, required: true},
  brand: {type: String, required: false},
  series: {type: String, required: false},
})

export const Variants = mongoose.SchemaType([{
  id: {type: String, required: true},
  name: {type: String, required: true},
}])

export const CartItem = mongoose.Schema({
  product: {type: String, required: true},
  quantity: {type: Number, required: true},
  voucher: {type: String, required: false},
  note: {type: String, required: false},
  unitPrice: {type: Number, required: true},
})