const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();
const flash = require('connect-flash');
const moment = require('moment');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const methodOverride = require('method-override');
const Dog = require('./models/dog');
const Cat = require('./models/cat');
const Comment = require('./models/comment');
const User = require('./models/user');
const seedDB = require('./seeds');

// requiring routes
var commentRoutes = require('./routes/comments');
var dogRoutes = require('./routes/dogs');
var catRoutes = require('./routes/cats');
var indexRoutes = require('./routes/index');

// exprot DATABASEURL=mongodb://conn.string...
var url = process.env.DATABASEURL || 'mongodb://localhost:27017/dog_shelter';
mongoose.connect(url, { useNewUrlParser: true });
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(methodOverride('_method'));
app.use(flash());
// seedDB(); //seed the database

// MOMENT app var declaration
app.locals.moment = require('moment');

// PASSPORT CONFIGURATION
app.use(
	require('express-session')({
		secret: 'DemonHunterIsTheBestClass',
		resave: false,
		saveUninitialized: false,
	})
);
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
	res.locals.currentUser = req.user;
	res.locals.error = req.flash('error');
	res.locals.success = req.flash('success');
	next();
});

app.use('/', indexRoutes);
app.use('/dogs', dogRoutes);
app.use('/cats', catRoutes);
app.use('/dogs/:id/comments', commentRoutes);
app.use('/cats/:id/comments', commentRoutes);

app.use(function(req, res, next) {
	res.status(404).render('404_error_template', { title: 'NotFound' });
});

app.listen(process.env.PORT || 3000, process.env.IP, function() {
	console.log('server started...');
});
