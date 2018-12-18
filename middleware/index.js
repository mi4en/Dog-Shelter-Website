var Dog = require('../models/dog');
var Comment = require('../models/comment');

// all the middleare goes here
var middlewareObj = {};

middlewareObj.checkRecipeOwnership = function(req, res, next) {
	if (req.isAuthenticated()) {
		Dog.findById(req.params.id, function(err, foundDog) {
			if (err || !foundDog) {
				req.flash('error', 'Dog not found!');
				res.redirect('back');
			} else {
				// does user own the dog?
				if (foundDog.author.id.equals(req.user._id) || req.user.isAdmin) {
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
