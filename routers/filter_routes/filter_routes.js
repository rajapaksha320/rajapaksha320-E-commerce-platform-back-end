const express = require('express');
const router = express.Router();
const filterController = require('../../controllers/filter_controller/filter_controller');
const authMiddleware = require('../../middlewares/auth_middleware/authMiddleware');

router.post('/byCategoryName', filterController.filterByCategoryName);

router.post('/byProductName', filterController.filterByProductName);

router.post('/productsFilter' , filterController.productsFilter);


module.exports = router;