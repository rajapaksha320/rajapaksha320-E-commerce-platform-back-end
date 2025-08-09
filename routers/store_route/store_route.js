const express = require('express');
const router = express.Router();
const storeController = require('../../controllers/store_controller/store_controller');
const authMiddleware = require('../../middlewares/auth_middleware/authMiddleware');
const multer = require('multer');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });


// create seller store
/**
 * @swagger
 * tags:
 *   name: Store
 *   description: Store management endpoints
 */

/**
 * @swagger
 * /api/v1/store/create:
 *   post:
 *     summary: Create a new store
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeName
 *               - sellerId
 *               - categoryId
 *             properties:
 *               storeName:
 *                 type: string
 *               storeDescription:
 *                 type: string
 *               storeLocation:
 *                 type: string
 *               storeLogo:
 *                 type: string
 *               bannerImage:
 *                 type: string
 *               totalSales:
 *                 type: number
 *                 default: 0
 *               sellerId:
 *                 type: string
 *                 description: MongoDB ObjectId of the seller
 *               categoryId:
 *                 type: string
 *                 description: MongoDB ObjectId of the store category
 *               storePolicies:
 *                 type: string
 *               totalProducts:
 *                 type: number
 *                 default: 0
 *               socialMediaLinks:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, pending]
 *                 default: active
 *               rating:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 5
 *                 default: 0
 *     responses:
 *       201:
 *         description: Store created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Store'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/create',authMiddleware, storeController.createStoreController);

// filter shops using shop category 
// router.get('/filter-shops/:categoryId',storeController.filterShopsUsingCtaegory)


router.post('/store-images',upload.single('image') ,storeController.createStoreImages);

router.post('/create-store-profile', authMiddleware, storeController.createStoreProfile);

router.post('/update-store-profile/:storeId', authMiddleware, storeController.updateStoreProfile);

router.get('/get-all-store', storeController.getAllCreatedStore);

router.get('/filter-category', storeController.filterShopsUsingCategory);

router.get('/get-each-shop-listing', storeController.getEachShopsListing);

module.exports = router;