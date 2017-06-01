/*
 * Tests for endpoints
 */

const assert = require('assert');
const rest = require('..');
const http = require('http');
const request = require('supertest');
const path = require('path');

let apiDir = path.join(__dirname, 'apis');

describe('app.mount(path, cfg)', function() {

  let app;

  beforeEach(function() {
    app = rest.handler();
  });

  it('should construct DynamicRouter(string)', function(done) {

    rest.dynamicRouter('./path');
    done();
  });

  it('should construct DynamicRouter(object)', function(done) {

    rest.dynamicRouter({
      localDir: './',
    });
    done();
  });

  it('should configure', function(done) {

    let cfg = {
      prefix: 'prefix',
      suffix: 'suffix',
      match: function() {
      },
      onExecute: function() {
      },
    };

    let router = rest.dynamicRouter('./');
    router.configure(cfg);
    assert.equal(router.localDir, './');
    assert.equal(router.prefix, cfg.prefix);
    assert.equal(router.suffix, cfg.suffix);
    assert.equal(router.match, cfg.match);
    assert.equal(router.onExecute, cfg.onExecute);
    done();
  });

  it('should mount to root as default', function(done) {

    app.mount({
      localDir: apiDir,
    });

    request(app).get('/ep_blog?id=1').expect(200, 'blogjs', done);
  });

  it('should match absolute path', function(done) {

    app.mount('/service', {
      localDir: apiDir,
    });

    request(app).get('/service/ep_blog?id=1').expect(200, 'blogjs', done);
  });

  it('should match relative path', function(done) {

    app.mount('/service', {
      localDir: '../../../test/apis',
    });

    request(app).get('/service/ep_blog?id=1').expect(200, 'blogjs', done);
  });

  it('should match prefix', function(done) {

    app.mount('/', {
      localDir: apiDir,
      prefix: 'ep_',
    });

    request(app).get('/blog?id=1').expect(200, 'blogjs', done);
  });

  it('should match suffix (.js)', function(done) {

    app.mount('/', {
      localDir: apiDir,
      prefix: 'ep_',
      suffix: '.js',
    });

    request(app).get('/blog?id=1').expect(200, 'blogjs', done);
  });

  it('should call match callback', function(done) {
    let ok;
    app.mount('/', {
      localDir: apiDir,
      match: function() {
        ok = true;
        return true;
      },
    });
    request(app).get('/ep_blog?id=1').expect(200, 'blogjs').end(function(err) {
      if (err)
        console.log(err);
      assert.ok(!err && ok);
      done();
    });
  });

  it('should call match callback only if it is function', function(done) {
    app.mount('/', {
      localDir: apiDir,
      match: '-',
    });
    request(app).get('/ep_blog?id=1').expect(404, done);
  });

  it('should call onExecute callback', function(done) {
    let ok;
    app.mount('/', {
      localDir: apiDir,
      onExecute: function(filename, ep, req, res) {
        res.end('ok');
        return true;
      },
    });
    request(app).get('/ep_blog?id=1').expect(200, 'ok', done);
  });

  it('should skip file if match returns false', function(done) {
    app.mount('/', {
      localDir: apiDir,
      match: function() {
        return false;
      },
    });
    request(app).get('/ep_blog?id=1').expect(404, done);
  });

  it('should call onExecute callback only if it is function', function(done) {
    app.mount('/', {
      localDir: apiDir,
      onExecute: '-',
    });
    request(app).get('/ep_blog?id=1').expect(200, 'blogjs', done);
  });

  it('should call next() when no file fount', function(done) {
    app.mount('/', {
      localDir: apiDir,
    });
    request(app).get('/anyfile').expect(404, done);
  });

  it('should test file exports Endpoint', function(done) {
    app.mount('/', {
      localDir: apiDir,
    });
    request(app).get('/ep_invalid').expect(400, done);
  });

});