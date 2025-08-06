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
        const listings = await ListingModel.find({ sellerDetails: userId });

        if (!listings || listings.length === 0) {
            return res.status(404).json({ message: 'No listings found for this seller' });
        }

        res.status(200).send({
            success: true,
            listings: listings
        });
        
    } catch (error) {
        console.error('Error fetching seller listing:', error);
        res.status(500).json({ message: 'Error fetching seller listing', error: error.message });
        
    }
}


exports.getAllListing = async (req, res) => {
    try {

        const listings = await ListingModel.find({ status: 'active' });

        if (!listings || listings.length === 0) {
            return res.status(404).json({ message: 'No active listings found' });
        }

        const listingsWithSeller = await Promise.all(
            listings.map(async (listing) => {
                let seller = null;
                if (mongoose.Types.ObjectId.isValid(listing.sellerDetails)) {
                    seller = await User.findById(listing.sellerDetails);
                }
                return {
                    ...listing.toObject(),
                    sellerInfo: seller
                };
            })
        );

        res.status(200).send({
            success: true,
            listings: listingsWithSeller
        });

    } catch (error) {
        console.error('Error fetching all listings:', error);
        res.status(500).json({ message: 'Error fetching all listings', error: error.message });
    }
}


exports.getListingByStatus = async (req, res) => {
    try {
        const status = req.params.status;

        if (!['active', 'inactive', 'draft', 'outOfStock', 'sold'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const listings = await ListingModel.find({ status: status });

        if (!listings || listings.length === 0) {
            return res.status(404).json({ message: `No listings found with status ${status}` });
        }

        res.status(200).send({
            success: true,
            listings: listings
        });
        
    } catch (error) {
        console.error('Error fetching listings by status:', error);
        res.status(500).json({ message: 'Error fetching listings by status', error: error.message });
        
    }
}


exports.getListingByFilter = async (req, res) => {
    try {
        const { categoryMain, categorySub, brand, priceRange } = req.query;

        let filter = {};

        if (categoryMain) {
            filter['category.main'] = categoryMain;
        }


        let listings = await ListingModel.find(filter);

        if (priceRange) {
            const [minPrice, maxPrice] = priceRange.split('-').map(Number);
            listings = listings.filter(listing =>
                listing.variations.some(variation => {
                    const price = parseFloat(variation.price);
                    return price >= minPrice && price <= maxPrice;
                })
            );
        }

        if (!listings || listings.length === 0) {
            return res.status(404).json({ message: 'No listings found with the specified filters' });
        }

        res.status(200).send({
            success: true,
            listings: listings
        });

    } catch (error) {
        console.error('Error fetching listings by filter:', error);
        res.status(500).json({ message: 'Error fetching listings by filter', error: error.message });
    }
}


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