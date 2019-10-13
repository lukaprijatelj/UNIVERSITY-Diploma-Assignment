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
global.API = require('./server/api.js');
global.DATABASE = require('./server/database.js');


// -----------------------------
// import namespace-core
// -----------------------------
require('./public/externals/namespace-core/namespace-core.js');


// -----------------------------
// import routes
// -----------------------------
var indexRouter = require('./routes/index');
var clientRendererRouter = require('./routes/client');
var clientAdminRouter = require('./routes/admin');
var renderingOutputRouter = require('./routes/rendering-output');


// -----------------------------
// check if scenes folder exists, if not than create it
// -----------------------------

var dir = './public/scenes';

if (!fs.existsSync(dir))
{
    fs.mkdirSync(dir);
}

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
		app.use('/client', clientRendererRouter);
		app.use('/admin', clientAdminRouter);
		app.use('/renderingOutput', renderingOutputRouter);
		
		

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
