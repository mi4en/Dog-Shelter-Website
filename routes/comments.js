const express = require('express');
const router = express.Router({ mergeParams: true });
const Dog = require('../models/dog');
const Comment = require('../models/comment');
const middleware = require('../middleware');

// Comments New
router.get('/new', middleware.isLoggedIn, function(req, res) {
	// find dog by id
	console.log(req.params.id);
	Dog.findById(req.params.id, function(err, dog) {
		if (err) {
			console.log(err);
		} else {
			res.render('comments/new', { dog: dog });
		}
	});
});

// COMMENT CREATE ROUTE
router.post('/', middleware.isLoggedIn, function(req, res) {
	// lookup dog using ID
	Dog.findById(req.params.id, function(err, dog) {
		if (err) {
			req.flash('error', 'Someting went wrong');
			console.log(err);
			res.redirect('/dogs');
		} else {
			Comment.create(req.body.comment, function(err, comment) {
				if (err) {
					req.flash('error', 'Someting went wrong');
					console.log(err);
				} else {
					// add username and id to comment
					comment.author.id = req.user._id;
					comment.author.username = req.user.username;
					// save comment
					comment.save();
					dog.comments.push(comment);
					dog.save();
					// console.log(comment)
					req.flash('success', 'Successfully added comment!');
					res.redirect('/dogs/' + dog._id);
				}
			});
		}
	});
});

// COMMENT EDIT ROUTE
router.get('/:comment_id/edit', middleware.checkCommentOwnership, function(
	req,
	res,
) {
	Dog.findById(req.params.id, function(err, foundDog) {
		if (err || !foundDog) {
			req.flash('error', 'Dog not found!');
			return res.redirect('back');
		}
		Comment.findById(req.params.comment_id, function(err, foundComment) {
			if (err) {
				res.redirect('back');
			} else {
				res.render('comments/edit', {
					dog_id: req.params.id,
					comment: foundComment,
				});
			}
		});
	});
});

// COMMENT UPDATE
router.put('/:comment_id', middleware.checkCommentOwnership, function(
	req,
	res,
) {
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(
		err,
		updatedComment,
	) {
		if (err) {
			req.flash('error', 'Someting went wrong');
			res.redirect('back');
		} else {
			req.flash('success', 'Comment edited successfully!');
			res.redirect('/dogs/' + req.params.id);
		}
	});
});

// COMMENT DESTROY ROUTE
router.delete('/:comment_id', middleware.checkCommentOwnership, function(
	req,
	res,
) {
	// findByIdAndRemove
	Comment.findByIdAndRemove(req.params.comment_id, function(err) {
		if (err) {
			res.redirect('back');
		} else {
			req.flash('success', 'Comment deleted!');
			res.redirect('/dogs/' + req.params.id);
		}
	});
});

module.exports = router;
