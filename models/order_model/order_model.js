const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderSchema = new Schema({
  tenantId: {
    type: String,
    default: null
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  storeId: {
    type: Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  shipmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Shipment'
  },
  paymentId: {
    type: Schema.Types.ObjectId,
    ref: 'Payment'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  deliveryStatus: {
    type: String,
    enum: ['not_dispatched', 'in_transit', 'delivered', 'failed'],
    default: 'not_dispatched'
  },
  estimatedDelivery: {
    type: Date
  },
  totalAmount: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  shippingFee: {
    type: Number,
    default: 0
  },
  discountApplied: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
