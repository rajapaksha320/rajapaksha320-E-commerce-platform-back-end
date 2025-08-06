const express = require('express');
const router = express.Router();

const listingController = require('../../controllers/listing_controller/listing_controller');
const authMiddleware = require('../../middlewares/auth_middleware/authMiddleware');


router.post('/create', authMiddleware, listingController.createListing);

router.get('/one-listing/:listingId', listingController.getListingById);

router.get('/one-seller-listing/:userId', listingController.getOneSellerListing);

router.get('/all', listingController.getAllListing);


router.get('/listing-using-status/:status', listingController.getListingByStatus);


router.get('/listing-filter', listingController.getListingByFilter);


router.get('/listing-delete/:listingId', listingController.deleteOneListing);

module.exports = router;