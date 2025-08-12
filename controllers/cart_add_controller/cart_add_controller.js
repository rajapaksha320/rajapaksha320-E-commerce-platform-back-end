const Cart = require('../../models/cart_model/cart_model');
const CartItem = require('../../models/cart_model/cart_item_model');
const Listing = require('../../models/listing_model/listing_model');

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

        if (!buyerId) {
            return res.status(400).json({
                success: false,
                message: 'buyerId is required',
            });
        }

        const cartItems = await Cart.find({ buyerId }).lean();

        if (cartItems.length === 0) {
            return res.status(200).json({
                success: true,
                cartData: [],
                message: 'Cart is empty'
            });
        }

        const listingIds = cartItems.map(item => item.listingId);

        const listings = await Listing.find({ _id: { $in: listingIds } }).lean();

        const cartData = cartItems.map(item => ({
            ...item,
            listing: listings.find(l => l._id.toString() === item.listingId.toString()) || null
        }));

        res.status(200).json({
            success: true,
            cartData
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

