const mongoose = require('mongoose');

// Define schema
const dogSchema = new mongoose.Schema({
	name: String,
	breed: String,
	image: String,
	imageId: String,
	description: String,
	createdAt: { type: Date, default: Date.now },
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		},
		username: String
	},
	comments: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Comment'
		}
	]
});

// Define and export model to be used from app.js
module.exports = mongoose.model('Dog', dogSchema);
