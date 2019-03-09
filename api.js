var upload = require('./upload.js');
var DBLogic = require('./DBLogic.js');


var API =
{
	baseUrl: '/api/',

	upload: null,

    init: function(app)
    {
        // mutiple callbacks separated with comma.
        // first upload.single parses file and saves it into request.file
        app.post(API.baseUrl + 'uploadScene', upload.single('fileneki'), API.uploadScene);
    },

    uploadScene: function(request, response)
    {
		var filename = request.file.filename;
		var path = request.file.path;
		
		DBLogic.addUploadedFile(filename, path, function()
		{
			response.send('Scene was uploaded!');
		});
    }
};

module.exports = API;