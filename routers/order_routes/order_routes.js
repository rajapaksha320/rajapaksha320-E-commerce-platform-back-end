const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/cart_add_controller/order_controller');



router.post("/place-order", orderController.placeOrderController);

router.get('/seller-orders/:sellerId', orderController.getEachSellerOrders);

module.exports = router;