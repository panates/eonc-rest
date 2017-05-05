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

    it('should mount to root as default', function (done) {

        app.mount({
            localDir: apiDir
        });

        request(app)
            .get('/ep_blog?id=1')
            .expect(200, done);
    });

    it('should match full path', function (done) {

        app.mount('/service', {
            localDir: apiDir
        });

        request(app)
            .get('/service/ep_blog?id=1')
            .expect(200, done);
    });

    it('should match prefix', function (done) {

        app.mount('/', {
            localDir: apiDir,
            prefix: 'ep_'
        });

        request(app)
            .get('/blog?id=1')
            .expect(200, done);
    });

    it('should match suffix (.js)', function (done) {

        app.mount('/', {
            localDir: apiDir,
            prefix: 'ep_',
            suffix: '.js'
        });

        request(app)
            .get('/blog?id=1')
            .expect(200, done);
    });

    it('should match suffix (undefined)', function (done) {

        app.mount('/', {
            localDir: apiDir,
            prefix: 'ep_',
            suffix: undefined
        });

        request(app)
            .get('/blog?id=1')
            .expect(200, done);
    });

    it('should call filter callback', function (done) {
        let ok;
        app.mount('/', {
            localDir: apiDir,
            filter: function () {
                ok = true;
                return true;
            }
        });
        request(app)
            .get('/ep_blog?id=1')
            .expect(200, done)
            .end(function (err) {
                assert.ok(!err && ok, "filter callback didn't called!");
                done();
            })
    });

    it('should call nex() when no file fount', function (done) {
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

});