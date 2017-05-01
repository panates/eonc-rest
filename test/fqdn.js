/*
 * Tests for fqdn (extended from connect)
 * Original file ([connect]/test/fqdn.js)
 */

const assert = require('assert');
const rest = require('..');
const http = require('http');

describe('app.use()', function(){
    let app;

    beforeEach(function(){
        app = rest.server();
    });

    it('should not obscure FQDNs', function(done){
        app.use(function(req, res){
            res.end(req.url);
        });

        rawrequest(app)
            .get('http://example.com/foo')
            .expect(200, 'http://example.com/foo', done);
    });

    describe('with a connect app', function(){
        it('should ignore FQDN in search', function (done) {
            app.use('/proxy', function (req, res) {
                res.end(req.url);
            });

            rawrequest(app)
                .get('/proxy?url=http://example.com/blog/post/1')
                .expect(200, '/?url=http://example.com/blog/post/1', done);
        });

        it('should ignore FQDN in path', function (done) {
            app.use('/proxy', function (req, res) {
                res.end(req.url);
            });

            rawrequest(app)
                .get('/proxy/http://example.com/blog/post/1')
                .expect(200, '/http://example.com/blog/post/1', done);
        });

        it('should adjust FQDN req.url', function(done){
            app.use('/blog', function(req, res){
                res.end(req.url);
            });

            rawrequest(app)
                .get('http://example.com/blog/post/1')
                .expect(200, 'http://example.com/post/1', done);
        });

        it('should adjust FQDN req.url with multiple handlers', function(done){
            app.use(function(req,res,next) {
                next();
            });

            app.use('/blog', function(req, res){
                res.end(req.url);
            });

            rawrequest(app)
                .get('http://example.com/blog/post/1')
                .expect(200, 'http://example.com/post/1', done);
        });

        it('should adjust FQDN req.url with multiple routed handlers', function(done) {
            app.use('/blog', function(req,res,next) {
                next();
            });
            app.use('/blog', function(req, res) {
                res.end(req.url);
            });

            rawrequest(app)
                .get('http://example.com/blog/post/1')
                .expect(200, 'http://example.com/post/1', done);
        });
    });
});

function rawrequest(app) {
    let _path;
    let server = http.createServer(app);

    function expect(status, body, callback) {
        server.listen(function(){
            let addr = this.address();
            let hostname = addr.family === 'IPv6' ? '::1' : '127.0.0.1';
            let port = addr.port;

            let req = http.get({
                host: hostname,
                path: _path,
                port: port
            });
            req.on('response', function(res){
                let buf = '';

                res.setEncoding('utf8');
                res.on('data', function(s){ buf += s });
                res.on('end', function(){
                    let err = null;

                    try {
                        assert.equal(res.statusCode, status);
                        assert.equal(buf, body);
                    } catch (e) {
                        err = e;
                    }

                    server.close();
                    callback(err);
                });
            });
        });
    }

    function get(path) {
        _path = path;

        return {
            expect: expect
        };
    }

    return {
        get: get
    };
}