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
  resetTokenExpire: Date,
  emailVerified: {
    type: Boolean,
    default: false,
  },
  userRole: {
    type: String,
    enum: ['buyer', 'admin' , 'seller'],
    default: 'buyer',
  },

}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
