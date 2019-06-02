const Dog = require('../models/dog');
const Cat = require('../models/cat');
const Comment = require('../models/comment');

// all the middleare goes here
var middlewareObj = {};

middlewareObj.checkUserIsAdmin = function(req, res, next) {
	if (req.isAuthenticated()) {
		if (req.user.isAdmin) {
			next();
		} else {
			req.flash('error', 'Access Denied');
			//res.redirect('/dogs');
			res.redirect('back');
		}
	} else {
		req.flash('error', 'Access Denied');
		res.redirect('back');
	}
};

middlewareObj.checkDogOwnership = function(req, res, next) {
	if (req.isAuthenticated()) {
		Dog.findById(req.params.id, function(err, foundDog) {
			if (err || !foundDog) {
				req.flash('error', 'Name not found!');
				res.redirect('back');
			} else {
				// does user own the dog?
				//if (foundDog.author.id.equals(req.user._id) || req.user.isAdmin) {
				if (req.user.isAdmin) {
					next();
				} else {
					req.flash('error', 'Access denied!');
					res.redirect('back');
				}
			}
		});
	} else {
		req.flash('error', 'You need to be logged in!');
		res.redirect('back');
	}
};

middlewareObj.checkCatOwnership = function(req, res, next) {
	if (req.isAuthenticated()) {
		Cat.findById(req.params.id, function(err, foundCat) {
			if (err || !foundCat) {
				req.flash('error', 'Name not found!');
				res.redirect('back');
			} else {
				// does user own the cat?
				//if (foundDog.author.id.equals(req.user._id) || req.user.isAdmin) {
				if (req.user.isAdmin) {
					next();
				} else {
					req.flash('error', 'Access denied!');
					res.redirect('back');
				}
			}
		});
	} else {
		req.flash('error', 'You need to be logged in!');
		res.redirect('back');
	}
};

middlewareObj.checkCommentOwnership = function(req, res, next) {
	if (req.isAuthenticated()) {
		Comment.findById(req.params.comment_id, function(err, foundComment) {
			if (err || !foundComment) {
				req.flash('error', 'Comment not found!');
				res.redirect('back');
			} else {
				// does user own the comment?
				if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
					next();
				} else {
					req.flash('error', 'Access denied!');
					res.redirect('back');
				}
			}
		});
	} else {
		req.flash('error', 'You need to be logged in!');
		res.redirect('back');
	}
};

middlewareObj.isLoggedIn = function(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	req.session.redirectTo = req.originalUrl;
	req.flash('error', 'You need to be logged in!');
	res.redirect('/login');
};

module.exports = middlewareObj;
