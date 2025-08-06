const mongoose = require('mongoose');

const DimensionsSchema = new mongoose.Schema({
    length: String,
    width: String,
    height: String
}, { _id: false });

const ImageSchema = new mongoose.Schema({
    id: String,
    url: String,
    alt: String,
    isPrimary: Boolean,
    sortOrder: Number,
    uploadedAt: Date
}, { _id: false });

const shippingClassSchema = new mongoose.Schema({
    id: String,
    shippingWeight: String,
    shippingClass: String,
    returnPolicy: String,
    warranty: String,
}, { _id: false });

const VariationSchema = new mongoose.Schema({
    id: String,
    name: String,
    sku: String,
    price: String,
    originalPrice: String,
    quantity: String,
    color: [String],
    sizes: [String],
    weight: String,
    dimensions: DimensionsSchema,
    images: [ImageSchema],
    isDefault: Boolean
}, { _id: false });

const ListingModelSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    sellerDetails: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Fixed reference
    title: String,
    brand: String,
    category: {
        main: String,
        sub: String
    },
    description: String,
    weight: String,
    dimensions: DimensionsSchema,
    images: [ImageSchema],
    productTags: [String],
    hasVariations: Boolean,
    variations: [VariationSchema],
    shippingClass: shippingClassSchema,
    status: { type: String, enum: ['active', 'inactive', 'draft', 'outOfStock', 'sold'], default: 'active' },
    createdAt: { type: Date, default: Date.now }, // Added default
    updatedAt: { type: Date, default: Date.now }  // Added default
});

module.exports = mongoose.model('ListingModel', ListingModelSchema);