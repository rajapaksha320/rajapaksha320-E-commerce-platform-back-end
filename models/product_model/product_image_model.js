const mongoose = require('mongoose');

const productImageSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  imageUrl: String,
  isHero: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('ProductImage', productImageSchema);
