const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// like Electronics category
const categorySchema = new Schema({
  tenantId: {
    type: String,
    default: null,
  },
  categoryName: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  parentCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  numberOfProducts: {
    type: Number,
    default: 0
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

module.exports = mongoose.model('Category', categorySchema);
