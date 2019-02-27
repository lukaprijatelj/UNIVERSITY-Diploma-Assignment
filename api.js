var multer  = require('multer');
var upload = multer({ dest: 'uploads/' });

var API =
{
    init: function(baseUrl, app)
    {
        baseUrl = baseUrl + 'api/uploadScene';

        // mutiple callbacks separated with comma.
        // first upload.single parses file and saves it into request.file
        app.post(baseUrl + '', upload.single('fileneki'), API.uploadScene);
    },

    uploadScene: function(request, response)
    {
        var scene = request.param('scene');
        response.send('Scene was uploaded!');
    }
};

module.exports = API;