module.exports = (req, res, next) => {
    if (!req.session.isSellerLoggedIn) {
        return res.redirect('/seller-login');
    }
    next();
}