const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  cartId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart',
    required: true
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariant',
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  priceAtAddition: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('CartItem', cartItemSchema);
