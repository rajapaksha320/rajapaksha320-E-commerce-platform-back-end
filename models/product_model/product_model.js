const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  basePrice: Number,
  stock: Number,
  heroImage: String,
  rating: Number,
  totalReviews: Number,
  age: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: Date,
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  discountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Discount',
  }
});

productSchema.virtual('images', {
  ref: 'ProductImage',
  localField: '_id',
  foreignField: 'productId',
});

productSchema.virtual('variants', {
  ref: 'ProductVariant',
  localField: '_id',
  foreignField: 'productId',
});

productSchema.set('toObject', { virtuals: true });
productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);

