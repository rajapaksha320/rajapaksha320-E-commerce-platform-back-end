const Store = require('../../models/store_model/store_model');
const cloudinary = require('../../config/cloudinary');
const fs = require('fs');

exports.createStoreController = async (req, res) => {
  try {
    console.log(req.body);
    const {
      storeName,
      storeDescription,
      storeLocation,
      storeLogo,
      bannerImage,
      totalSales = 0,
      categoryId,
      storePolicies,
      totalProducts = 0,
      socialMediaLinks = [],
      status = 'active',
      rating = 0,
      role,
      userId,
      tenantId
    } = req.body;

    //  if( !storeName || !categoryId || !userId || !tenantId) {
    //     return res.status(400).json({ message: 'Store name, category ID, user ID and tenant ID are required.' });
    //   }

    if (role != 'seller') {
      return res.status(403).json({ message: 'Unauthorized action. Only sellers can create stores.' });
    }

    //   console.log(req.body.tenantId);


    const newStore = new Store({
      storeName,
      storeDescription,
      storeLocation,
      storeLogo,
      bannerImage,
      totalSales,
      sellerId: userId,
      categoryId,
      storePolicies,
      totalProducts,
      socialMediaLinks,
      status,
      rating,
      tenantId: tenantId,
    });

    const store = await newStore.save();
    if (!store) {
      return res.status(500).json({ message: 'Store creation failed' });
    }
    res.status(201).json({
      message: 'Store created successfully',
      data: store,
      success: true
    });

  } catch (error) {
    console.error('Error creating store:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

exports.filterShopsUsingCtaegory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    console.log('Filtering shops for category:', categoryId);


    // Find stores that match the categoryId
    const shops = await Store.find({ categoryId: categoryId });

    if (shops.length === 0) {
      return res.status(404).json({ success: false, message: 'No shops found for this category' });
    }

    res.status(200).json({
      success: true,
      message: 'Shops filtered successfully',
      data: shops
    });

  } catch (error) {
    console.log('Error filtering shops:', error);
    res.status(500).json({ success: false, message: 'Server error' });

  }
}


exports.createStoreImages = async (req, res) => {
  try {
    const filePath = req.file.path;

    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'my_uploads',
    });

    fs.unlinkSync(filePath);

    res.status(200).json({
      message: 'Image uploaded successfully',
      url: result.secure_url,
    });

  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
}

exports.createStoreProfile = async (req, res) => {
  try {
    const {
      storeName,
      storeTagLine,
      storeDescription,
      storeLocation,
      storeContactNumber,
      storeEmail,
      storeWebsite,
      storeBusinessHours,
      storeLogo,
      bannerImage,
      totalSales = 0,
      totalProducts = 0,
      status = 'active',
      rating = 0,
      role,
      userId
    } = req.body;

    if (role !== 'seller') {
      return res.status(403).json({ message: 'Unauthorized action. Only sellers can create stores.' });
    }

    const newStore = new Store({
      sellerId: userId,
      basicInformation: {
        storeName,
        storeTagLine,
        storeDescription
      },
      contactDetails: {
        storeLocation,
        storeContactNumber,
        storeEmail,
        storeWebsite,
        storeBusinessHours
      },
      shopMedia: {
        storeLogo,
        bannerImage
      },
      totalSales,
      totalProducts,
      status,
      rating
    });

    const store = await newStore.save();

    if (!store) {
      return res.status(500).json({ message: 'Store creation failed' });
    }

    res.status(201).json({
      message: 'Store created successfully',
      data: store,
      success: true
    });

  } catch (error) {
    console.error('Error creating store profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.updateStoreProfile = async (req, res) => {
  try {
    const { storeId } = req.params;
    const {updateData , role} = req.body;

    if (role !== 'seller') {
      return res.status(403).json({ message: 'Unauthorized action. Only sellers can update stores.' });
    }

    const updatedStore = await Store.findByIdAndUpdate(storeId, updateData, { new: true });

    if (!updatedStore) {
      return res.status(404).json({ message: 'Store not found' });
    }
    res.status(200).json({
      message: 'Store updated successfully',
      data: updatedStore,
      success: true
    });

  } catch (error) {
    console.error('Error updating store profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};