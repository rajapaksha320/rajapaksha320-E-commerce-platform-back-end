const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

// Basic Information Schema
const BasicInformationSchema = new Schema({
  storeName: { type: String, required: true },
  storeTagLine: { type: String },
  storeDescription: { type: String }
}, { _id: false });

// Contact Details Schema
const StoreContactDetailsSchema = new Schema({
  storeLocation: { type: String },
  storeContactNumber: { type: Number },
  storeEmail: { type: String },
  storeWebsite: { type: String },
  storeBusinessHours: { type: String } // fixed typo
}, { _id: false });

// Shop Media Schema
const ShopMediaSchema = new Schema({
  storeLogo: { type: String },
  bannerImage: { type: String }
}, { _id: false });

// Store Schema
const StoreSchema = new Schema({
  storeId: {
    type: String,
    unique: true,
    index: true
  },
  sellerId: {
    type: Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  basicInformation: BasicInformationSchema,
  contactDetails: StoreContactDetailsSchema,
  shopMedia: ShopMediaSchema,
  totalSales: { type: Number, default: 0 },
  totalProducts: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  isDiactivate:{
    type:Boolean,
    default:false
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

// Generate storeId if not present
StoreSchema.pre('save', function (next) {
  if (!this.storeId) {
    this.storeId = uuidv4();
  }
  next();
});

module.exports = mongoose.model('Store', StoreSchema);