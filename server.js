var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var url = require('url');
var fs = require('fs');
var mongodb = require('mongodb').MongoClient;
var API = require('./api.js');


var SERVER =
{
    hostname: '127.0.0.1',

    port: 3000,

    /**
     * Root directory.
     */
    baseUrl: '/',

    /**
     * Main init function.
     */
    init: function()
    {
        /* ----- MIDDLEWARE ----- */

        // allow static files like CSS and JS
        app.use(express.static('./'));


        /* ----- ROUTING ------ */

        API.init(SERVER.baseUrl, app);

        // order of get functions is important
        app.get(SERVER.baseUrl + 'client', SERVER.getIndexFile);

        // process all other request that start with / 
        app.get(SERVER.baseUrl, SERVER.fileNotFound);

        // process all other requests
        app.get('*', SERVER.fileNotFound);        


        // start server
        http.listen(SERVER.port, SERVER.hostname, SERVER.listenCallback);
    },

    listenCallback: function()
    {
        console.log('listening on ' + SERVER.hostname + ':' + SERVER.port);
    },

    fileNotFound: function(request, response)
    {
        response.status(404);
        response.send('Page was not found!');
    },

    getIndexFile: function(request, response)
    {
        var jsonPath = path.join(__dirname, 'client', 'index.html');
        response.sendFile(jsonPath);
    }
};

SERVER.init();