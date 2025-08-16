const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/auth_model/User');
const sendEmail = require('../../utils/nodemailer');
const Store = require('../../models/store_model/store_model');
const ListingModel = require('../../models/listing_model/listing_model')
const mongoose = require('mongoose');


exports.signup = async (req, res) => {
    try {
        const tenantId = Math.random().toString(36).substring(2, 15);
        const userRole = 'buyer';

        const {
            email,
            password,
            confirmPassword,
            firstName,
            lastName,
            agreeTerms,
            emailVerified = false,
        } = req.body;

        // Basic validation
        if (!email || !password || !confirmPassword || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required.',
            });
        }

        if (!agreeTerms) {
            return res.status(400).json({
                success: false,
                message: 'You must agree to the terms and conditions.',
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match.',
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists.',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            email,
            password: hashedPassword,
            tenantId,
            firstName,
            lastName,
            agreeTerms,
            emailVerified,
            userRole,
        });

        if (!user) {
            return res.status(500).json({
                success: false,
                message: 'User could not be created.',
            });
        }

        res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            userId: user._id,
            tenantId: user.tenantId,
        });

    } catch (error) {
        console.error('Signup Error:', error);

        // Specific handling for Mongoose validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation failed.',
                errors: error.errors,
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error.',
        });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    const tenantId = user.tenantId;

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const refreshSecretKey =
        process.env.REFRESH_SECRET_KEY || "refresh-secret-key";

    const accessTokenOptions = {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d",
    };

    const refreshTokenOptions = {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d",
    };

    const refreshToken = jwt.sign(
        { userId: user._id, tenantId, role: user.userRole },
        refreshSecretKey,
        refreshTokenOptions
    );

    const accessToken = jwt.sign({ userId: user._id, tenantId, role: user.userRole }, process.env.JWT_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '5d' });

    if (!accessToken) {
        return res.status(500).json({ message: 'Token generation failed' });
    }
    res.status(200).json({ message: 'Login successful', profile:user, access_token: accessToken, refresh_token: refreshToken, userId: user._id, tenantId, userRole: user.userRole, emailVerified: user.emailVerified });
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpires = Date.now() + 5 * 60 * 1000;

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await sendEmail(email, 'Password Reset', `Use this token: ${otp} to reset your password. It expires in 5 minutes.`);
    res.json({ message: 'Reset email sent , check your inbox' });
};


exports.verifyOtpController = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({
            success: false,
            message: "All fields are required.",
        });
    }

    const user = await User.findOne({ email });

    if (!user || !user.otp || !user.otpExpires) {
        return res.status(400).json({
            success: false,
            message: "Invalid or expired OTP.",
        });
    }

    if (user.otpExpires < Date.now()) {
        return res.status(400).json({
            success: false,
            message: "OTP has expired. Please request a new one.",
        });
    }

    if (user.otp !== otp) {
        return res.status(400).json({
            success: false,
            message: "Invalid OTP.",
        });
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return res.status(200).json({
        success: true,
        message: "OTP verified successfully.",
        userId: user._id,
    });
}

exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;


        if (newPassword !== confirmPassword) {
            return res.status(400).send({
                success: false,
                message: "New password and confirm password do not match.",
            });
        }

        const user = await User.findOne({ email });

        if (user) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            user.password = hashedPassword;
            await user.save();

            res.status(200).send({
                success: true,
                message: "Password changed successfully",
                user: { email: user.email, username: user.username },
            });

        } else {
            res.status(200).send({
                success: false,
                message: "User not found",
            });
        }
    } catch (error) {
        console.error("Error in ResetPasswordController:", error);
        res.status(500).send({
            success: false,
            message: "An error occurred while resetting the password.",
            error: error.message,
        });
    }
};


