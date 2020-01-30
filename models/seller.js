const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const sellerSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  resetToken: String,
  resetTokenExpiration: Date,
});

module.exports = mongoose.model('Seller', sellerSchema);
