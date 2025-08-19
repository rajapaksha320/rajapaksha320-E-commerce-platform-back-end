const Store = require('../../models/store_model/store_model');
const ListingModel = require('../../models/listing_model/listing_model');
const cloudinary = require('../../config/cloudinary');
const User = require('../../models/auth_model/User')
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

exports.filterShopsUsingCategory = async (req, res) => {
  try {
    const { categoryMain, categorySub, page = 1, pageSize = 10 } = req.query;

    const shops = await Store.find().lean();
    const allListings = await ListingModel.find().lean();

    const filterArray = [];

    for (const shop of shops) {
      const shopSellerId = shop.sellerId?.toString();

      // Filter listings that belong to this shop and match query category
      const shopListings = allListings.filter(listing => {
        const listingSellerId = listing.sellerDetails?.toString();

        if (categoryMain === 'All') return shopSellerId === listingSellerId;

        return (
          shopSellerId === listingSellerId &&
          listing.category &&
          listing.category.main === categoryMain &&
          (!categorySub || listing.category.sub === categorySub)
        );
      });

      if (shopListings.length > 0) {
        // Calculate counts per main category for this shop
        const categoryCounts = {};
        const shopAllListings = allListings.filter(listing => listing.sellerDetails?.toString() === shopSellerId);

        for (const listing of shopAllListings) {
          if (listing.category && listing.category.main) {
            categoryCounts[listing.category.main] = (categoryCounts[listing.category.main] || 0) + 1;
          }
        }

        filterArray.push({
          shop,
          listings: shopListings,
          totalProductsInCategory: shopListings.length,
          categoryCounts // counts per main category
        });
      }
    }

    // Pagination
    const pageNumber = parseInt(page);
    const size = parseInt(pageSize);
    const total = filterArray.length;
    const start = (pageNumber - 1) * size;
    const end = start + size;
    const paginatedData = filterArray.slice(start, end);

    res.status(200).json({
      success: true,
      message: 'Shops filtered successfully',
      data: paginatedData,
      totalShops: total,
      pagination: {
        total,
        page: pageNumber,
        pageSize: size,
        totalPages: Math.ceil(total / size)
      }
    });

  } catch (error) {
    console.log('Error filtering shops:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};


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
    const { updateData, role } = req.body;

    if (role !== 'seller' && role !== 'admin') {
      return res.status(403).json({
        message: 'Unauthorized action. Only sellers or admins can update stores.',
      });
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


exports.getAllCreatedStore = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const totalStores = await Store.countDocuments();

    const allStores = await Store.find()
      .skip(skip)
      .limit(pageSize);

    if (!allStores || allStores.length === 0) {
      return res.status(404).json({ message: 'No stores found' });
    }

    const allStoreWithSeller = await Promise.all(
      allStores.map(async (store) => {
        // Count listings for this store
        const totalListings = await ListingModel.countDocuments({
          sellerDetails: store.sellerId,
        });

        // Update totalProducts field if needed
        if (store.totalProducts !== totalListings) {
          store.totalProducts = totalListings;
          await store.save();
        }

        // Get seller details
        const seller = await User.findById(store.sellerId);

        return {
          store,
          seller,
          totalListings, // also send in response
        };
      })
    );

    res.status(200).json({
      message: 'All stores retrieved successfully',
      data: allStoreWithSeller,
      pagination: {
        total: totalStores,
        page,
        pageSize,
        totalPages: Math.ceil(totalStores / pageSize),
      },
      success: true,
    });
  } catch (error) {
    console.error('Error retrieving stores:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.getEachShopsListing = async (req, res) => {
  try {
    const { sellerId, page = 1, pageSize = 10 } = req.query;

    const pageNumber = parseInt(page);
    const size = parseInt(pageSize);
    const skip = (pageNumber - 1) * size;

    // Get total count for pagination
    const totalListings = await ListingModel.countDocuments({ sellerDetails: sellerId });

    // Paginated query
    const listings = await ListingModel.find({ sellerDetails: sellerId })
      .skip(skip)
      .limit(size);

    if (!listings || listings.length === 0) {
      return res.status(404).json({ message: 'No listings found for this shop' });
    }

    res.status(200).json({
      message: 'Shop listings retrieved successfully',
      data: listings,
      pagination: {
        total: totalListings,
        page: pageNumber,
        pageSize: size,
        totalPages: Math.ceil(totalListings / size)
      },
      success: true
    });

  } catch (error) {
    console.error('Error retrieving shop listings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

exports.getOneShopById = async (req, res) => {
  try {
    const { storeId } = req.params;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'storeId is required',
      });
    }

    const shop = await Store.findById(storeId).lean();

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: shop,
    });
  } catch (error) {
    console.error('Error fetching shop:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};