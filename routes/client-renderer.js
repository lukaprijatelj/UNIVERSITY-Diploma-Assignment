var express = require('express');
var router = express.Router();
var constants = require('../server/constants.js');

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('client-renderer', 
	{ 
		title: 'Express',
		constants: constants
	});
});

module.exports = router;