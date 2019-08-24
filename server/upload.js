var multer = require('multer');

var STORAGE = multer.diskStorage(
{
	/**
	 * Sets destination where files will be stored.
	 */
	destination: function (req, file, cb) 
	{
		// saves files to uploads folder
		cb(null, 'public/scenes/Uploads');
	},

	/**
	 * Sets filename for uploaded file.
	 */
	filename: function (req, file, cb) 
	{
		/*
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
		cb(null, file.fieldname + '-' + Date.now() + extension);*/

		cb(null, file.originalname);
	}
});  

module.exports = multer({ storage: STORAGE });