/*
 * Tests for endpoints
 */

const assert = require('assert');
const rest = require('..');
const http = require('http');
const request = require('supertest');

describe('Schema', function () {

    let schema1 = rest.schema("ns1:http://any1.test.url");
    let schema2 = rest.schema("ns2:http://any2.test.url");

    describe('Define type from string', function () {

        it('should define internal types', function (done) {
            schema1.define("prm1", "string");
            assert.equal(schema1.get("prm1").type, "string");
            done();
        });

        it('should not define a type second time', function (done) {
            let ok;
            try {
                schema1.define("prm1", "string");
            } catch (e) {
                ok = true;
            }
            assert.ok(ok);
            done();
        });

        it('should define external types', function (done) {
            schema2.define("prm1", "ns1:prm1");
            assert.equal(schema2.get("prm1").type, "prm1");
            done();
        });

        it('should define unknown external types', function (done) {
            let ok;
            try {
                schema2.define("prm1", "ns1:unknown");
            } catch (e) {
                ok = true;
            }
            assert.ok(ok);
            done();
        });
    });

    it('Schema in action', function (done) {

        let app;
        let ep;

        beforeEach(function () {
            app = rest.server();
            ep = rest.endpoint();
            app.use('/blog', ep);
        });

        it('should run onvalidate', function (done) {

            ep.all({
                prm1: {
                    type: "string",
                    onvalidate: function (name, val) {
                        return val + "validated";
                    }
                }
            }, function (req, res) {
                assert.equal(req.args.prm1, "123validated");
                res.end();
            });
            request(app)
                .get('/blog')
                .query({prm1: '123'})
                .expect(200, '', done);
        });
    });

});