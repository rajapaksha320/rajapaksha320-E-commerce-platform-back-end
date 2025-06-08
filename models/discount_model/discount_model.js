const mongoose = require('mongoose');
const { Schema } = mongoose;

const discountSchema = new Schema({
  tenantId: {
    type: String,
    default: null
  },
  discountName: {
    type: String,
    required: true,
    trim: true
  },
  discountValue: {
    type: Number,
    required: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'flat'],
    required: true
  },
  discountMethod: {
    type: String,
    enum: ['automatic', 'manual', 'coupon'],
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Discount', discountSchema);
