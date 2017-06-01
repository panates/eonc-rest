const rest = require('eonc-rest');
const http = require('http');
const path = require('path');

// Create the server handler
let app = rest.handler();

// Create a global schema
let schema1 = rest.schema('ns1:app1.test.url');

// define global types
schema1.define('Id', 'long');
schema1.define('Name', 'string(3-30)');   // string value at least 3, max 30 chars
schema1.define('PhoneNumber', 'string' + /\d{3}-\d{6,7}/);   // string value that matches given pattern, optional

// Mount ./apis as out api root and serve at /service
app.mount({
      localDir: './apis',
      prefix: 'ep_', // Endpoint file name prefix is _ep
      suffix: '.js', // Endpoint file name suffix is .js  // This is default behavior
      defaultFile: '_default', // If request addresses to a folder, router will seek for default file
      onMatch: function(filename) {
        // accept any file except ep_skipthis.js
        return (path.basename(filename) !== 'ep_skipthis.js');
      }
    }
);

//create node.js http server and listen on port
let server = http.createServer(app);

// start http listener
server.listen(5000, function() {
  console.info(`Server started on port ${server.address().port}`);
});

server.on('error', (err) => {
  if (err.code === 'EACCES')
    console.error(
        `Unable to open port (${err.port}) for listening. Access denied or port already in use.`);
  else
    console.error(err);
});

