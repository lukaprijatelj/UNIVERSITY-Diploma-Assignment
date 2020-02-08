var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) 
{
	// res.render('index', { title: 'Express' });
	  
	// redirect to CLIENT page
	res.redirect('/client');
});

module.exports = router;
