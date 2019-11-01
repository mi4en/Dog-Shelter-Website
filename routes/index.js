const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const Dog = require('../models/dog');
const Cat = require('../models/cat');
const async = require('async');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// ROOT ROUTE
router.get('/', function(req, res) {
	res.render('landing');
});

// AUTH ROUTES

// SHOW REGISTER FORM
router.get('/register', function(req, res) {
	res.render('register', { page: 'register' });
});

// SIGN UP LOGIC
router.post('/register', function(req, res) {
	var newUser = new User({
		username: req.body.username,
		email: req.body.email,
		avatar: req.body.avatar,
	});
	if (req.body.username === process.env.ADMIN_USER) {
		newUser.isAdmin = true;
	}
	User.register(newUser, req.body.password, function(err, user) {
		if (err) {
			req.flash('error', err.message);
			return res.redirect('/register');
		}
		passport.authenticate('local')(req, res, function() {
			req.flash('success', 'Welcome, ' + user.username + '!');
			res.redirect('/dogs');
		});
	});
});

// SHOW LOGIN FORM
router.get('/login', function(req, res) {
	res.render('login', { page: 'login' });
});

// LOGIN LOGIC

// router.post(
//   "/login",
//   passport.authenticate("local", {
//     successRedirect: "/dogs",
//     failureRedirect: "/login"
//   }),
//   function(req, res) {}
// );
router.post('/login', function(req, res, next) {
	passport.authenticate('local', function(err, user, info) {
		if (err) {
			return next(err);
		}
		if (!user) {
			return res.redirect('/login');
		}
		req.logIn(user, function(err) {
			if (err) {
				return next(err);
			}
			var redirectTo = req.session.redirectTo
				? req.session.redirectTo
				: '/dogs';
			delete req.session.redirectTo;
			res.redirect(redirectTo);
		});
	})(req, res, next);
});

// LOGOUT LOGIC
router.get('/logout', function(req, res) {
	let loggedUser = req.body._id;
	req.logout();
	req.flash('success', 'See you soon!');
	res.redirect('/dogs');
});

// FORGOT PASSWORD
router.get('/forgot', function(req, res) {
	res.render('forgot');
});

router.post('/forgot', function(req, res, next) {
	async.waterfall(
		[
			function(done) {
				crypto.randomBytes(20, function(err, buf) {
					var token = buf.toString('hex');
					done(err, token);
				});
			},
			function(token, done) {
				User.findOne({ email: req.body.email }, function(err, user) {
					if (err) {
						req.flash('error', 'Something went wrong please try again.');
						return res.redirect('/forgot');
					}
					if (!user) {
						req.flash('error', 'No account with that email address exists.');
						return res.redirect('/forgot');
					}

					user.resetPasswordToken = token;
					user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

					user.save(function(err) {
						done(err, token, user);
					});
				});
			},
			function(token, user, done) {
				var smtpTransport = nodemailer.createTransport({
					service: 'Gmail',
					auth: {
						user: 'noreply.nomnomnom@gmail.com',
						pass: process.env.GMAILPW,
					},
				});
				var mailOptions = {
					to: user.email,
					from: 'noreply.nomnomnom@gmail.com',
					subject: 'Nomnomnom.com Password Reset',
					text:
						'You are receiving this because you (or someone else) have requested to reset the password for your account.\n\n' +
						'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
						'http://' +
						req.headers.host +
						'/reset/' +
						token +
						'\n\n' +
						'This link will be valid for 1 hour only' +
						'\n\n' +
						'If you did not request this, please ignore this email and your password will remain unchanged.\n',
				};
				smtpTransport.sendMail(mailOptions, function(err) {
					console.log('mail sent');
					req.flash(
						'success',
						'An e-mail has been sent to ' +
							user.email +
							' with further instructions.',
					);
					done(err, 'done');
				});
			},
		],
		function(err) {
			if (err) return next(err);
			res.redirect('/forgot');
		},
	);
});

router.get('/reset/:token', function(req, res) {
	User.findOne(
		{
			resetPasswordToken: req.params.token,
			resetPasswordExpires: { $gt: Date.now() },
		},
		function(err, user) {
			if (err) {
				req.flash('error', 'Something went wrong please try again.');
				return res.redirect('/forgot');
			}
			if (!user) {
				req.flash('error', 'Password reset token is invalid or has expired1.');
				return res.redirect('/forgot');
			}
			res.render('reset', { token: req.params.token });
		},
	);
});

router.post('/reset/:token', function(req, res) {
	async.waterfall(
		[
			function(done) {
				User.findOne(
					{
						resetPasswordToken: req.params.token,
						resetPasswordExpires: { $gt: Date.now() },
					},
					function(err, user) {
						if (err) {
							req.flash('error', 'Something went wrong please try again.');
							return res.redirect('/forgot');
						}
						if (!user) {
							req.flash(
								'error',
								'Password reset token is invalid or has expired.',
							);
							return res.redirect('back');
						}
						if (req.body.password === req.body.confirm) {
							user.setPassword(req.body.password, function(err) {
								if (err) {
									req.flash('error', 'Something went wrong please try again.');
									return res.redirect('/reset');
								}
								user.resetPasswordToken = undefined;
								user.resetPasswordExpires = undefined;

								user.save(function(err) {
									if (err) {
										req.flash(
											'error',
											'Something went wrong please try again.',
										);
										return res.redirect('/reset');
									}
									req.logIn(user, function(err) {
										done(err, user);
									});
								});
							});
						} else {
							req.flash('error', 'Passwords do not match.');
							return res.redirect('back');
						}
					},
				);
			},
			function(user, done) {
				var smtpTransport = nodemailer.createTransport({
					service: 'Gmail',
					auth: {
						user: 'noreply.nomnomnom@gmail.com',
						pass: process.env.GMAILPW,
					},
				});
				var mailOptions = {
					to: user.email,
					from: 'noreply.nomnomnom@gmail.com',
					subject: 'Your password has been changed',
					text:
						'Hello,\n\n' +
						'This is a confirmation that the password for your account ' +
						user.email +
						' has just been changed.\n',
				};
				smtpTransport.sendMail(mailOptions, function(err) {
					req.flash('success', 'Success! Your password has been changed.');
					done(err);
				});
			},
		],
		function(err) {
			if (err) {
				req.flash('error', 'Something went wrong please try again.');
				return res.redirect('/reset');
			}
			res.redirect('/dogs');
		},
	);
});

// USER PROFILES
router.get('/users/:id', function(req, res) {
	User.findById(req.params.id, function(err, foundUser) {
		if (err) {
			req.flash('error', err.message);
			return res.redirect('/');
		}
		Dog.find()
			.where('author.id')
			.equals(foundUser._id)
			.exec(function(err, dogs) {
				if (err) {
					req.flash('error', err.message);
					return res.redirect('/');
				}
				res.render('users/show', { user: foundUser, dogs: dogs });
			});
	});
});

// DONATE ROUTE
router.get('/donate', function(req, res) {
	res.render('donate', { page: 'donate' });
});

// ADOPTED ROUTE
// router.get('/adopted', function(req, res) {
// 	res.render('adopted', { page: 'adopted' });
// });

// ABOUT ROUTE
router.get('/about', function(req, res) {
	res.render('about', { page: 'about' });
});

module.exports = router;
