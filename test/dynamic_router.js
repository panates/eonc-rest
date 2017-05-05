/*
 * Tests for endpoints
 */

const assert = require('assert');
const rest = require('..');
const http = require('http');
const request = require('supertest');
const path = require('path');

let apiDir = path.join(__dirname, 'apis');

describe('app.mount(path, cfg)', function () {

    let app;

    beforeEach(function () {
        app = rest.server();
    });

    it('should construct DynamicRouter(string)', function (done) {

        rest.dynamicRouter('./path');
        done();
    });

    it('should construct DynamicRouter(object)', function (done) {

        rest.dynamicRouter({
            localDir: "./"
        });
        done();
    });

    it('should configure', function (done) {

        let cfg = {
            localDir: "./",
            prefix: "prefix",
            suffix: "suffix",
            onmatch: function () {
            },
            onexecute: function () {
            }
        };

        let router = rest.dynamicRouter('./dir');
        router.configure(cfg);
        assert.equal(router.localDir,cfg.localDir);
        assert.equal(router.prefix, cfg.prefix);
        assert.equal(router.suffix, cfg.suffix);
        assert.equal(router.onmatch, cfg.onmatch);
        assert.equal(router.onexecute, cfg.onexecute);
        done();
    });

    it('should mount to root as default', function (done) {

        app.mount({
            localDir: apiDir
        });

        request(app)
            .get('/ep_blog?id=1')
            .expect(200, "blogjs", done);
    });

    it('should match absolute path', function (done) {

        app.mount('/service', {
            localDir: apiDir
        });

        request(app)
            .get('/service/ep_blog?id=1')
            .expect(200, "blogjs", done);
    });

    it('should match relative path', function (done) {

        app.mount('/service', {
            localDir: '../../../test/apis'
        });

        request(app)
            .get('/service/ep_blog?id=1')
            .expect(200, "blogjs", done);
    });

    it('should match prefix', function (done) {

        app.mount('/', {
            localDir: apiDir,
            prefix: 'ep_'
        });

        request(app)
            .get('/blog?id=1')
            .expect(200, "blogjs", done);
    });

    it('should match suffix (.js)', function (done) {

        app.mount('/', {
            localDir: apiDir,
            prefix: 'ep_',
            suffix: '.js'
        });

        request(app)
            .get('/blog?id=1')
            .expect(200, 'blogjs', done);
    });

    it('should call onmatch callback', function (done) {
        let ok;
        app.mount('/', {
            localDir: apiDir,
            onmatch: function () {
                ok = true;
                return true;
            }
        });
        request(app)
            .get('/ep_blog?id=1')
            .expect(200, "blogjs")
            .end(function (err) {
                if (err)
                    console.log(err);
                assert.ok(!err && ok);
                done();
            })
    });

    it('should call onmatch callback only if it is function', function (done) {
        app.mount('/', {
            localDir: apiDir,
            onmatch: "-"
        });
        request(app)
            .get('/ep_blog?id=1')
            .expect(200, "blogjs", done);
    });

    it('should call onexecute callback', function (done) {
        let ok;
        app.mount('/', {
            localDir: apiDir,
            onexecute: function (filename, ep, req, res) {
                res.end('ok');
                return true;
            }
        });
        request(app)
            .get('/ep_blog?id=1')
            .expect(200, "ok", done);
    });

    it('should call onexecute callback only if it is function', function (done) {
        app.mount('/', {
            localDir: apiDir,
            onexecute: "-"
        });
        request(app)
            .get('/ep_blog?id=1')
            .expect(200, "blogjs", done);
    });

    it('should call next() when no file fount', function (done) {
        app.mount('/', {
            localDir: apiDir
        });
        request(app)
            .get('/anyfile')
            .expect(404, done);
    });

    it('should test file exports Endpoint', function (done) {
        app.mount('/', {
            localDir: apiDir
        });
        request(app)
            .get('/ep_invalid')
            .expect(400, done);
    });

})