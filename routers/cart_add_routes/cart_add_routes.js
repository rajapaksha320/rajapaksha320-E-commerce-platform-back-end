const express = require('express');
const router = express.Router();
const cartController = require('../../controllers/cart_add_controller/cart_add_controller');

// add to cart
router.post('/add', cartController.addToCartController)

router.get('/user/:buyerId', cartController.getUserCartController);

module.exports = router;