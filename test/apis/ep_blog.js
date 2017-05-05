const rest = require('../../');

// create the endpoint (api)
let ep = new rest.Endpoint();

// Handle Http GET method
ep.GET("id:long", function (req, res) {
    res.end("OK");
});

// Handle Http PUT method
ep.PUT("id:long", function (req, res) {
    res.end("OK");
});

// Handle Http PATCH method
ep.PATCH("id:long", function (req, res) {
    res.end("OK");
});

// Handle Http DELETE method
ep.DELETE("id:long", function (req, res) {
    res.end("OK");
});

module.exports = ep;