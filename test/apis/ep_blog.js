const rest = require('../../');

// create the endpoint (api)
let ep = new rest.Endpoint();

// Handle Http GET method
ep.GET("id:long", function (req, res) {
    res.end("blogjs");
});

module.exports = ep;