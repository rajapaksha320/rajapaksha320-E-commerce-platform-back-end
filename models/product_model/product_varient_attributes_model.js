const mongoose = require('mongoose');

const productVariantAttributesSchema = new mongoose.Schema({
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariant',
    required: true,
  },
  attributeName: String,
  attributeValue: String,
});

module.exports = mongoose.model('ProductVariantAttributes', productVariantAttributesSchema);
