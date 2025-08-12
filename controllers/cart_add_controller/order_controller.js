const Order = require('../../models/order_model/order_model');
const Listing = require('../../models/listing_model/listing_model');
const mongoose = require('mongoose');


exports.placeOrderController = async (req, res) => {
    try {
        const { buyerId, sellerIds, listingIds, shippingAddress, shippingOption, totalAmount } = req.body;

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

        const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

        const orders = await Order.find({ sellerIds: { $in: [sellerObjectId] } });

        const allListingIds = orders.flatMap(order => order.listingIds || []);

        const uniqueListingIds = [...new Set(allListingIds.map(id => id.toString()))];

        const listings = await Listing.find({ _id: { $in: uniqueListingIds } });

        // Response
        res.status(200).json({
            success: true,
            orders,
            listings
        });
    } catch (error) {
        console.error('Error fetching seller orders and listings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};