import { z } from "zod";
import { isValidMongoId } from "./product.validator.js";

export const validateAttributeValue = (type, value) => {
  switch (type) {
    case 'String':
      return typeof value === 'string' ? null : "Value must be a string";
      
    case 'Number':
      return typeof value === 'number' ? null : "Value must be a number";
      
    case 'Color':
      if (typeof value !== 'string') return "Color value must be a string";
      // Basic hex color validation
      if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
        return "Color must be a valid hex code (e.g. '#FF5500')";
      }
      return null;
      
    case 'Boolean':
      return typeof value === 'boolean' ? null : "Value must be a boolean";
      
    case 'Size':
      return typeof value === 'string' ? null : "Size must be a string";
      
    default:
      return `Unknown attribute type: ${type}`;
  }
};

export const VariationAttributeSchema = z.object({
  name: z.string().min(1, "Attribute name is required"),
  type: z.enum(['String', 'Number', 'Color', 'Boolean', 'Size']),
  value: z.any()
}).superRefine((data, ctx) => {
  const { type, value } = data;
  const error = validateAttributeValue(type, value);
  if (error) {
    ctx.addIssue({
      path: ['value'],
      message: error,
    });
  }
});

export const ProductVariationSchema = z.object({
  _id: z.string().optional(),
  product: z.union([
    z.string().refine(isValidMongoId, "Invalid product ID"),
    z.object({
      _id: z.any().transform(val => val.toString())
    }).transform(val => val._id)
  ]).optional(),
  name: z.string().min(1, "Variation name is required"),
  price: z.number().positive("Price must be positive"),
  stock: z.number().int().nonnegative().default(0),
  sku: z.string().optional(),
  attributes: z.array(VariationAttributeSchema),
  isDefault: z.boolean().default(false)
});

export const validateProductVariation = (data) => {
  return ProductVariationSchema.parse(data);
};