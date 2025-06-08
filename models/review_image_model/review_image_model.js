const mongoose = require('mongoose');
const { Schema } = mongoose;

const reviewImageSchema = new Schema({
  tenantId: {
    type: String,
    default: null
  },
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ReviewImage', reviewImageSchema);
