const Cart = require('../../models/cart_model/cart_model');
const CartItem = require('../../models/cart_model/cart_item_model');
const Listing = require('../../models/listing_model/listing_model');
const Store = require('../../models/store_model/store_model');

exports.addToCartController = async (req, res) => {
    const session = await Cart.startSession();
    session.startTransaction();

    try {
        const { buyerId, listingId, quantity } = req.body;

        if (!buyerId || !listingId || !quantity) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: buyerId, listingId, quantity',
            });
        }

        const listing = await Listing.findById(listingId).session(session);
        if (!listing) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: 'Listing not found',
            });
        }

        const listingUpdate = listing.variations.quantity - quantity;
        if (listingUpdate < 0) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock',
            });
        }

        const existingCartItem = await Cart.findOne({ buyerId, listingId }).session(session);

        let cartDoc;
        if (existingCartItem) {
            existingCartItem.quantity += quantity;
            cartDoc = await existingCartItem.save({ session });
        } else {
            cartDoc = await Cart.create([{ buyerId, listingId, quantity }], { session });
            cartDoc = cartDoc[0];
        }

        listing.variations.quantity = listingUpdate;
        await Listing.findByIdAndUpdate(listingId, { variations: listing.variations }, { session });

        await session.commitTransaction();
        res.status(201).json({
            success: true,
            message: 'Item added to cart successfully',
            cartItem: cartDoc
        });

    } catch (error) {
        console.error('Error adding to cart:', error);
        await session.abortTransaction();
        res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        session.endSession();
    }
};

exports.getUserCartController = async (req, res) => {
    try {
        const { buyerId } = req.params;
        const { page = 1, size = 10 } = req.query;

        if (!buyerId) {
            return res.status(400).json({
                success: false,
                message: 'buyerId is required',
            });
        }

        const pageNumber = parseInt(page);
        const pageSize = parseInt(size);
        const skip = (pageNumber - 1) * pageSize;

        const totalItems = await Cart.countDocuments({ buyerId });

        if (totalItems === 0) {
            return res.status(200).json({
                success: true,
                cartData: [],
                totalItems: 0,
                totalPages: 0,
                currentPage: pageNumber,
                message: 'Cart is empty'
            });
        }

        const cartItems = await Cart.find({ buyerId })
            .skip(skip)
            .limit(pageSize)
            .lean();

        const listingIds = cartItems.map(item => item.listingId);

        const listings = await Listing.find({
            _id: { $in: listingIds },
            isDiactivate: false
        }).lean();

        const sellerIds = [
            ...new Set(
                listings
                    .filter(l => l.sellerDetails)
                    .map(l => l.sellerDetails.toString())
            )
        ];

        const stores = await Store.find({
            sellerId: { $in: sellerIds },
            isDiactivate: false
        }).lean();

        const cartData = cartItems
            .map(item => {
                const listing = listings.find(
                    l => l._id.toString() === item.listingId.toString()
                ) || null;

                let store = null;

                if (listing && listing.sellerDetails) {
                    store = stores.find(
                        s => s.sellerId.toString() === listing.sellerDetails.toString()
                    ) || null;
                }

                if (!listing) return null;

                return {
                    ...item,
                    listing,
                    store
                };
            })
            .filter(Boolean);

        res.status(200).json({
            success: true,
            cartData,
            totalItems: cartData.length,
            totalPages: Math.ceil(cartData.length / pageSize),
            currentPage: pageNumber
        });

    } catch (error) {
        console.error('Error getting user cart:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


exports.updateCartItemController = async (req, res) => {
    try {
        const { cartItemId, quantity } = req.body;

        if (!cartItemId || quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: 'cartItemId and quantity are required',
            });
        }

        const cartItem = await Cart.findById(cartItemId);
        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found',
            });
        }

        cartItem.quantity = quantity;
        await cartItem.save();

        res.status(200).json({
            success: true,
            message: 'Cart item updated successfully',
            cartItem
        });

    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}


exports.deleteCartItem = async (req, res) => {
    const session = await Cart.startSession();
    session.startTransaction();

    try {
        const { cartItemId } = req.params; // cart item ID to delete

        if (!cartItemId) {
            return res.status(400).json({ success: false, message: 'Cart item ID is required.' });
        }

        // Find the cart item
        const cartItem = await Cart.findById(cartItemId).session(session);
        if (!cartItem) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Cart item not found.' });
        }

        const listingId = cartItem.listingId;
        const quantityToRestore = cartItem.quantity;

        // Remove the cart item
        await Cart.findByIdAndDelete(cartItemId, { session });

        // Restore the quantity in the listing
        const listing = await Listing.findById(listingId).session(session);
        if (listing) {
            listing.variations.quantity += quantityToRestore;
            await Listing.findByIdAndUpdate(listingId, { variations: listing.variations }, { session });
        }

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: 'Cart item deleted successfully.'
        });

    } catch (error) {
        console.error('Error deleting cart item:', error);
        await session.abortTransaction();
        res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        session.endSession();
    }
};

