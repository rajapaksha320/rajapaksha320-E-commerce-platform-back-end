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
    required: true,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  agreeTerms: {
    type: Boolean,
    required: true,
    default: false,
  },

  resetToken: String,


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


  userWishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
  }],



}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
