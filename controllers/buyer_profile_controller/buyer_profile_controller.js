const User = require('../../models/auth_model/User');
const mongoose = require('mongoose');

exports.updateBuyerProfile = async (req, res) => {
  try {
    const { 
      userId, 
      firstName, 
      lastName, 
      phoneNumber, 
      dateOfBirth, 
      gender, 
      bio, 
      isActive 
    } = req.body;

    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid userId is required.'
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Update fields if provided
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (gender !== undefined) user.gender = gender;
    if (bio !== undefined) user.bio = bio;
    if (isActive !== undefined) user.isActive = isActive;

    // Save updated user
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: user
    });

  } catch (error) {
    console.error('Error updating buyer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Issue occurred while updating user profile.',
      error: error.message
    });
  }
};


exports.deleteBuyerProfile = async (req, res) => {
  try {
    const { buyerId } = req.params;

    // Validate buyerId
    if (!buyerId || !mongoose.Types.ObjectId.isValid(buyerId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid buyerId is required in query.'
      });
    }

    // Find and delete the user
    const deletedUser = await User.findByIdAndDelete(buyerId);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Buyer profile deleted successfully.',
      data: deletedUser
    });

  } catch (error) {
    console.error('Error deleting buyer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while deleting buyer profile.',
      error: error.message
    });
  }
};