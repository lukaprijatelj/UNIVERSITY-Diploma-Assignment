var multer = require('multer');

var STORAGE = multer.diskStorage(
{
	destination: function (req, file, cb) 
	{
		// saves files to uploads folder
		cb(null, 'uploads/');
	},

	filename: function (req, file, cb) 
	{
		var extension = '';

		switch (file.mimetype)
		{
			case 'image/jpeg':
				extension = '.jpg';
				break;

			case 'image/png':
				extension = '.png';
				break;
		}
		
		cb(null, file.fieldname + '-' + Date.now() + extension);
	}
});  

module.exports = multer({ storage: STORAGE });