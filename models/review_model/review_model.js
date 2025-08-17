const mongoose = require('mongoose');
const { Schema } = mongoose;

const reviewSchema = new Schema({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store', // assuming shop = store
    required: true
  },
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  review: {
    type: String // main review text
  },
  shoppingExperience: {
    type: Number,
    min: 0,
    max: 5
  },
  customerService: {
    type: Number,
    min: 0,
    max: 5
  },
  productQuality: {
    type: Number,
    min: 0,
    max: 5
  },
  deliverySpeed: {
    type: Number,
    min: 0,
    max: 5
  },

  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Review', reviewSchema);
