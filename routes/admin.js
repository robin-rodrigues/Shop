const path = require('path');

const express = require('express');
const { body } = require('express-validator/check');

const adminController = require('../controllers/admin');
const isSellerAuth = require('../middleware/is-seller-auth');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isSellerAuth, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isSellerAuth, adminController.getProducts);

// /admin/add-product => POST
router.post(
  '/add-product',
  [
    body('title')
      .isString()
      .isLength({ min: 3 })
      .trim(),
    body('price').isFloat(),
    body('description')
      .isLength({ min: 5, max: 400 })
      .trim()
  ],
  isSellerAuth,
  adminController.postAddProduct
);

router.get('/edit-product/:productId', isSellerAuth, adminController.getEditProduct);

router.post(
  '/edit-product',
  [
    body('title')
      .isString()
      .isLength({ min: 3 })
      .trim(),
    body('price').isFloat(),
    body('description')
      .isLength({ min: 5, max: 400 })
      .trim()
  ],
  isSellerAuth,
  adminController.postEditProduct
);

router.delete('/product/:productId', isSellerAuth, adminController.deleteProduct);

module.exports = router;
