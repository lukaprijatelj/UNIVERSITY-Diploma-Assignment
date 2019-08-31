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
// import namespace-core
// -----------------------------
require('./public/externals/namespace-core/interfaces/IDisposable.js');
require('./public/externals/namespace-core/interfaces/IStringify.js');

require('./public/externals/namespace-core/Class.js');
require('./public/externals/namespace-core/Interface.js');
require('./public/externals/namespace-core/List.js');
require('./public/externals/namespace-core/StaticArray.js');
require('./public/externals/namespace-core/Array.js');
require('./public/externals/namespace-core/Char.js');
require('./public/externals/namespace-core/console.js');
require('./public/externals/namespace-core/Date.js');
require('./public/externals/namespace-core/Enum.js');
require('./public/externals/namespace-core/Event.js');
require('./public/externals/namespace-core/Exception.js');
require('./public/externals/namespace-core/Function.js');
require('./public/externals/namespace-core/Math.js');
require('./public/externals/namespace-core/Object.js');
require('./public/externals/namespace-core/Path.js');
require('./public/externals/namespace-core/String.js');
require('./public/externals/namespace-core/Timer.js');
require('./public/externals/namespace-core/Unit.js');
require('./public/externals/namespace-core/Warning.js');


// -----------------------------
// import routes
// -----------------------------
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/upload');
var clientRendererRouter = require('./routes/client');
var clientAdminRouter = require('./routes/admin');
var renderingOutputRouter = require('./routes/rendering-output');



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
