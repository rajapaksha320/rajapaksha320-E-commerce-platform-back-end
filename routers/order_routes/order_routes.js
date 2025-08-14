const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/cart_add_controller/order_controller');



router.post("/place-order", orderController.placeOrderController);

router.get('/seller-orders/:sellerId', orderController.getEachSellerOrders);

router.get('/buyer-orders/:buyerId', orderController.getEachBuyerOrders);

router.post("/review-ratings", orderController.addReviewRating);

router.get("/get-shop-reviews/:shopId", orderController.getAllReviewsWithEachShops);

router.delete('/delete-review', orderController.deleteSellerRatings);

module.exports = router;