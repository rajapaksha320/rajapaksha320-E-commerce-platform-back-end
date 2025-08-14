const express = require('express');
const router = express.Router();
const cartController = require('../../controllers/cart_add_controller/cart_add_controller');

// add to cart
router.post('/add', cartController.addToCartController)

router.get('/user/:buyerId', cartController.getUserCartController);

router.post('/update', cartController.updateCartItemController);

router.delete('/delete-cart/:cartItemId', cartController.deleteCartItem);


module.exports = router;