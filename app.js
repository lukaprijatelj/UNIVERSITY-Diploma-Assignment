// npm packages
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var url = require('url');
var fs = require('fs');

// local packages
var API = require('./server/api.js');
var DATABASE = require('./server/database.js');

require('./public/javascripts/extensions/function.js');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/upload');
var clientRendererRouter = require('./routes/client-renderer');
var clientAdminRouter = require('./routes/client-admin');

var app = express();


var EXPRESS_APP =
{
	catch404: function(req, res, next) 
	{
		next(createError(404));
	},

	errorHandler: function(err, req, res, next) 
	{
		// set locals, only providing error in development
		res.locals.message = err.message;
		res.locals.error = req.app.get('env') === 'development' ? err : {};
	
		// render the error page
		res.status(err.status || 500);
		res.render('error');
	},

	init: function()
	{
		// view engine setup
		app.set('views', path.join(__dirname, 'views'));
		app.set('view engine', 'ejs');

		app.use(logger('dev'));
		app.use(express.json());
		app.use(express.urlencoded({ extended: false }));
		app.use(cookieParser());
		app.use(express.static(path.join(__dirname, 'public')));
		app.use(express.static(path.join(__dirname, 'database/files')));

		// routes
		app.use('/', indexRouter);
		app.use('/upload', usersRouter);
		app.use('/clientRenderer', clientRendererRouter);
		app.use('/clientAdmin', clientAdminRouter);

		console.log('[App] Initializing');

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
