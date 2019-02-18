var API =
{
    init: function(baseUrl, app)
    {
        baseUrl = baseUrl + 'api/uploadScene';

        app.post(baseUrl + '', API.uploadScene);
    },

    uploadScene: function(request, response)
    {
        var scene = request.param('scene');
        response.send('Scene was uploaded!');
    }
};

module.exports = API;