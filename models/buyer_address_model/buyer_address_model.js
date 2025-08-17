const mongoose = require('mongoose');

const buyerAddressSchema = new mongoose.Schema({
  buyerId: { type: String, required: true },
  addressType: { type: String, enum: ['home', 'work'], required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  streetAddress: { type: String, required: true },
  apartment: { type: String }, // optional
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('BuyerAddress', buyerAddressSchema);
