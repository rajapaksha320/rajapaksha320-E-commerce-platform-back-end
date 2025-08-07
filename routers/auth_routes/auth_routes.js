const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth_controller/auth_controller');
const authMiddleware = require('../../middlewares/auth_middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /api/v1/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - tenantId
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               tenantId:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request
 */
router.post('/signup', authController.signup);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Log in as an existing user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - tenantId
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               tenantId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Unauthorized
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Send a password reset token via email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - tenantId
 *             properties:
 *               email:
 *                 type: string
 *               tenantId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email sent
 *       404:
 *         description: User not found
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset a user's password with a valid token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - tenantId
 *               - token
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *               tenantId:
 *                 type: string
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.post('/reset-password', authController.resetPassword);


// verify OTP
router.post('/verify-otp', authController.verifyOtpController);

// update businessInfo info
router.post('/update-business-info', authMiddleware, authController.updateBusinessInfoController);


// update contact info
router.post('/update-contact-info', authMiddleware, authController.updateContactInfoController);

// update wish list
router.post('/update-wish-list', authMiddleware, authController.updateWishListController);


// update user profile
router.post('/refresh-token', authController.refreshTokenController);

// update personal info
router.post('/seller-registration', authController.sellerRegistrationController);


router.post('/seller-store-profile-info', authMiddleware, authController.getSellerStoreProfile);

module.exports = router;

