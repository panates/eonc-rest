const rest = require('./');
const http = require('http');

let schema1 = rest.schema("ns1:http://any1.test.url");
let schema2 = rest.schema();


item = new rest.SchemaItem("name", {
    type: "object",
    items: "a:long; b+:string"
});
console.log(item.deserialize("{a:1, b:2}"));

let app = rest.server();
let ep = rest.endpoint();
app.use('/blog', ep);


ep.GET("prm1:long; prm2:string", function (req, res) {
});

ep.all({
    prm1: {
        type: "string",
        onvalidate: function (name, val) {
            return val + "validated";
        }
    }
}, function (req, res) {
    console.log(req.params.prm1);
    //assert.equal(req.params.prm1, "123validated");
    res.end();
});


//create node.js http server and listen on port
let server = http.createServer(app);

server.listen(5000, function () {
    console.info(`Server started on port ${server.address().port}`);
});

return;
/*

return;



schema1.define("ID", "number");
//schema1.define("Name", "string(3-30)");

let item = new rest.SchemaItem("name", {
    type: "object",
    items: {
        a: "long",
        b: "long",
        c: "string"
    }
});

rest.Schema.get("ns1");

console.log(item.deserialize('{a:1, b:2, c:"c", d:4}'));

return;

schema2.define("ID2", {
    type: "date",
    minValue:'20170501',
    maxValue: '20180501'
});

let out = schema2.deserialize("id2", "20170601");


console.log(out);

return;




return;
let app = rest.server();

let ep = rest.endpoint();

ep.all(function (req, res) {
        console.log(req);
});

/ *
ep.PUT("id:ns1:ID; name:ns1:Name; date:Date", function (req, res) {
    res.end(JSON.stringify(req.params));
});

ep.POST(function (req, res) {
    let body = '';
    req.on('data', function (data) {
        body += data;
    });
    req.on('end', function () {
        res.end(body);
    });
});

ep.all({
        id: "ns1:ID",
        name: {
            type: "ns1:Name",
            onParse: function (type, inp) {
                return inp + " parsed";
            },
            onvalidate: function (type, inp) {
                return inp + " validated";
            }
        },
        date: "date?",
        obj: {
            type: "object",
            //optional: true,
            minOccurs: 0,
            maxOccurs: 0,
            items: {
                a: "long",
                b: "number?",
                c: "string"
            }
        }
    },
    function (req, res) {
    let d = new Date(2017,5,2, 0,0,0,0);
    console.log(d);
        res.end(JSON.stringify(req.params));
    });
* /
app.use('/a/b/test', ep);


//create node.js http server and listen on port
let server = http.createServer(app);

server.listen(5000, function () {
    console.info(`Server started on port ${server.address().port}`);
});

server.on("error", (err) => {
    if (err.code === "EACCES")
        console.error(`Unable to open port (${err.port}) for listening. Access denied or port already in use.`);
    else
        console.error(err);
});

*/