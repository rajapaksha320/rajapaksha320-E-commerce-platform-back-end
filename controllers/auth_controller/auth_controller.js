const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/auth_model/User');
const sendEmail = require('../../utils/nodemailer');

exports.signup = async (req, res) => {
    try {
        console.log(req.body);
        const tenantId = Math.random().toString(36).substring(2, 15);
        const userRole = 'user'; // Default user role

        const {
            email,
            password,
            confirmPassword,
            firstName,
            lastName,
            agreeTerms,
            emailVerified = false, // Default to false if not provided
        } = req.body;

        if (!email || !password || !confirmPassword || !firstName || !lastName || !tenantId) {
            return res.status(400).json({ message: 'All required fields must be provided and terms agreed.' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match.' });
        }

        const existingUser = await User.findOne({ email, tenantId });

        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
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
            return res.status(500).json({ message: 'User creation failed' });
        }

        res.status(201).json({
            message: 'User created successfully',
            success: true,
        });

    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ message: 'Server error during signup' });
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
    res.status(200).json({ message: 'Login successful', access_token: accessToken, refresh_token: refreshToken, userId: user._id, tenantId, userRole: user.userRole, emailVerified: user.emailVerified });
};

exports.forgotPassword = async (req, res) => {
    const { email, tenantId } = req.body;

    const user = await User.findOne({ email, tenantId });

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
    const { email, tenantId, otp } = req.body;

    if (!email || !tenantId || !otp) {
        return res.status(400).json({
            success: false,
            message: "All fields are required.",
        });
    }

    const user = await User.findOne({ email, tenantId });

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
        const { email, newPassword } = req.body;

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
        console.log('req.body', req.body);

        const { userWishlist, userId, tenantId } = req.body;

        if (!userWishlist || !userId || !tenantId) {
            return res.status(400).json({ message: 'Store ID, user ID, and tenant ID are required.' });
        }

        // find the user by userId and tenantId
        const user = await User.findOne({ _id: userId, tenantId });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        console.log(user);

        for (const storeId of userWishlist) {
            const index = user.userWishlist.indexOf(storeId);

            if (index === -1) {
                user.userWishlist.push(storeId);
            } else {
                user.userWishlist.splice(index, 1);
                console.log(`Store ID ${storeId} already exists in wishlist, removing it.`);
            }
        }


        await user.save();

        console.log('Updated user:', user);

        res.status(200).json({
            success: true,
            message: 'Wishlist updated successfully',
            data: user
        });

    } catch (error) {
        console.error('Error updating wishlist:', error);
        res.status(500).json({ message: 'Server error' });
    }
}


exports.refreshTokenController = async (req, res) => {
    const { refreshToken, tenantId } = req.body;

    console.log('Refresh Token Request:', req.body);
    console.log(tenantId);

    if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.trim() === '' || !tenantId) {
        return res.status(400).json({ message: 'Refresh token and tenant ID are required' });
    }

    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);

        // Validate token content
        if (!decoded || !decoded.userId || !decoded.tenantId) {
            return res.status(401).json({ message: 'Invalid refresh token payload' });
        }

        // Get user from DB
        const user = await User.findById(decoded.userId);
        if (!user || user.tenantId !== tenantId) {
            return res.status(401).json({ message: 'Invalid refresh token - tenant mismatch or user not found' });
        }

        // Generate new access token
        const newAccessToken = jwt.sign(
            { userId: user._id, tenantId, role: user.userRole },
            process.env.JWT_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '5d' }
        );

        return res.status(200).json({ access_token: newAccessToken });

    } catch (error) {
        console.error('Refresh Token Error:', error.message);
        return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
};


exports.sellerRegistrationController = async (req, res) => {
    const { firstName, lastName , email, businessInfo, contactInfo } = req.body;

    if (!businessInfo || !contactInfo) {
        return res.status(400).json({ message: 'Business info and contact info are required' });
    }

    const tenantId = Math.random().toString(36).substring(2, 15);

    try {
        
        const user = await User.create({
            tenantId,
            firstName,
            lastName,
            email,
            userRole: 'seller',
            businessInfo,
            contactInfo,
        })

        const accessToken = jwt.sign(
            { userId: user._id, tenantId, role: user.userRole },
            process.env.JWT_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '5d' }
        );

        if (!accessToken) {
            return res.status(500).json({ message: 'Token generation failed' });
        }

        user.accessToken = accessToken;

        const refreshSecretKey =
            process.env.REFRESH_SECRET_KEY || "refresh-secret-key";

        const refreshToken = jwt.sign(
            { userId: user._id, tenantId, role: user.userRole },
            refreshSecretKey,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
        );
        if (!refreshToken) {
            return res.status(500).json({ message: 'Refresh token generation failed' });
        }

        user.refreshToken = refreshToken;

        await user.save();

        res.status(200).json({ message: 'Seller registration successful', user , accessToken, refreshToken });

    } catch (error) {
        console.error('Seller Registration Error:', error);
        res.status(500).json({ message: 'Server error during seller registration' });
    }
}
