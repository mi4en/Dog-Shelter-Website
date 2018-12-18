var express = require('express');
var router = express.Router();
var Dog = require('../models/dog');
var middleware = require('../middleware');
var multer = require('multer');
var storage = multer.diskStorage({
	filename: function(req, file, callback) {
		callback(null, Date.now() + file.originalname);
	}
});
var imageFilter = function(req, file, cb) {
	// accept image files only
	if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
		return cb(new Error('Only image files are allowed!'), false);
	}
	cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter });

var cloudinary = require('cloudinary');
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET
});

// INDEX - show all dogs
router.get('/', function(req, res) {
	var perPage = 8;
	var pageQuery = parseInt(req.query.page);
	var pageNumber = pageQuery ? pageQuery : 1;
	var noMatch = null;
	if (req.query.search) {
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Dog.find({ name: regex })
			.skip(perPage * pageNumber - perPage)
			.limit(perPage)
			.exec(function(err, allDogs) {
				if (err) {
					req.flash('error', err.message);
				}
				Dog.count({ name: regex }).exec(function(err, count) {
					if (err) {
						console.log(err);
						res.redirect('back');
					} else {
						if (allDogs.length < 1) {
							noMatch = 'No dogs match your search, please try again.';
						}
						res.render('dogs/index', {
							dogs: allDogs,
							current: pageNumber,
							pages: Math.ceil(count / perPage),
							noMatch: noMatch,
							search: req.query.search
						});
					}
				});
			});
	} else {
		// get all dogs from DB
		Dog.find({})
			.skip(perPage * pageNumber - perPage)
			.limit(perPage)
			.exec(function(err, allDogs) {
				if (err) {
					req.flash('error', err.message);
				}
				Dog.count().exec(function(err, count) {
					if (err) {
						console.log(err);
					} else {
						res.render('dogs/index', {
							dogs: allDogs,
							current: pageNumber,
							pages: Math.ceil(count / perPage),
							noMatch: noMatch,
							search: false
						});
					}
				});
			});
	}
});

// CREATE - add new dog to DB
router.post('/', middleware.isLoggedIn, upload.single('image'), function(
	req,
	res
) {
	cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
		if (err) {
			req.flash('error', err.message);
			return res.redirect('back');
		}
		// add cloudinary url for the image to the dog object under image property
		req.body.dog.image = result.secure_url;
		// add image's public_id to dog object
		req.body.dog.imageId = result.public_id;
		// add author to dog
		req.body.dog.author = {
			id: req.user._id,
			username: req.user.username
		};
		Dog.create(req.body.dog, function(err, dog) {
			if (err) {
				req.flash('error', err.message);
				return res.redirect('back');
			}
			res.redirect('/dogs/' + dog.id);
		});
	});
});

// NEW - show form to create new dog
router.get('/new', middleware.isLoggedIn, function(req, res) {
	res.render('dogs/new');
});

// SHOW - shows more info about one dog
router.get('/:id', function(req, res) {
	// find the dog with provided ID
	Dog.findById(req.params.id)
		.populate('comments')
		.exec(function(err, foundDog) {
			if (err || !foundDog) {
				req.flash('error', 'Dog not found!');
				res.redirect('back');
			} else {
				// console.log(foundDog)
				// render show template with that dog
				res.render('dogs/show', { dog: foundDog });
			}
		});
});

// EDIT RECIPE ROUTE
router.get('/:id/edit', middleware.checkDogOwnership, function(req, res) {
	Dog.findById(req.params.id, function(err, foundDog) {
		if (err) {
			console.log(err);
		} else {
			// render show template with that dog
			res.render('dogs/edit', { dog: foundDog });
		}
	});
});

// UPDATE RECIPE ROUTE
router.put(
	'/:id',
	middleware.checkDogOwnership,
	upload.single('image'),
	function(req, res) {
		Dog.findById(req.params.id, async function(err, dog) {
			if (err) {
				req.flash('error', err.message);
				res.redirect('back');
			} else {
				if (req.file) {
					try {
						await cloudinary.v2.uploader.destroy(dog.imageId);
						var result = await cloudinary.v2.uploader.upload(req.file.path);
						dog.imageId = result.public_id;
						dog.image = result.secure_url;
					} catch (err) {
						req.flash('error', err.message);
						return res.redirect('back');
					}
				}
				dog.name = req.body.dog.name;
				dog.description = req.body.dog.description;
				dog.price = req.body.dog.price;
				dog.save();
				req.flash('success', 'Successfully Updated!');
				res.redirect('/dogs/' + dog._id);
			}
		});
	}
);

// DESTROY RECIPE ROUTE
router.delete('/:id', middleware.checkDogOwnership, function(req, res) {
	Dog.findById(req.params.id, async function(err, dog) {
		if (err) {
			req.flash('error', err.message);
			return res.redirect('back');
		}
		try {
			await cloudinary.v2.uploader.destroy(dog.imageId);
			dog.remove();
			req.flash('success', 'Dog deleted successfully!');
			res.redirect('/dogs');
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
