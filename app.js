// -----------------------------
// import constants
// -----------------------------
if (console)
{
	console.type = 'server';
}
var constants = require('./server/constants.js');


// -----------------------------
// import npm packages
// -----------------------------
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var url = require('url');
var fs = require('fs');


// -----------------------------
// import local packages
// -----------------------------
var API = require('./server/api.js');
var DATABASE = require('./server/database.js');


// -----------------------------
// import javascript extensions
// -----------------------------
require('./public/javascripts/extensions/function.js');
require('./public/javascripts/extensions/array.js');
require('./public/javascripts/extensions/date.js');
require('./public/javascripts/extensions/math.js');
require('./public/javascripts/extensions/object.js');
require('./public/javascripts/extensions/console.js');


// -----------------------------
// import routes
// -----------------------------
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/upload');
var clientRendererRouter = require('./routes/client');
var clientAdminRouter = require('./routes/server-admin');
var finalPreviewRouter = require('./routes/final-preview');



var app = express();
var EXPRESS_APP =
{
	/**
	 * Catch any errors and return page not found.
	 */
	catch404: function(req, res, next) 
	{
		next(createError(404));
	},

	/**
	 * Respond that error has occured.
	 */
	errorHandler: function(err, req, res, next) 
	{
		// set locals, only providing error in development
		res.locals.message = err.message;
		res.locals.error = req.app.get('env') === 'development' ? err : {};
	
		// render the error page
		res.status(err.status || 500);
		res.render('error');
	},


	/**
	 * Start initializing.
	 */
	init: function()
	{
		console.log('[App] Initializing');

		// view engine setup
		app.set('views', path.join(__dirname, 'views'));
		app.set('view engine', 'ejs');

		app.use(logger('dev'));
		app.use(express.json());
		app.use(express.urlencoded({ extended: false }));
		app.use(cookieParser());
		app.use(express.static(path.join(__dirname, 'public')));

		
		
		// -----------------------------
		// Build url routes scheme
		// -----------------------------
		app.use('/', indexRouter);
		app.use('/upload', usersRouter);
		app.use('/client', clientRendererRouter);
		app.use('/serverAdmin', clientAdminRouter);
		app.use('/finalPreview', finalPreviewRouter);
		
		

		API.init(app);

		// catch 404 and forward to error handler
		app.use(EXPRESS_APP.catch404);

		// error handler
		app.use(EXPRESS_APP.errorHandler);		
	}
};

DATABASE.init();
EXPRESS_APP.init();

module.exports = app;
