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

require('./server/helper.js');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/upload');
var clientRouter = require('./routes/client');

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

		// routes
		app.use('/', indexRouter);
		app.use('/upload', usersRouter);
		app.use('/client', clientRouter);

		API.init(app);

		// catch 404 and forward to error handler
		app.use(EXPRESS_APP.catch404);

		// error handler
		app.use(EXPRESS_APP.errorHandler);

		
		var NUM_OF_CELLS_HORIZONTALLY = 5;
		var NUM_OF_CELLS_VERTICALLY = 5;

		var CELL_WIDTH = 384;
		var CELL_HEIGHT = 216;
		
		var startY = 0;
		while(startY < CELL_HEIGHT * NUM_OF_CELLS_VERTICALLY)
		{
			var startX = 0;

			while(startX < CELL_WIDTH * NUM_OF_CELLS_HORIZONTALLY)
			{
				DATABASE.addGridLayout(startX, startY, CELL_WIDTH, CELL_HEIGHT);
				startX += CELL_WIDTH;
			}

			startY += CELL_HEIGHT;
		}
		
	}
};

DATABASE.init();
EXPRESS_APP.init();

module.exports = app;
