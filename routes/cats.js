const express = require('express');
const router = express.Router();
const middleware = require('../middleware');
const multer = require('multer');
const Cat = require('../models/cat');
const storage = multer.diskStorage({
	filename: function(req, file, callback) {
		callback(null, Date.now() + file.originalname);
	},
});
const imageFilter = function(req, file, cb) {
	// accept image files only
	if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
		return cb(new Error('Only image files are allowed!'), false);
	}
	cb(null, true);
};
const upload = multer({ storage: storage, fileFilter: imageFilter });

const cloudinary = require('cloudinary');
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

// INDEX - show all cats
router.get('/', function(req, res) {
	var perPage = 32;
	var pageQuery = parseInt(req.query.page);
	var pageNumber = pageQuery ? pageQuery : 1;
	var noMatch = null;
	if (req.query.search) {
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Cat.find({ name: regex })
			.skip(perPage * pageNumber - perPage)
			.limit(perPage)
			.exec(function(err, allCats) {
				if (err) {
					req.flash('error', err.message);
				}
				Cat.count({ name: regex }).exec(function(err, count) {
					if (err) {
						console.log(err);
						res.redirect('back');
					} else {
						if (allCats.length < 1) {
							noMatch = 'No cats match your search, please try again.';
						}
						res.render('cats/index', {
							cats: allCats,
							current: pageNumber,
							pages: Math.ceil(count / perPage),
							noMatch: noMatch,
							search: req.query.search,
						});
					}
				});
			});
	} else {
		// get all cats from DB
		Cat.find({})
			.skip(perPage * pageNumber - perPage)
			.limit(perPage)
			.exec(function(err, allCats) {
				if (err) {
					req.flash('error', err.message);
				}
				Cat.count().exec(function(err, count) {
					if (err) {
						console.log(err);
					} else {
						res.render('cats/index', {
							cats: allCats,
							current: pageNumber,
							pages: Math.ceil(count / perPage),
							noMatch: noMatch,
							search: false,
						});
					}
				});
			});
	}
});

// CREATE - add new cat to DB
router.post('/', middleware.isLoggedIn, upload.single('image'), function(
	req,
	res
) {
	cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
		if (err) {
			req.flash('error', err.message);
			return res.redirect('back');
		}
		// add cloudinary url for the image to the cat object under image property
		req.body.cat.image = result.secure_url;
		// add image's public_id to cat object
		req.body.cat.imageId = result.public_id;
		// add author to cat
		req.body.cat.author = {
			id: req.user._id,
			username: req.user.username,
		};
		Cat.create(req.body.cat, function(err, cat) {
			if (err) {
				req.flash('error', err.message);
				return res.redirect('back');
			}
			res.redirect('/cats/' + cat.id);
		});
	});
});

// *********************Code for adding multiple images************************** //
// router.post(
// 	'/',
// 	middleware.isLoggedIn,
// 	upload.array('image', 3),
// 	async function (req, res) {
// 		// add author to campground
// 		req.body.cat.author = {
// 			id: req.user._id,
// 			username: req.user.username
// 		};

// 		req.body.cat.image = [];
// 		for (const file of req.files) {
// 			let result = await cloudinary.v2.uploader.upload(file.path);
// 			req.body.cat.image.push(result.secure_url);
// 		}

// 		Cat.create(req.body.cat, function (err, cat) {
// 			if (err) {
// 				return res.redirect('back');
// 			}
// 			res.redirect('/cats/' + cat.id);
// 		});
// 	}
// );
// ************************************************************************* //

// NEW - show form to create new cat
//router.get('/new', middleware.isLoggedIn, function (req, res) {
router.get('/new', middleware.checkUserIsAdmin, function(req, res) {
	res.render('cats/new');
});

// SHOW - shows more info about one cat
router.get('/:id', function(req, res) {
	// find the cat with provided ID
	Cat.findById(req.params.id)
		.populate('comments')
		.exec(function(err, foundCat) {
			if (err || !foundCat) {
				req.flash('error', 'Cat not found!');
				res.redirect('back');
			} else {
				// console.log(foundCat)
				// render show template with that cat
				res.render('cats/show', { cat: foundCat });
			}
		});
});

// EDIT DOG ROUTE
router.get('/:id/edit', middleware.checkCatOwnership, function(req, res) {
	Cat.findById(req.params.id, function(err, foundCat) {
		if (err) {
			console.log(err);
		} else {
			// render show template with that cat
			res.render('cats/edit', { cat: foundCat });
		}
	});
});

// UPDATE DOG ROUTE
router.put(
	'/:id',
	middleware.checkCatOwnership,
	upload.single('image'),
	function(req, res) {
		Cat.findById(req.params.id, async function(err, cat) {
			if (err) {
				req.flash('error', err.message);
				res.redirect('back');
			} else {
				if (req.file) {
					try {
						await cloudinary.v2.uploader.destroy(cat.imageId);
						var result = await cloudinary.v2.uploader.upload(req.file.path);
						cat.imageId = result.public_id;
						cat.image = result.secure_url;
					} catch (err) {
						req.flash('error', err.message);
						return res.redirect('back');
					}
				}
				cat.name = req.body.cat.name;
				cat.description = req.body.cat.description;
				cat.age = req.body.cat.age;
				cat.fbLink = req.body.cat.fbLink;
				cat.dimensions = req.body.cat.dimensions;
				cat.save();
				req.flash('success', 'Successfully Updated!');
				res.redirect('/cats/' + cat._id);
			}
		});
	}
);

// DESTROY DOG ROUTE
router.delete('/:id', middleware.checkCatOwnership, function(req, res) {
	Cat.findById(req.params.id, async function(err, cat) {
		if (err) {
			req.flash('error', err.message);
			return res.redirect('back');
		}
		try {
			await cloudinary.v2.uploader.destroy(cat.imageId);
			cat.remove();
			req.flash('success', 'Cat deleted successfully!');
			res.redirect('/cats');
		} catch (err) {
			if (err) {
				req.flash('error', err.message);
				return res.redirect('back');
			}
		}
	});
});

function escapeRegex(text) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

module.exports = router;
