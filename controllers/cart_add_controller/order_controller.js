const Order = require('../../models/order_model/order_model');
const Listing = require('../../models/listing_model/listing_model');
const Store = require('../../models/store_model/store_model');
const Review = require('../../models/review_model/review_model');

const mongoose = require('mongoose');


exports.placeOrderController = async (req, res) => {
    try {
        const { buyerId, sellerIds, listingIds, storeIds, shippingAddress, shippingOption, totalAmount } = req.body;

        if (!buyerId || !sellerIds || !listingIds || !shippingAddress || !shippingOption || !totalAmount) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: buyerId, sellerIds, listingIds, shippingAddress, shippingOption, totalAmount',
            });
        }

        const order = new Order({
            buyerId,
            sellerIds,
            listingIds: listingIds,
            storeIds: storeIds,
            shippingAddress,
            shippingOption,
            totalAmount
        });

        await order.save();

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order
        });


    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


exports.getEachSellerOrders = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const { page = 1, size = 10 } = req.query;

        const pageNumber = parseInt(page);
        const pageSize = parseInt(size);
        const skip = (pageNumber - 1) * pageSize;

        const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

        const totalOrders = await Order.countDocuments({ sellerIds: { $in: [sellerObjectId] } });

        const orders = await Order.find({ sellerIds: { $in: [sellerObjectId] } })
            .skip(skip)
            .limit(pageSize)
            .lean();

        const allListingIds = orders.flatMap(order => order.listingIds || []);
        const uniqueListingIds = [...new Set(allListingIds.map(id => id.toString()))];

        const listings = await Listing.find({ _id: { $in: uniqueListingIds } }).lean();

        const listingsMap = listings.reduce((acc, listing) => {
            acc[listing._id.toString()] = listing;
            return acc;
        }, {});

        const ordersWithListings = orders.map(order => ({
            ...order,
            listings: (order.listingIds || []).map(id => listingsMap[id.toString()] || null)
        }));

        res.status(200).json({
            success: true,
            orders: ordersWithListings,
            pagination: {
                totalOrders,
                totalPages: Math.ceil(totalOrders / pageSize),
                currentPage: pageNumber,
                pageSize
            }
        });
    } catch (error) {
        console.error('Error fetching seller orders and listings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};



exports.getEachBuyerOrders = async (req, res) => {
    try {
        const { buyerId } = req.params;
        const { page = 1, size = 10 } = req.query;

        const pageNumber = parseInt(page);
        const pageSize = parseInt(size);
        const skip = (pageNumber - 1) * pageSize;

        const buyerObjectId = new mongoose.Types.ObjectId(buyerId);

        const totalOrders = await Order.countDocuments({ buyerId: buyerObjectId });

        const orders = await Order.find({ buyerId: buyerObjectId })
            .skip(skip)
            .limit(pageSize)
            .lean();

        // ======== LISTINGS =========
        const allListingIds = orders.flatMap(order => order.listingIds || []);
        const uniqueListingIds = [...new Set(allListingIds.map(id => id.toString()))];

        const listings = await Listing.find({ _id: { $in: uniqueListingIds } }).lean();

        const listingsMap = listings.reduce((acc, listing) => {
            acc[listing._id.toString()] = listing;
            return acc;
        }, {});

        // ======== STORES =========
        const allStoreIds = orders.flatMap(order => order.storeIds || []);
        const uniqueStoreIds = [...new Set(allStoreIds.map(id => id.toString()))];

        const stores = await Store.find({ _id: { $in: uniqueStoreIds } }).lean();

        const storesMap = stores.reduce((acc, store) => {
            acc[store._id.toString()] = store;
            return acc;
        }, {});

        // ======== COMBINE DATA =========
        const ordersWithDetails = orders.map(order => ({
            ...order,
            listings: (order.listingIds || []).map(id => listingsMap[id.toString()] || null),
            stores: (order.storeIds || []).map(id => storesMap[id.toString()] || null)
        }));

        res.status(200).json({
            success: true,
            orders: ordersWithDetails,
            pagination: {
                totalOrders,
                totalPages: Math.ceil(totalOrders / pageSize),
                currentPage: pageNumber,
                pageSize
            }
        });
    } catch (error) {
        console.error('Error fetching buyer orders, listings, and stores:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


exports.addReviewRating = async (req, res) => {
    try {
        const { 
            buyerId, 
            shopId, 
            listingId,
            orderId, // used only to update the order
            review, 
            shoppingExperience, 
            customerService, 
            productQuality, 
            deliverySpeed 
        } = req.body;

        // Validate required fields
        if (!buyerId || !shopId || !listingId || !orderId) {
            return res.status(400).json({
                success: false,
                message: 'buyerId, shopId, listingId, and orderId are required'
            });
        }

        // Validate rating fields
        const ratings = [shoppingExperience, customerService, productQuality, deliverySpeed];
        if (ratings.some(r => typeof r !== 'number' || r < 0 || r > 5)) {
            return res.status(400).json({
                success: false,
                message: 'All ratings must be numbers between 0 and 5'
            });
        }

        // Calculate average rating
        const averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;

        // Check if review already exists (ignore orderId)
        let savedReview;
        const existingReview = await Review.findOne({ buyerId, shopId, listingId });

        if (!existingReview) {
            // Create new review
            const newReview = new Review({
                buyerId,
                shopId,
                listingId,
                review,
                shoppingExperience,
                customerService,
                productQuality,
                deliverySpeed,
                averageRating
            });
            savedReview = await newReview.save();
        } else {
            // Update existing review
            await Review.updateOne(
                { buyerId, shopId, listingId },
                {
                    review,
                    shoppingExperience,
                    customerService,
                    productQuality,
                    deliverySpeed,
                    averageRating
                }
            );
            savedReview = await Review.findOne({ buyerId, shopId, listingId });
        }

        // ----- UPDATE LISTING AVERAGE RATING -----
        const listingReviews = await Review.find({ listingId });
        const totalRating = listingReviews.reduce((sum, r) => sum + (r.averageRating || 0), 0);
        const calculatedListingAverage = listingReviews.length > 0 
            ? totalRating / listingReviews.length 
            : 0;

        await Listing.updateOne(
            { _id: listingId },
            { 
                averageRating: calculatedListingAverage,
                review: review,
                updatedAt: Date.now()
            }
        );

        // ----- MARK THE ORDER AS REVIEWED -----
        await Order.updateOne(
            { _id: orderId },
            { isReviewed: true, updatedAt: Date.now() }
        );

        res.status(201).json({
            success: true,
            message: 'Review and rating saved successfully, listing updated, order marked as reviewed',
            review: savedReview
        });

    } catch (error) {
        console.error('Error adding review rating:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};


exports.getAllReviewsWithEachShops = async (req, res) => {
    try {
        // Get pagination params
        const { page = 1, size = 10 } = req.query;
        const pageNumber = parseInt(page);
        const pageSize = parseInt(size);
        const skip = (pageNumber - 1) * pageSize;

        // Count total reviews (for pagination info)
        const totalReviews = await Review.countDocuments();

        // Fetch reviews for the current page
        const reviews = await Review.find()
            .populate('shopId') // populate shop data
            .skip(skip)
            .limit(pageSize)
            .lean();

        // Track shop ratings to calculate combined ratings
        const shopRatingsMap = {};

        for (const review of reviews) {
            if (review.shopId) {
                const shopIdStr = review.shopId._id.toString();

                if (!shopRatingsMap[shopIdStr]) {
                    shopRatingsMap[shopIdStr] = {
                        totalRating: 0,
                        count: 0
                    };
                }

                shopRatingsMap[shopIdStr].totalRating += review.averageRating || 0;
                shopRatingsMap[shopIdStr].count += 1;
            }
        }

        // Attach calculated shop average ratings
        const reviewsWithUpdatedShops = reviews.map(review => {
            if (review.shopId) {
                const shopIdStr = review.shopId._id.toString();
                const shopData = shopRatingsMap[shopIdStr];

                const calculatedShopRating =
                    shopData && shopData.count > 0
                        ? shopData.totalRating / shopData.count
                        : 0;

                return {
                    ...review,
                    shopId: {
                        ...review.shopId,
                        rating: calculatedShopRating
                    }
                };
            }
            return review;
        });

        res.status(200).json({
            success: true,
            reviews: reviewsWithUpdatedShops,
            pagination: {
                totalReviews,
                totalPages: Math.ceil(totalReviews / pageSize),
                currentPage: pageNumber,
                pageSize
            }
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};


exports.deleteSellerRatings = async (req, res) => {
    try {
        const { reviewId } = req.query;

        if (!reviewId) {
            return res.status(400).json({
                success: false,
                message: 'reviewId is required'
            });
        }

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reviewId'
            });
        }

        // Find and delete the review in one step
        const reviewToDelete = await Review.findByIdAndDelete(reviewId);

        if (!reviewToDelete) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        const { listingId, shopId } = reviewToDelete;

        // ----- UPDATE LISTING AVERAGE RATING -----
        if (listingId) {
            const listingReviews = await Review.find({ listingId });
            const newListingAverage =
                listingReviews.length > 0
                    ? listingReviews.reduce((sum, r) => sum + (r.averageRating || 0), 0) / listingReviews.length
                    : 0;

            await Listing.updateOne(
                { _id: listingId },
                { averageRating: newListingAverage, updatedAt: Date.now() }
            );
        }

        // ----- UPDATE SHOP AVERAGE RATING -----
        if (shopId) {
            const shopReviews = await Review.find({ shopId });
            const newShopAverage =
                shopReviews.length > 0
                    ? shopReviews.reduce((sum, r) => sum + (r.averageRating || 0), 0) / shopReviews.length
                    : 0;

            await Store.updateOne(
                { _id: shopId },
                { rating: newShopAverage }
            );
        }

        res.status(200).json({
            success: true,
            message: 'Review deleted and ratings updated successfully'
        });

    } catch (error) {
        console.error('Error deleting seller rating:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};


