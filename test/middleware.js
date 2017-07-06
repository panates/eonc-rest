/* eslint-disable */
/*
 * Tests for middleware capabilities (extended from connect)
 * Original file ([connect]/test/server.js)
 */

const assert = require('assert');
const rest = require('..');
const http = require('http');
const request = require('supertest');

describe('app', function() {
  let app;

  beforeEach(function() {
    app = rest();
  });

  it('should inherit from event emitter', function(done) {
    app.on('foo', done);
    app.emit('foo');
  });

  it('should work in http.createServer', function(done) {
    let app = rest();

    app.use(function(req, res) {
      res.end('hello, world!');
    });

    let server = http.createServer(app);

    request(server)
        .get('/')
        .expect(200, 'hello, world!', done);
  });

  it('should be a callable function', function(done) {
    let app = rest();

    app.use(function(req, res) {
      res.end('hello, world!');
    });

    function handler(req, res) {
      res.write('oh, ');
      app(req, res);
    }

    let server = http.createServer(handler);

    request(server)
        .get('/')
        .expect(200, 'oh, hello, world!', done);
  });

  it('should invoke callback if request not handled', function(done) {
    let app = rest();

    app.use('/foo', function(req, res) {
      res.end('hello, world!');
    });

    function handler(req, res) {
      res.write('oh, ');
      app(req, res, function() {
        res.end('no!');
      });
    }

    let server = http.createServer(handler);

    request(server)
        .get('/')
        .expect(200, 'oh, no!', done);
  });

  it('should invoke callback on error', function(done) {
    let app = rest();

    app.use(function(req, res) {
      throw new Error('boom!');
    });

    function handler(req, res) {
      res.write('oh, ');
      app(req, res, function(err) {
        res.end(err.message);
      });
    }

    let server = http.createServer(handler);

    request(server)
        .get('/')
        .expect(200, 'oh, boom!', done);
  });

  it('should work as middleware', function(done) {
    // custom server handler array
    let handlers = [rest(), function(req, res, next) {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('Ok');
    }];

    // execute callbacks in sequence
    let n = 0;

    function run(req, res) {
      if (handlers[n]) {
        handlers[n++](req, res, function() {
          run(req, res);
        });
      }
    }

    // create a non-connect server
    let server = http.createServer(run);

    request(server)
        .get('/')
        .expect(200, 'Ok', done);
  });

  it('should escape the 500 response body', function(done) {
    app.use(function(req, res, next) {
      next(new Error('error!'));
    });
    request(app)
        .get('/')
        .expect(/Error: error!<br>/)
        .expect(/<br> &nbsp; &nbsp;at/)
        .expect(500, done);
  });

  describe('404 handler', function() {
    it('should escape the 404 response body', function(done) {
      rawrequest(app)
          .get('/foo/<script>stuff\'n</script>')
          .expect(404, />Cannot GET \/foo\/%3Cscript%3Estuff&#39;n%3C\/script%3E</, done);
    });

    it('shoud not fire after headers sent', function(done) {
      let app = rest();

      app.use(function(req, res, next) {
        res.write('body');
        res.end();
        process.nextTick(next);
      });

      request(app)
          .get('/')
          .expect(200, done);
    });

    it('shoud have no body for HEAD', function(done) {
      let app = rest();

      request(app)
          .head('/')
          .expect(404, undefined, done);
    });
  });

  describe('error handler', function() {
    it('should have escaped response body', function(done) {
      let app = rest();

      app.use(function(req, res, next) {
        throw new Error('<script>alert()</script>');
      });

      request(app)
          .get('/')
          .expect(500, /&lt;script&gt;alert\(\)&lt;\/script&gt;/, done);
    });

    it('should use custom error statusCode', function(done) {
      let app = rest();

      app.use(function(req, res, next) {
        let err = new Error('ack!');
        err.status = 503;
        throw err;
      });

      request(app)
          .get('/')
          .expect(503, done);
    });

    it('should keep error statusCode', function(done) {
      let app = rest();

      app.use(function(req, res, next) {
        res.statusCode = 503;
        throw new Error('ack!');
      });

      request(app)
          .get('/')
          .expect(503, done);
    });

    it('shoud not fire after headers sent', function(done) {
      let app = rest();

      app.use(function(req, res, next) {
        res.write('body');
        res.end();
        process.nextTick(function() {
          next(new Error('ack!'));
        });
      });

      request(app)
          .get('/')
          .expect(200, done);
    });

    it('shoud have no body for HEAD', function(done) {
      let app = rest();

      app.use(function(req, res, next) {
        throw new Error('ack!');
      });

      request(app)
          .head('/')
          .expect(500, undefined, done);
    });
  });
});

function rawrequest(app) {
  let _path;
  let server = http.createServer(app);

  function expect(status, body, callback) {
    server.listen(function() {
      let addr = this.address();
      let hostname = addr.family === 'IPv6' ? '::1' : '127.0.0.1';
      let port = addr.port;

      let req = http.get({
        host: hostname,
        path: _path,
        port: port
      });
      req.on('response', function(res) {
        let buf = '';

        res.setEncoding('utf8');
        res.on('data', function(s) {
          buf += s;
        });
        res.on('end', function() {
          let err = null;

          try {
            assert.equal(res.statusCode, status);

            if (body instanceof RegExp) {
              assert.ok(body.test(buf), 'expected body ' + buf + ' to match ' +
                  body);
            } else {
              assert.equal(buf, body, 'expected ' + body +
                  ' response body, got ' + buf);
            }
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