/*
 * Tests for endpoints
 */

const assert = require('assert');
const rest = require('..');
const http = require('http');
const request = require('supertest');

describe('Schema', function () {

    describe('Define type from string', function () {

        let schema = rest.schema("ns1:http://any.test.url");

        it('should parse type name', function (done) {

            schema.define("prm", "long");
            let prm = schema.get("prm");
            assert.equal(prm.type, "long");
            done();
        });

        it('should parse optional flag', function (done) {

            schema.define("prm1", "string?");
            let prm = schema.get("prm1");
            assert.equal(prm.optional, true);
            done();
        });

        it('should parse min/max length', function (done) {

            schema.define("prm2", "string(1-5)");
            let prm = schema.get("prm2");
            assert.ok(prm.minSize === 1 && prm.maxSize === 5, true);
            done();
        });

        it('should parse min/max value', function (done) {

            schema.define("prm3", "integer(1-5)");
            let prm = schema.get("prm3");
            assert.ok(prm.minValue === 1 && prm.maxValue === 5, true);
            done();
        });

        it('should parse min/max Occurs', function (done) {

            schema.define("prm4", "integer[1-5]");
            let prm = schema.get("prm4");
            assert.ok(prm.minOccurs === 1 && prm.maxOccurs === 5);
            done();
        });

        it('should parse regex pattern', function (done) {

            schema.define("prm5", "string" + /^\w+$/);
            let prm = schema.get("prm5");
            assert.ok("abcde12345".match(prm.pattern) && !"abcde-12345".match(prm.pattern));
            done();
        });

    });

    describe('Convert input data to JS (internal types)', function () {

        let app;
        let ep;

        beforeEach(function () {
            app = rest.server();
            ep = rest.endpoint();
            app.use('/blog', ep);
        });

        it('should process "string" type', function (done) {

            ep.all("prm1:any", function (req, res) {
                assert.equal(req.args.prm1, "str");
                res.end();
            });
            request(app)
                .get('/blog')
                .query({prm1: 'str'})
                .expect(200, '', done);
        });

        it('should process "number" type', function (done) {

            ep.all("prm1:number", function (req, res) {
                assert.equal(req.args.prm1, 1.5);
                res.end();
            });
            request(app)
                .get('/blog')
                .query({prm1: '1.5'})
                .expect(200, '', done);
        });

        it('should process "double" type', function (done) {

            ep.all("prm1:double", function (req, res) {
                assert.equal(req.args.prm1, 1.5);
                res.end();
            });
            request(app)
                .get('/blog')
                .query({prm1: '1.5'})
                .expect(200, '', done);
        });

        it('should process "integer" type', function (done) {

            ep.all("prm1:integer", function (req, res) {
                assert.equal(req.args.prm1, 1);
                res.end();
            });
            request(app)
                .get('/blog')
                .query({prm1: '1'})
                .expect(200, '', done);
        });

        it('should process "long" type', function (done) {

            ep.all("prm1:long", function (req, res) {
                assert.equal(req.args.prm1, 1);
                res.end();
            });
            request(app)
                .get('/blog')
                .query({prm1: '1'})
                .expect(200, '', done);
        });

        it('should process "boolean" type', function (done) {

            ep.all("prm1:boolean", function (req, res) {
                assert.equal(req.args.prm1, false);
                res.end();
            });
            request(app)
                .get('/blog')
                .query({prm1: 'false'})
                .expect(200, '', done);
        });

        it('should process "date" type', function (done) {

            ep.all("prm1:date", function (req, res) {
                assert.equal(req.args.prm1.getTime(), new Date(2017, 5, 2, 0, 0, 0, 0).getTime());
                res.end();
            });
            request(app)
                .get('/blog')
                .query({prm1: '20170502'})
                .expect(200, '', done);
        });

        it('should process "object" type', function (done) {

            ep.all("prm1:object", function (req, res) {
                assert.deepEqual(req.args.prm1, {a: 1, b: 2, c: "c"});
                res.end();
            });
            request(app)
                .get('/blog')
                .query({prm1: '{a:1, b:2, c:"c"}'})
                .expect(200, '', done);
        });

    });


    describe('Convert input data to JS (global schema types)', function () {

        let app;
        let ep;

        beforeEach(function () {
            app = rest.server();
            ep = rest.endpoint();
            app.use('/blog', ep);
        });

        it('should handle schema type', function (done) {

            ep.all("prm:ns1:prm3", function (req, res) {
                assert.equal(req.args.prm, 5);
                res.end();
            });
            request(app)
                .get('/blog')
                .query({prm: 5})
                .expect(200, '', done);
        });
    });

});