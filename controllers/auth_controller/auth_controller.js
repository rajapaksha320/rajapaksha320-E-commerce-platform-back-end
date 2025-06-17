const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/auth_model/User');
// const sendEmail = require('../utils/sendEmail');

exports.signup = async (req, res) => {
    try {
        console.log(req.body);

        const {
            email,
            password,
            confirmPassword,
            tenantId,
            firstName,
            lastName,
            agreeTerms,
            userRole,
            emailVerified = false, // Default to false if not provided
        } = req.body;

        if (!email || !password || !confirmPassword || !firstName || !lastName || !tenantId || !userRole) {
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
    const { email, password, tenantId } = req.body;
    const user = await User.findOne({ email, tenantId });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id, tenantId, role: user.userRole }, process.env.JWT_SECRET, { expiresIn: '1h' });

    if (!token) {
        return res.status(500).json({ message: 'Token generation failed' });
    }
    res.status(200).json({ message: 'Login successful', jwt_token: token });

};

exports.forgotPassword = async (req, res) => {
    const { email, tenantId } = req.body;

    const user = await User.findOne({ email, tenantId });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const token = Math.random().toString(36).substr(2);
    user.resetToken = token;

    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    // await sendEmail(email, 'Password Reset', `Use this token: ${token}`);
    res.json({ message: 'Reset email sent , check your inbox' });
};

exports.resetPassword = async (req, res) => {
    const { email, tenantId, token, newPassword } = req.body;

    const user = await User.findOne({
        email,
        tenantId,
        resetToken: token,
        resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = await bcrypt.hash(newPassword, 12);
    if (!user.password) {
        return res.status(500).json({ message: 'Password reset failed' });
    }
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.json({ message: 'Password reset successful' });
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

        const user = await User.findOne({ tenantId });

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