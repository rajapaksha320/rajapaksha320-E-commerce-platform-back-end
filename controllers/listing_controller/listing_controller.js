const User = require('../../models/auth_model/User');
const ListingModel = require('../../models/listing_model/listing_model');
const mongoose = require('mongoose');


exports.createListing = async (req, res) => {
    try {
        console.log(req.body);
        console.log(req.user);

        const listingData = req.body;

        // Validate required fields
        if (!listingData.userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        // Optionally, check if user exists
        const userExists = await User.exists({ _id: listingData.userId });
        if (!userExists) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Assign sellerDetails as ObjectId
        const newListing = new ListingModel({ ...listingData, sellerDetails: listingData.userId });
        await newListing.save();

        res.status(201).json({ message: 'Listing created successfully', listing: newListing });

    } catch (error) {
        console.error('Error creating listing:', error);
        res.status(500).json({ message: 'Error creating listing', error: error.message });
    }
};


exports.updateListing = async (req, res) => {
    try {
        const listingId = req.params.listingId;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(listingId)) {
            return res.status(400).json({ message: 'Invalid listing ID' });
        }

        // Find the listing and update it
        const updatedListing = await ListingModel.findByIdAndUpdate(listingId, updateData, { new: true });

        if (!updatedListing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        res.status(200).json({ message: 'Listing updated successfully', listing: updatedListing });

    } catch (error) {
        console.error('Error updating listing:', error);
        res.status(500).json({ message: 'Error updating listing', error: error.message });

    }
}

exports.getListingById = async (req, res) => {
    try {
        const listingId = req.params.listingId;

        if (!mongoose.Types.ObjectId.isValid(listingId)) {
            return res.status(400).json({ message: 'Invalid listing ID' });
        }

        const listing = await ListingModel.findOne({ _id: listingId });

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        const userId = listing.sellerDetails;
        const user = await User.find({ _id: userId });

        res.status(200).send({
            success: true,
            listing: listing,
            sellerInfo: user
        });

    } catch (error) {
        console.error('Error fetching listing:', error);
        res.status(500).json({ message: 'Error fetching listing', error: error.message });
    }
};


exports.getOneSellerListing = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { page = 1, pageSize = 10 } = req.query;

        const pageNumber = parseInt(page);
        const size = parseInt(pageSize);
        const skip = (pageNumber - 1) * size;

        const totalListings = await ListingModel.countDocuments({ sellerDetails: userId });

        const listings = await ListingModel.find({ sellerDetails: userId })
            .skip(skip)
            .limit(size);

        if (!listings || listings.length === 0) {
            return res.status(404).json({ message: 'No listings found for this seller' });
        }

        res.status(200).json({
            success: true,
            listings,
            pagination: {
                total: totalListings,
                page: pageNumber,
                pageSize: size,
                totalPages: Math.ceil(totalListings / size),
            },
        });

    } catch (error) {
        console.error('Error fetching seller listing:', error);
        res.status(500).json({ message: 'Error fetching seller listing', error: error.message });
    }
};


exports.getAllListing = async (req, res) => {
    try {
        console.log(req.user);

        const { role } = req.user; // role from JWT
        const { page = 1, pageSize = 10 , sellerId  } = req.query;
        const pageNumber = parseInt(page);
        const size = parseInt(pageSize);
        const skip = (pageNumber - 1) * size;

        // Role-based filter
        let filter = {};
        if (role !== 'admin') {
            // Only active listings for buyers and sellers
            filter.isDiactivate = false;
        }

        if (sellerId) {
            if (!mongoose.Types.ObjectId.isValid(sellerId)) {
                return res.status(400).json({ message: 'Invalid sellerId' });
            }
            filter.sellerDetails = sellerId;
        }

        // Total count for pagination
        const totalListings = await ListingModel.countDocuments(filter);

        // Paginated listing query
        const listings = await ListingModel.find(filter)
            .skip(skip)
            .limit(size)
            .lean();

        if (!listings || listings.length === 0) {
            return res.status(404).json({ message: 'No listings found' });
        }

        // Attach seller info
        const listingsWithSeller = await Promise.all(
            listings.map(async (listing) => {
                let seller = null;
                if (mongoose.Types.ObjectId.isValid(listing.sellerDetails)) {
                    seller = await User.findById(listing.sellerDetails).lean();
                }
                return {
                    ...listing,
                    sellerInfo: seller,
                };
            })
        );

        res.status(200).json({
            success: true,
            listings: listingsWithSeller,
            pagination: {
                total: totalListings,
                page: pageNumber,
                pageSize: size,
                totalPages: Math.ceil(totalListings / size),
            },
        });

    } catch (error) {
        console.error('Error fetching all listings:', error);
        res.status(500).json({
            message: 'Error fetching all listings',
            error: error.message,
        });
    }
};


