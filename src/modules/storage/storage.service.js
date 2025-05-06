import { StorageItemModel } from "./storage.schema.js";

const getStorageItems = async () => {
  return await StorageItemModel.find().populate("product");
};

const getProductQuantity = async (productId) => {
  return await StorageItemModel.findOne({ product: productId });
};

const updateProductQuantity = async (productId, quantity) => {
  return await StorageItemModel.findOneAndUpdate(
    { product: productId },
    { quantity },
    { new: true, upsert: true }
  );
};

const bulkUpdateStorage = async (items) => {
  const bulkOperations = items.map((item) => ({
    updateOne: {
      filter: { product: item.product },
      update: { quantity: item.quantity },
      upsert: true,
    },
  }));

  return await StorageItemModel.bulkWrite(bulkOperations);
};

const updateVariationQuantity = async (variationId, quantity) => {
  return await VariationStorageModel.findOneAndUpdate(
    { variation: variationId },
    { quantity },
    { new: true, upsert: true }
  );
};

const getVariationQuantity = async (variationId) => {
  return await VariationStorageModel.findOne({ variation: variationId });
};

export default {
  getStorageItems,
  getProductQuantity,
  updateProductQuantity,
  bulkUpdateStorage,
  updateVariationQuantity,
  getVariationQuantity,
};