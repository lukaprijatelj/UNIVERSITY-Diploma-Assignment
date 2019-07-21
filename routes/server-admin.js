var express = require('express');
var router = express.Router();
var constants = require('../server/constants.js');

/* GET home page. */
router.get('/', function(req, res, next) 
{
	res.render('server-admin', 
	{ 
		title: 'Server admin',
		constants: constants
	});
});

module.exports = router;