exports.updateBusinessInfoController = async (req, res) => {
    try {
        const { tenantId, userId, businessInfo } = req.body;
        // console.log(req.body);


        if (!tenantId || !businessInfo) {
            return res.status(400).json({ message: 'Tenant ID and business info are required' });
        }

        const user = await User.findOne({ tenantId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // // Update business info
        user.businessInfo = {
            ...user.businessInfo,
            ...businessInfo,
        };

        await user.save();

        res.status(200).json({ message: 'Business info updated successfully', user });

    } catch (error) {
        console.error('Update Business Info Error:', error);
        res.status(500).json({ message: 'Server error during business info update' });
    }
}

exports.updateContactInfoController = async (req, res) => {
    try {
        const { tenantId, userId, contactInfo } = req.body;

        if (!tenantId || !contactInfo) {
            return res.status(400).json({ message: 'Tenant ID and contact info are required' });
        }

        const user = await User.findOne({ _id: userId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update contact info
        user.contactInfo = {
            ...user.contactInfo,
            ...contactInfo,
        };

        await user.save();

        res.status(200).json({ message: 'Contact info updated successfully', user });

    } catch (error) {
        console.error('Update Contact Info Error:', error);
        res.status(500).json({ message: 'Server error during contact info update' });
    }
}

exports.updateWishListController = async (req, res) => {
  try {
    const { productWishlist = [], shopWishlist = [], userId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: userId not provided.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Convert product IDs to ObjectId
    const productIds = productWishlist.map(id => {
      if (!mongoose.Types.ObjectId.isValid(id)) throw new Error(`Invalid productId: ${id}`);
      return new mongoose.Types.ObjectId(id);
    });

    // Convert shop IDs to ObjectId
    const shopIds = shopWishlist.map(id => {
      if (!mongoose.Types.ObjectId.isValid(id)) throw new Error(`Invalid shopId: ${id}`);
      return new mongoose.Types.ObjectId(id);
    });

    // Update or create default product wishlist
    if (user.productWishlists && user.productWishlists.length > 0) {
      // Replace items in the first/default wishlist
      user.productWishlists[0].items = productIds;
    } else {
      user.productWishlists.push({ name: 'Default', items: productIds });
    }

    // Update or create default shop wishlist
    if (user.shopWishlists && user.shopWishlists.length > 0) {
      user.shopWishlists[0].items = shopIds;
    } else {
      user.shopWishlists.push({ name: 'Default', items: shopIds });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Wishlist updated successfully',
      data: user
    });

  } catch (error) {
    console.error('Error updating wishlist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.getOneUserWatchListWithDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, pageSize = 10 } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    const pageNumber = parseInt(page, 10);
    const size = parseInt(pageSize, 10);
    const skip = (pageNumber - 1) * size;

    // Find the user
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Prepare product wishlists with details
    const productWishlistsDetails = [];
    if (user.productWishlists?.length > 0) {
      for (const wishlist of user.productWishlists) {
        const totalItems = await ListingModel.countDocuments({ _id: { $in: wishlist.items } });

        const items = await ListingModel.find({ _id: { $in: wishlist.items } })
          .select('name price images category status')
          .skip(skip)
          .limit(size)
          .lean();

        productWishlistsDetails.push({
          name: wishlist.name,
          pagination: {
            totalItems,
            currentPage: pageNumber,
            pageSize: size,
            totalPages: Math.ceil(totalItems / size),
          },
          items,
        });
      }
    }

    // Prepare shop wishlists with details
    const shopWishlistsDetails = [];
    if (user.shopWishlists?.length > 0) {
      for (const wishlist of user.shopWishlists) {
        const totalItems = await Store.countDocuments({ _id: { $in: wishlist.items } });

        const items = await Store.find({ _id: { $in: wishlist.items } })
          .skip(skip)
          .limit(size)
          .lean();

        shopWishlistsDetails.push({
          name: wishlist.name,
          pagination: {
            totalItems,
            currentPage: pageNumber,
            pageSize: size,
            totalPages: Math.ceil(totalItems / size),
          },
          items,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Wishlists fetched successfully.',
      wishlistDetails: {
        productWishlists: productWishlistsDetails,
        shopWishlists: shopWishlistsDetails,
      },
    });

  } catch (error) {
    console.error('Error fetching wishlist with details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



exports.deleteWatchList = async (req, res) => {
  try {
    const { userId, listingId } = req.params;

    if (!userId || !listingId) {
      return res.status(400).json({ message: 'User ID and Listing ID are required.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    let updated = false;

    // Remove from product wishlists
    if (user.productWishlists?.length > 0) {
      for (const wishlist of user.productWishlists) {
        const index = wishlist.items.findIndex(
          (id) => id.toString() === listingId.toString()
        );
        if (index > -1) {
          wishlist.items.splice(index, 1);
          updated = true;
          break;
        }
      }
    }

    // Remove from shop wishlists
    if (!updated && user.shopWishlists?.length > 0) {
      for (const wishlist of user.shopWishlists) {
        const index = wishlist.items.findIndex(
          (id) => id.toString() === listingId.toString()
        );
        if (index > -1) {
          wishlist.items.splice(index, 1);
          updated = true;
          break;
        }
      }
    }

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found in any wishlist.'
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Listing removed from wishlist successfully.',
      wishlist: {
        productWishlists: user.productWishlists,
        shopWishlists: user.shopWishlists
      }
    });

  } catch (error) {
    console.error('Error deleting wishlist item:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.refreshTokenController = async (req, res) => {
    const { refreshToken } = req.body;

    console.log('Refresh Token Request:', req.body);

    if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.trim() === '') {
        return res.status(400).json({ message: 'Refresh token is required' });
    }

    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);

        if (!decoded || !decoded.userId || !decoded.tenantId) {
            return res.status(401).json({ message: 'Invalid refresh token payload' });
        }

        // Get user from DB
        const user = await User.findById(decoded.userId);
        if (!user || user.tenantId !== decoded.tenantId) {
            return res.status(401).json({ message: 'Invalid refresh token - tenant mismatch or user not found' });
        }

        // Generate new access token
        const newAccessToken = jwt.sign(
            {
                userId: user._id,
                tenantId: user.tenantId,
                role: user.userRole
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '5d' }
        );

        // Generate new refresh token
        const newRefreshToken = jwt.sign(
            {
                userId: user._id,
                tenantId: user.tenantId
            },
            process.env.REFRESH_SECRET_KEY,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
        );

        return res.status(200).json({
            access_token: newAccessToken,
            refresh_token: newRefreshToken
        });

    } catch (error) {
        console.error('Refresh Token Error:', error.message);
        return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
};


exports.sellerRegistrationController = async (req, res) => {
    try {
        const { firstName, lastName, email, businessInfo, contactInfo, password, confirmPassword } = req.body;

        if (!firstName || !lastName || !email || !businessInfo || !contactInfo || !password || !confirmPassword) {
            return res.status(400).json({ message: 'All required fields must be provided' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        const tenantId = Math.random().toString(36).substring(2, 15);

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = new User({
            tenantId,
            password: hashedPassword,
            firstName,
            lastName,
            email,
            userRole: 'seller',
            businessInfo,
            contactInfo,
        });

        let accessToken;
        try {
            accessToken = jwt.sign(
                { userId: user._id, tenantId, role: user.userRole },
                process.env.JWT_SECRET,
                { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '5d' }
            );
        } catch (err) {
            console.error('Access token generation error:', err);
            return res.status(500).json({ message: 'Failed to generate access token' });
        }

        let refreshToken;
        try {
            const refreshSecretKey = process.env.REFRESH_SECRET_KEY || "refresh-secret-key";
            refreshToken = jwt.sign(
                { userId: user._id, tenantId, role: user.userRole },
                refreshSecretKey,
                { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
            );
        } catch (err) {
            console.error('Refresh token generation error:', err);
            return res.status(500).json({ message: 'Failed to generate refresh token' });
        }

        user.accessToken = accessToken;
        user.refreshToken = refreshToken;

        await user.save();

        return res.status(201).json({
            message: 'Seller registration successful',
            user,
            accessToken,
            refreshToken
        });

    } catch (error) {
        console.error('Seller Registration Error:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Invalid data provided', details: error.errors });
        }
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Email already exists' });
        }

        return res.status(500).json({ message: 'Server error during seller registration' });
    }
};


exports.getSellerStoreProfile = async (req, res) => {
    try {
        const { userId ,role } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        const store = await Store.find({ sellerId: userId });

        res.status(200).json({
            success: true,
            message: 'Store profile retrieved successfully',
            data: store
        });

    } catch (error) {
        console.error('Error retrieving store profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
}