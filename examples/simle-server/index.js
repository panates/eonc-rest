const rest = require('../..');
const http = require('http');

// Create the server handler
const app = rest();

// Create a global schema
const schema1 = rest.schema('ns1:app1.test.url');

// define global types
schema1.define('Id', 'long');
schema1.define('Name', 'string(3-30)'); // string value at least 3, max 30 chars
schema1.define('PhoneNumber', 'string' + /\d{3}-\d{6,7}/); // string value that matches given pattern, optional

// register endpoints (apis)
app.use('/customer', require('./apis/customer'));

//create node.js http server and listen on port
const server = http.createServer(app);

// start http listener
server.listen(5000, function() {
  console.info(`Server started on port ${server.address().port}`);
});

server.on('error', (err) => {
  if (err.statusCode === 'EACCES')
    console.error(`Unable to open port (${err.port}) for listening. Access denied or port already in use.`);
  else
    console.error(err);
});

