const mongoose = require('mongoose');
const Dog = require('./models/dog');
const Comment = require('./models/comment');

var data = [
	{
		name: 'Alpha',
		image: '',
		description:
			'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum',
	},
	{
		name: 'Beta',
		image: '',
		description:
			'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum',
	},
	{
		name: 'Gama',
		image: '',
		description:
			'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum',
	},
];

function seedDb() {
	// Remove all dogs
	Dog.remove({}, function(err) {
		if (err) {
			console.log(err);
		}
		console.log('removed dogs!');
		Comment.remove({}, function(err) {
			if (err) {
				console.log(err);
			}
			console.log('removed comments!');
			// add a few dogs
			data.forEach(function(seed) {
				Dog.create(seed, function(err, dog) {
					if (err) {
						console.log(err);
					} else {
						console.log('added a dog');
						// create a comment
						Comment.create(
							{
								text: 'Test test.',
								author: 'Homer',
							},
							function(err, comment) {
								if (err) {
									console.log(err);
								} else {
									dog.comments.push(comment);
									dog.save();
									console.log('Created new comment');
								}
							}
						);
					}
				});
			});
		});
	});
}
