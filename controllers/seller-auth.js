require('dotenv').config()

const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator');

const Seller = require('../models/seller');

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: "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"
      }
  })
);

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('seller-auth/login', {
    path: '/seller-login',
    pageTitle: 'Seller Login',
    errorMessage: message,
    oldInput: {
      email: '',
      password: ''
    },
    validationErrors: []
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('seller-auth/signup', {
    path: '/seller-signup',
    pageTitle: 'Seller Signup',
    errorMessage: message,
    oldInput: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationErrors: []
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('seller-auth/login', {
      path: '/seller-login',
      pageTitle: 'Seller Login',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password
      },
      validationErrors: errors.array()
    });
  }

  Seller.findOne({ email: email })
    .then(seller => {
      if (!seller) {
        return res.status(422).render('seller-auth/login', {
          path: '/seller-login',
          pageTitle: 'Seller Login',
          errorMessage: 'Invalid email or password.',
          oldInput: {
            email: email,
            password: password
          },
          validationErrors: []
        });
      }
      bcrypt
        .compare(password, seller.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = false;
            req.session.isSellerLoggedIn = true;
            req.session.seller = seller;
            return req.session.save(err => {
              console.log(err);
              res.redirect('/');
            });
          }
          return res.status(422).render('seller-auth/login', {
            path: '/seller-login',
            pageTitle: 'Seller Login',
            errorMessage: 'Invalid email or password.',
            oldInput: {
              email: email,
              password: password
            },
            validationErrors: []
          });
        })
        .catch(err => {
          console.log(err);
          res.redirect('/seller-login');
        });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render('seller-auth/signup', {
      path: '/seller-signup',
      pageTitle: 'Seller Signup',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: req.body.confirmPassword
      },
      validationErrors: errors.array()
    });
  }

  bcrypt
    .hash(password, 12)
    .then(hashedPassword => {
      const seller = new Seller({
        email: email,
        password: hashedPassword,
      });
      return seller.save();
    })
    .then(result => {
      res.redirect('/seller-login');
      return transporter.sendMail({
        to: email,
        from: 'shop@node-complete.com',
        subject: 'Signup succeeded!',
        html: '<h1>You successfully signed up!</h1>'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('seller-auth/reset', {
    path: '/seller-reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/seller-reset');
    }
    const token = buffer.toString('hex');
    Seller.findOne({ email: req.body.email })
      .then(seller => {
        if (!seller) {
          req.flash('error', 'No account with that email found.');
          return res.redirect('/seller-reset');
        }
        seller.resetToken = token;
        seller.resetTokenExpiration = Date.now() + 3600000;
        return seller.save();
      })
      .then(result => {
        res.redirect('/');
        transporter.sendMail({
          to: req.body.email,
          from: 'memerodmeme@gmail.com',
          subject: 'Password reset',
          html: `
            <p>You requested a password reset</p>
            <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
          `
        });
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  Seller.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then(seller => {
      let message = req.flash('error');
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render('seller-auth/new-password', {
        path: '/seller-new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        sellerId: seller._id.toString(),
        passwordToken: token
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const sellerId = req.body.sellerId;
  const passwordToken = req.body.passwordToken;
  let resetSeller;

  Seller.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: sellerId
  })
    .then(seller => {
      resetSeller = seller;
      return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
      resetSeller.password = hashedPassword;
      resetSeller.resetToken = undefined;
      resetSeller.resetTokenExpiration = undefined;
      return resetSeller.save();
    })
    .then(result => {
      res.redirect('/seller-login');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProfile = (req, res, next) => {
  Seller.findById(req.seller._id).
    then(seller=>{
      res.render('seller-auth/profile', {
        seller: seller,
        pageTitle: 'Seller Profile',
        path: '/seller-profile'
      });
    })
}


