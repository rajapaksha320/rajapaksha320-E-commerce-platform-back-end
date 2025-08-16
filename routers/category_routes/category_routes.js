const express = require('express');
const categoryController = require('../../controllers/category_controller/category_controller');
const router = express.Router();



// create category
router.post('/create',categoryController.createNewCategory)

// fetch all category
router.get('/fetch-all',categoryController.getAllCategory)


// main filter
router.post("/main-filter",categoryController.mainFilterController)

module.exports = router;