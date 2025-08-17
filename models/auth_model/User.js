const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    default: null,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: false,
  },
  firstName: {
    type: String,
    required: false,
    trim: true,
  },
  lastName: {
    type: String,
    required: false,
    trim: true,
  },
  agreeTerms: {
    type: Boolean,
    required: false,
    default: false,
  },

  resetToken: String,

  accessToken: {
    type: String,
  },
  refreshToken: {
    type: String,
  },

  resetTokenExpiry: {
    type: Date,
  },

  otp: {
    type: String, 
    default: null,
  },

  otpExpires: {
    type: Date,
    default: null, 
  },

  emailVerified: {
    type: Boolean,
    default: false,
  },
  userRole: {
    type: String,
    enum: ['buyer', 'admin', 'seller'],
    default: 'buyer',
  },

  businessInfo: {
    website: {
      type: String,
      default: null,
      trim: true,
    },
    taxIdOrEIN: {
      type: String,
      required: false,
      trim: true,
    },
    businessType: {
      type: String,
      required: false,
      trim: true,
    },
    businessName: {
      type: String,
      required: false,
      trim: true,
    },
  },

  contactInfo: {
    streetAddress: {
      type: String,
      default: null,
      trim: true,
    },
    city: {
      type: String,
      required: false,
      trim: true,
    },
    state: {
      type: String,
      required: false,
      trim: true,
    },
    zipCode: {
      type: String,
      required: false,
      trim: true,
    },
    country: {
      type: String,
      required: false,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: false,
      trim: true,
    },
  },


  productWishlists: [
    {
      name: { type: String, required: true }, // e.g., "Favorites", "For Later"
      items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }]
    }
  ],

  shopWishlists: [
    {
      name: { type: String, required: true },
      items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Store' }]
    }
  ],

  phoneNumber:{
    type:Number,
    required:false
  },

  dateOfBirth:{
    type:Date,
    required:false
  },

  gender:{
    type:String,
    required:false
  },

  bio:{
    type:String,
    required:false
  },

  isActive:{
    type:Boolean,
    default:true
  },

}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
