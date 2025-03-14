import mongoose from "mongoose";

export const FieldDefinitionSchema = mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: [
      'String', 
      'Number', 
      'Date', 
      'Boolean', 
      'ObjectId', 
      'Array', 
      'Mixed'
    ]
  },
  required: { type: Boolean, default: false },
});

export const CategorySchema = mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  fields: [FieldDefinitionSchema],
});

export const CategoryModel = mongoose.model(
  'Category', 
  CategorySchema
);

const ProductSchema = mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  price: { type: Number, required: true },
  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category', 
    required: true 
  },
  fields: [FieldDefinitionSchema],
  createdAt: { type: Date, default: Date.now },
})

ProductSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export const ProductModel = mongoose.model(
  'Product', 
  ProductSchema
);
