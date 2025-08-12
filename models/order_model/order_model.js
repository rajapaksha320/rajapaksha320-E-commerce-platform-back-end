const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderSchema = new Schema({
  buyerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  sellerIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],

  listingIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  }],

  shippingAddress: {
    type: String,
    required: true
  },

  shippingOption: {
    type: String,
    required: true
  },

  totalAmount: {
    type: Number,
    required: true
  },

  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