// removed
exports.getListingByStatus = async (req, res) => {
    try {
        const { page = 1, pageSize = 10, status } = req.query;

        if (!['active', 'inactive', 'draft', 'outOfStock', 'sold'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const pageNumber = parseInt(page);
        const size = parseInt(pageSize);
        const skip = (pageNumber - 1) * size;

        const totalListings = await ListingModel.countDocuments({ status });

        const listings = await ListingModel.find({ status })
            .skip(skip)
            .limit(size);

        if (!listings || listings.length === 0) {
            return res.status(404).json({ message: `No listings found with status ${status}` });
        }

        res.status(200).json({
            success: true,
            listings,
            pagination: {
                total: totalListings,
                page: pageNumber,
                pageSize: size,
                totalPages: Math.ceil(totalListings / size),
            },
        });

    } catch (error) {
        console.error('Error fetching listings by status:', error);
        res.status(500).json({ message: 'Error fetching listings by status', error: error.message });
    }
};



function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

exports.getListingByFilter = async (req, res) => {
    try {
        const { role } = req.user; // role from JWT
        const {
            status,
            category,
            priceRange,
            search,
            sellerId,
            page = 1,
            pageSize = 10
        } = req.query;

        const pageNumber = parseInt(page);
        const size = parseInt(pageSize);
        const skip = (pageNumber - 1) * size;

        // Role-based filter
        let filter = {};
        if (role !== 'admin') {
            filter.isDiactivate = false; // only active listings for seller/buyer
        }

        if (sellerId) {
            if (!mongoose.Types.ObjectId.isValid(sellerId)) {
                return res.status(400).json({ message: 'Invalid sellerId' });
            }
            filter.sellerDetails = sellerId;
        }

        if (status) {
            if (!['active', 'inactive', 'draft', 'outOfStock', 'sold'].includes(status)) {
                return res.status(400).json({ message: 'Invalid status' });
            }
            filter.status = status;
        }

        if (category) {
            filter['category.main'] = category;
        }

        if (search) {
            const escapedSearch = escapeRegex(search);
            filter.title = { $regex: escapedSearch, $options: 'i' };
        }

        if (priceRange) {
            const [minPrice, maxPrice] = priceRange.split('-').map(Number);
            if (!isNaN(minPrice) && !isNaN(maxPrice)) {
                filter['variations.price'] = { $gte: minPrice, $lte: maxPrice };
            }
        }

        const totalListings = await ListingModel.countDocuments(filter);

        const listings = await ListingModel.find(filter)
            .skip(skip)
            .limit(size)
            .lean();

        res.status(200).json({
            success: true,
            listings,
            pagination: {
                total: totalListings,
                page: pageNumber,
                pageSize: size,
                totalPages: Math.ceil(totalListings / size),
            },
        });

    } catch (error) {
        console.error('Error fetching listings:', error);
        res.status(500).json({
            message: 'Error fetching listings',
            error: error.message
        });
    }
};


exports.deleteOneListing = async (req, res) => {
    try {
        const listingId = req.params.listingId;

        if (!mongoose.Types.ObjectId.isValid(listingId)) {
            return res.status(400).json({ message: 'Invalid listing ID' });
        }

        const deletedListing = await ListingModel.findByIdAndDelete(listingId);

        if (!deletedListing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        res.status(200).json({ message: 'Listing deleted successfully', listing: deletedListing });

    } catch (error) {
        console.error('Error deleting listing:', error);
        res.status(500).json({ message: 'Error deleting listing', error: error.message });
    }
}

exports.getListingCategoryWise = async (req, res) => {
    try {
        const { category } = req.params;

        // Only active listings
        const listings = await ListingModel.find({
            'category.main': category,
            isDiactivate: false
        }).lean();

        if (!listings || listings.length === 0) {
            return res.status(404).json({ message: 'No listings found for this category' });
        }

        res.status(200).json({
            success: true,
            listings
        });

    } catch (error) {
        console.error('Error fetching listings by category:', error);
        res.status(500).json({ message: 'Error fetching listings by category', error: error.message });
    }
}