const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

const storeSchema = new Schema({
  tenantId: {
    type: String,
    default: null,
  },
  storeId: {
    type: String,
    unique: true,
    index: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  storeName: {
    type: String,
    required: true
  },
  storeDescription: {
    type: String
  },
  storeLocation: {
    type: String
  },
  storeLogo: {
    type: String
  },
  bannerImage: {
    type: String
  },
  totalSales: {
    type: Number,
    default: 0
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  storePolicies: {
    type: String
  },
  totalProducts: {
    type: Number,
    default: 0
  },
  socialMediaLinks: {
    type: [String]
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  }
}, {
  timestamps: true
});

storeSchema.pre('save', function (next) {
  if (!this.storeId) {
    this.storeId = uuidv4();
  }
  next();
});

module.exports = mongoose.model('Store', storeSchema);
