# EONC-Rest

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build Status][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]
[![Gitter chat](https://badges.gitter.im/panates/eonc-rest.svg)][gitter-url]

[EONC-Rest](https://github.com/panates/eonc-rest) is a fast Rest-Application framework for [NodeJS](http://nodejs.org), makes building rest applications easy.
EONC-Rest framework supports  endpoints (known as api's), types, global schemas and [express](https://github.com/expressjs/express)/[connect](https://github.com/senchalabs/connect) middlewares.


```js
const rest = require('eonc-rest');
const http = require('http');

const app = rest.server();

// gzip/deflate outgoing responses
const compression = require('compression');
app.use(compression());

// store session state in browser cookie
const cookieSession = require('cookie-session');
app.use(cookieSession({
    keys: ['secret1', 'secret2']
}));

let ep = rest.endpoint();

ep.GET({
        id: "long",
        name: {
            type: "string",
            minSize: 3,
            maxSize: 15,
            onvalidate: function (type, inp) {
                return inp + " validated";
            }
        },
        date: "date?", // optional
        obj: {
            type: "object",
            optional: true,
            minOccurs: 0,
            maxOccurs: 0,
            items: {
                a: "integer",
                b: "number?",
                c: "string"
            }
        }
    },
    function (req, res) {
        res.end(JSON.stringify(req.params));
    });

ep.PUT("id:long; name:string(3-15); date:date?", function (req, res) {
    res.end(JSON.stringify(req.params));
});


app.use('/app/ping', ep);

//create node.js http server and listen on port
http.createServer(app).listen(5000);
```
## Getting Started

EONC-Rest is a extensible framework that supports both middleware and endpoint.

### Install EONC-Rest

```sh
$ npm install eonc-rest
```

### Create an server

The main component is a rest server. This will route request to the middlewares and endpoints.

```js
const app = rest.server();
```
### Create endpoints

Endpoints are the api's in your rest application. An endpoint can handle one, many or all http methods. EONC process type checking and converting for input parameters before calling endpoint handler.  

```js
var ep = rest.endpoint();

// Endpoint will handle GET, PUT and DELETE methods
ep.GET("id:long", function (req, res) {
    res.end("Your id is " + req.params.id);
});
ep.PUT("id:long; name:string(3-15)", function (req, res) {
    res.end("Your name updated with " + req.params.name);
});
ep.DELETE("id:long", function (req, res) {
    res.end("Your id is delete");
});
app.use("/path/to/api1", ep);

ep = rest.endpoint();
// Endpoint will handle all methods
ep.ALL("foo:string", function (req, res) {
    res.end(req.attr.foo);
});
app.use("/path/to/api2", ep);
```

### Use types
Type checking and conversion is the powerful part of the EONC-Rest framework. It quaranties you will get the exact type of request parameters in your endpoint handler. Defining types is very easy.

**1.Type definition objects**
```js
ep.GET(
    {
        field1: {
            type: "integer",
            optional: true,     // default false
            minValue: 1,
            maxValue: 100,      // field value must be between 1-100
            minOccurs: 0,
            maxOccurs: 10,      // this is an array field that can have 10 items max
            onvalidate: function (type, inp) {
                // custom validation handler
                return inp;
            }
        },          // Integer field
        field2: {
            type: "string",
            minSize: 3,
            maxSize: 15,        // String length must between 3 and 15
            pattern: /^\w+$/    // Value must match the regex pattern.
        },
        date: "date?",          // optional date value
        obj: {                  // Object field with 3 sub items
            type: "object",
            optional: true,
            items: {
                a: "integer",
                b: "number?",
                c: "string"
            }
        }
    },
    handler);
```

**2.Type definition strings**
```js
ep.GET(
    {
        field1: "integer",                // Integer field
        field2: "integer[]",              // Integer array field
        field3: "integer?[1-10]",         // Optional field can have integer array that have at least 1, max 10 items
        field4: "integer(1-100)",         // Field must have integer values between 1 and 100 
        field5: "integer?(1-100)[1-10]",  // Optional array field with value range checking   
        field6: "string?(3-15)" + /\w+/,     // Optional string field with value pattern checking
    },
    handler);
```

### Use global schemas
Global schemas can be used in an EONC-Rest application. This helps you define global types and use them in your endpoints. 

```js
var schema1 = rest.schema("ns1:http://app1.anyurl.com");
schema1.define("ID", "number");
schema1.define("Name", "string(3-30)");

var schema2 = rest.schema("ns2:http://app2.anyurl.com");
schema2.define("CustomType", {
    type: "object",
    items: {
        a: "number",
        b: "string",
        c: "date?"
    }
});
```
Once you created a schema object and define types in it, you can use that types anywhere in your application.

```js
var ep = rest.endpoint();

ep.GET("id:ns1:ID; name:ns1:Name; data:ns2:CustomType", handler);


```

### Use middleware

The core of middleware support is extended from [connect](https://github.com/senchalabs/connect) project. Take a look at [connect](https://github.com/senchalabs/connect) repository for detailed use of middlewares. 

## Node Compatibility

  - node `>= 6.x`;
  
### License
[MIT](LICENSE)

[npm-image]: https://img.shields.io/npm/v/eonc-rest.svg
[npm-url]: https://npmjs.org/package/eonc-rest
[travis-image]: https://img.shields.io/travis/panates/eonc-rest/master.svg
[travis-url]: https://travis-ci.org/panates/eonc-rest
[coveralls-image]: https://img.shields.io/coveralls/panates/eonc-rest/master.svg
[coveralls-url]: https://coveralls.io/r/panates/eonc-rest
[downloads-image]: https://img.shields.io/npm/dm/eonc-rest.svg
[downloads-url]: https://npmjs.org/package/eonc-rest
[gitter-url]: https://gitter.im/panates/eonc-rest?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge