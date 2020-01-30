const express = require('express');
const { check, body } = require('express-validator');

const sellerController = require('../controllers/seller-auth');
const Seller = require('../models/seller');
const isSellerAuth = require('../middleware/is-seller-auth');

const router = express.Router();

router.get('/seller-login', sellerController.getLogin);

router.get('/seller-signup', sellerController.getSignup);

router.post(
  '/seller-login',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address.')
      .normalizeEmail(),
    body('password', 'Password has to be valid.')
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim()
  ],
  sellerController.postLogin
);

router.post(
  '/seller-signup',
  [
    check('email')
      .isEmail()
      .withMessage('Please enter a valid email.')
      .custom((value, { req }) => {
        // if (value === 'test@test.com') {
        //   throw new Error('This email address if forbidden.');
        // }
        // return true;
        return Seller.findOne({ email: value }).then(sellerDoc => {
          if (sellerDoc) {
            return Promise.reject(
              'E-Mail exists already, please pick a different one.'
            );
          }
        });
      })
      .normalizeEmail(),
    body(
      'password',
      'Please enter a password with only numbers and text and at least 5 characters.'
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
    body('confirmPassword')
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords have to match!');
        }
        return true;
      })
  ],
  sellerController.postSignup
);

router.post('/seller-logout', sellerController.postLogout);

router.get('/seller-reset', sellerController.getReset);

router.post('/seller-reset', sellerController.postReset);

router.get('/seller-reset/:token', sellerController.getNewPassword);

router.post('/seller-new-password', sellerController.postNewPassword);

router.get('/seller-profile', isSellerAuth, sellerController.getProfile);

module.exports = router;
