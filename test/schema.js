/*
 * Tests for endpoints
 */

const assert = require('assert');
const rest = require('..');
const http = require('http');
const request = require('supertest');

describe('Schema', function () {

    let schema1;
    let schema2;
    let schema3 = new rest.Schema();

    it('should create schema with ns:url', function (done) {
        schema1 = rest.schema("ns1:http://any1.test.url");
        assert.equal(rest.Schema.get("ns1"), schema1);
        done();
    });

    it('should create schema with ns:url', function (done) {
        schema2 = rest.schema("http://any2.test.url");
        assert.equal(rest.Schema.get("ns2"), schema2);
        done();
    });

    it('should not define an ns second time', function (done) {
        let ok;
        try {
            let schema3 = rest.schema("ns2:http://any3.test.url");
        } catch (e) {
            ok = true;
        }
        assert.ok(ok);
        done();
    });

    it('should get a type with static function Schema.get("ns:type")', function (done) {
        schema1.define("prm100", "string");
        assert.ok(rest.Schema.get("ns1:prm100").type === "string");
        done();
    });

    it('should not define an url second time', function (done) {
        let ok;
        try {
            let schema3 = rest.schema("ns3:http://any2.test.url");
        } catch (e) {
            ok = true;
        }
        assert.ok(ok);
        done();
    });

    it('should define internal types', function (done) {
        schema1.define("prm1", "string");
        assert.equal(schema1.get("prm1").type, "string");
        done();
    });

    it('should not define a type second time', function (done) {
        let ok = 0;
        try {
            schema1.define("prm1", "string");
        } catch (e) {
            ok++
        }
        try {
            schema3.define("prm1", "string");
            schema3.define("prm1", "string");
        } catch (e) {
            ok++
        }
        assert.ok(ok === 2);
        done();
    });

    it('should define external types', function (done) {
        schema2.define("prm1", {type: "ns1:prm1"});
        assert.equal(schema2.get("prm1").type, "prm1");
        done();
    });

    it('should define external types in sub items', function (done) {
        schema2.define("prm2", {
            type: "object",
            items: {a: "ns1:prm1"}
        });
        assert.equal(schema2.get("prm2").items.a.type, "prm1");
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

    it('should not get unregistered schema', function (done) {
        let ok;
        try {
            rest.Schema.get("unknown");
        } catch (e) {
            ok = true;
        }
        assert.ok(ok);
        done();
    });

    it('should not get schema with empty argument', function (done) {
        let ok;
        try {
            rest.Schema.get();
        } catch (e) {
            ok = true;
        }
        assert.ok(ok);
        done();
    });

    it('should not get schema with invalid argument', function (done) {
        let ok;
        try {
            rest.Schema.get("ns : aaa");
        } catch (e) {
            ok = true;
        }
        assert.ok(ok);
        done();
    });

    it('should deserialize', function (done) {
        assert.equal(schema1.deserialize("prm1", "12345"), "12345");
        done();
    });

    it('should not deserialize unknown types', function (done) {
        let ok;
        try {
            schema1.deserialize("unknown", "12345");
        } catch (e) {
            ok = true;
        }
        assert.ok(ok);
        done();
    });

    describe('Schema in action', function () {

        let app;
        let ep;

        beforeEach(function () {
            app = rest.server();
            ep = rest.endpoint();
            app.use('/blog', ep);
        });

        it('should deserialize query params to request.args', function (done) {

            ep.all({
                prm1: "string",
                prm2: "ns1:prm1",
                prm3: {
                    type: "prm1",
                    ns: "ns1"
                }
            }, function (req, res) {
                assert.equal(req.args.prm1, "123");
                assert.equal(req.args.prm2, "123");
                assert.equal(req.args.prm3, "abc");
                res.end();
            });

            request(app)
                .get('/blog')
                .query({prm1: '123', prm2: "123", prm3: "abc"})
                .expect(200, '', done);
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