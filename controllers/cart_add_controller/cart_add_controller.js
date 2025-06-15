const Cart = require('../../models/cart_model/cart_model');
const CartItem = require('../../models/cart_model/cart_item_model');

exports.addToCartController = async (req, res) => {
    try {
        const session = await Cart.startSession();
        session.startTransaction();

        const { userId, storeId, variantId, quantity, priceAtAddition } = req.body;

        if (!userId || !storeId || !variantId || !quantity || !priceAtAddition) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: userId, storeId, variantId, quantity, priceAtAddition',
            });
        }

        let cart = await Cart.findOne({ userId, storeId });

        if (!cart) {
            cart = await Cart.create({
                userId,
                storeId,
                createdAt: new Date(),
                updatedAt: new Date(),
            }, { session });
        } else {
            cart.updatedAt = new Date();
            await cart.save();
        }

        const existingItem = await CartItem.findOne({
            cartId: cart._id,
            variantId,
        });

        if (existingItem) {
            existingItem.quantity += quantity;
            existingItem.priceAtAddition = priceAtAddition;
            await existingItem.save();
        } else {
            await CartItem.create({
                cartId: cart._id,
                variantId,
                quantity,
                priceAtAddition,
            }, { session });
        }

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: 'Item added to cart successfully',
            cartId: cart._id,
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
