const express = require('express');
const productController = require('../../controllers/product_controller/product_controller');
const authMiddleware = require('../../middlewares/auth_middleware/authMiddleware');


const router = express.Router();


// create new product
router.post('/create',authMiddleware ,productController.createNewProduct)

// get all products in a store
router.get('/store/:storeId', productController.getAllProductByStoreId);

module.exports = router;