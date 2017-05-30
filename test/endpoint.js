/*
 * Tests for endpoints
 */

const assert = require('assert');
const rest = require('..');
const http = require('http');
const request = require('supertest');

describe('Endpoint', function () {

    describe('Handle http methods', function () {

        let app;
        let ep;

        beforeEach(function () {
            app = rest.handler();
            ep = new rest.Endpoint();
        });

        it('should handle all methods', function (done) {

            ep.all(function (req, res) {
                assert.equal(req.url, '/');
                res.end('blog');
            });

            app.use('/blog', ep);

            request(app)
                .get('/blog')
                .expect(200, 'blog', done);
        });

        it('should handle DELETE method', function (done) {

            ep.DELETE(function (req, res) {
                assert.equal(req.url, '/');
                res.end('deleted');
            });

            app.use('/blog', ep);

            request(app)
                .delete('/blog')
                .expect(200, 'deleted', done);
        });

        it('should handle GET method', function (done) {

            ep.GET(function (req, res) {
                assert.equal(req.url, '/');
                res.end('blog');
            });

            app.use('/blog', ep);

            request(app)
                .get('/blog')
                .expect(200, 'blog', done);
        });

        it('should handle POST method', function (done) {

            ep.POST(function (req, res) {
                assert.equal(req.url, '/');
                let body = '';
                req.on('data', function (data) {
                    body += data;
                });
                req.on('end', function () {
                    res.end(body);
                });
            });

            app.use('/blog', ep);

            request(app)
                .post('/blog')
                .send('post data')
                .expect(200, 'post data', done);
        });

        it('should handle PUT method', function (done) {

            ep.PUT(function (req, res) {
                assert.equal(req.url, '/');
                let body = '';
                req.on('data', function (data) {
                    body += data;
                });
                req.on('end', function () {
                    res.end(body);
                });
            });

            app.use('/blog', ep);

            request(app)
                .put('/blog')
                .send('put data')
                .expect(200, 'put data', done);
        });

        it('should handle PATCH method', function (done) {

            ep.PATCH(function (req, res) {
                assert.equal(req.url, '/');
                let body = '';
                req.on('data', function (data) {
                    body += data;
                });
                req.on('end', function () {
                    res.end(body);
                });
            });

            app.use('/blog', ep);

            request(app)
                .patch('/blog')
                .send('patch data')
                .expect(200, 'patch data', done);
        });

        it('should response error for not handled method', function (done) {

            ep.GET(function (req, res) {
            });

            app.use('/blog', ep);

            request(app)
                .delete('/blog')
                .expect(400, '', done);
        });

        it('should catch Http errors', function (done) {

            ep.GET(function (req, res) {
                throw new rest.HttpError(400);
            });

            app.use('/blog', ep);

            request(app)
                .get('/blog')
                .expect(400, '', done);
        });

        it('should catch unknown errors', function (done) {

            ep.GET(function (req, res) {
                throw "Error";
            });

            app.use('/blog', ep);

            request(app)
                .get('/blog')
                .expect(500, '', done);
        });
    });

    describe('Define types', function () {

        let app;
        let ep;

        beforeEach(function () {
            app = rest.handler();
            ep = new rest.Endpoint();
        });

        it('should handle string type definitions', function (done) {

            ep.GET("prm1:long; prm2:string", function (req, res) {
                res.end(req.params.prm1 + req.params.prm2);
            });

            app.use('/blog', ep);

            request(app)
                .get('/blog?prm1=12345&prm2=abcde')
                .expect(200, '12345abcde', done);
        });

        it('should handle object type definitions', function (done) {

            ep.GET({
                prm1: {
                    type: "long"
                },
                prm2: {
                    type: "string"
                }
            }, function (req, res) {
                res.end(req.params.prm1 + req.params.prm2);
            });

            app.use('/blog', ep);

            request(app)
                .get('/blog?prm1=12345&prm2=abcde')
                .expect(200, '12345abcde', done);
        });

        it('should not define parameter second time', function (done) {

            let ok;
            try {
                ep.GET("prm1:long; prm1:string", function (req, res) {
                });
            } catch (e) {
                ok = true;
            }
            assert.ok(ok);
            done();
        });

        it('should not set method handler second time', function (done) {

            let ok;
            try {
                ep.GET("prm1:long; prm2:string", function (req, res) {
                });
                ep.GET("prm1:long; prm2:string", function (req, res) {
                });
            } catch (e) {
                ok = true;
            }
            assert.ok(ok);
            done();
        });

    });


});