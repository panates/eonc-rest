/*!
 * eonc-rest
 * Copyright(c) 2017 Panates Ltd.
 * MIT Licensed
 */

/* External module dependencies. */
const http = require('http');
const finalhandler = require('finalhandler');
const parseUrl = require('parseurl');
const isPlainObject = require('putil-isplainobject');
const debug = require('debug')('eonc:resthandler');

/* Internal module dependencies. */
const {CallableEventEmitter} = require('./callable');
const Endpoint = require('./endpoint');
const DynamicRouter = require('./dynamicrouter');
const errors = require('./errors');

/*
 * Module variables.
 */

const env = process.env.NODE_ENV || 'development';

/* istanbul ignore next */
const defer = typeof setImmediate === 'function'
    ? setImmediate
    : function(fn) {
      process.nextTick(// eslint-disable-next-line
          fn.bind.apply(fn, // eslint-disable-next-line
              arguments));
    };

/**
 * @class
 * @public
 */

class RestHandler extends CallableEventEmitter {

  constructor(cfg) {
    super('handle');
    this.route = '/';
    this.stack = [];
    this.writeObject = cfg ? cfg.writeObject : undefined;
  }

  /**
   * Utilize the given middleware/endpoint `handle` to the given `route`,
   * defaulting to _/_. This "route" is the mount-point for the
   * middleware/endpoint, when given a value other than _/_ the middleware/endpoint
   * is only effective when that segment is present in the request's
   * pathname.
   *
   * For example if we were to mount a function at _/admin_, it would
   * be invoked on _/admin_, and _/admin/settings_, however it would
   * not be invoked for _/_, or _/posts_.
   *
   * @param {String|Function|RestHandler} route, callback or server
   * @param {Function|RestHandler|Endpoint|DynamicRouter} fn callback, RestHandler, or EndPoint
   * @return {RestHandler} for chaining
   * @public
   */
  use(route, fn) {
    // Register handlers
    let lhandle = fn;
    let lpath = route;

    // default route to '/'
    if (typeof route !== 'string') {
      lhandle = route;
      lpath = '/';
    }

    const fullRoute = this.fullRoute ? this.fullRoute + lpath : lpath;

    // wrap vanilla http.Servers
    if (lhandle instanceof http.Server) {
      lhandle = lhandle.listeners('request')[0];
      lhandle.fullRoute = fullRoute;
    } else
    // wrap sub-apps
    if (typeof lhandle === 'function' && lhandle.length <= 4) {
      const subHandler = lhandle;
      subHandler.route = lpath;
      subHandler.fullRoute = fullRoute;
    }

    // strip trailing slash
    if (lpath[lpath.length - 1] === '/') {
      lpath = lpath.slice(0, -1);
    }

    // define the middleware
    if (process.env.DEBUG)
      debug('use %s at > %s', lhandle instanceof Endpoint ?
          'Endpoint (' + lhandle.name + ')' :
          'Handler', fullRoute || '/');
    this.stack.push({route: lpath, handle: lhandle});

    return this;
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   * Remove handler from stack
   * @param {Function} handler
   */
  remove(handler) {
    for (let i = 0; i < this.stack.length; i++) {
      if (this.stack[i].handle === handler) {
        this.stack.splice(i, 1);
        return;
      }
    }
  }

  /**
   * Mounts a local directory as api root.
   * A DynamicRouter object will be mounted for given path.
   * DynamicRouter lookups and loads EndPoints on request time.
   *
   * @param {string} path
   * @param {String|Object} cfg Configuration object or local path for api root
   */
  mount(path, cfg) {
    if (!cfg) {
      cfg = path;
      path = '/';
    }
    this.use(path, new DynamicRouter(cfg));
  }

  /**
   * Handle server requests, punting them down
   * the middleware stack.
   * @param {*} req
   * @param {*} res
   * @param {*} out
   * @private
   */
  handle(req, res, out) {
    let index = 0;
    const protohost = getProtoHost(req.url) || '';
    let removed = '';
    let slashAdded = false;
    const stack = this.stack;
    const self = this;

    // final function handler
    const done = out || finalhandler(req, res, {
          env: env,
          onerror: logError
        });

    // store the original URL
    req.originalUrl = req.originalUrl || req.url;

    function next(err) {
      if (slashAdded) {
        req.url = req.url.substr(1);
        slashAdded = false;
      }

      if (removed.length !== 0) {
        req.url = protohost + removed + req.url.substr(protohost.length);
        removed = '';
      }

      // next callback
      const layer = stack[index++];

      // all done
      if (!layer) {
        defer(done, err);
        return;
      }

      // route data
      //noinspection JSUnresolvedVariable
      const path = parseUrl(req).pathname || '/';
      const route = layer.route;

      // skip this layer if the route doesn't match
      if (path.toLowerCase().substr(0, route.length) !== route.toLowerCase()) {
        return next(err);
      }

      // skip if route match does not border "/", ".", or end
      const c = path[route.length];
      if (c !== undefined && '/' !== c && '.' !== c) {
        return next(err);
      }

      // trim off the part of the url that matches the route
      if (route.length !== 0 && route !== '/') {
        removed = route;
        req.url = protohost + req.url.substr(protohost.length + removed.length);

        // ensure leading slash
        if (!protohost && req.url[0] !== '/') {
          req.url = '/' + req.url;
          slashAdded = true;
        }
      }

      // call the layer handle
      self._callHandler(layer.handle, route, err, req, res, next);
    }

    next();
  }

  /**
   * Listen for connections.
   *
   * This method takes the same arguments
   * as node's `http.Server#listen()`.
   *
   * HTTP and HTTPS:
   *
   * If you run your application both as HTTP
   * and HTTPS you may wrap them individually,
   * since your Connect "server" is really just
   * a JavaScript `Function`.
   *
   *      var connect = require('connect')
   *        , http = require('http')
   *        , https = require('https');
   *
   *      var app = connect();
   *
   *      http.createRestHandler(app).listen(80);
   *      https.createRestHandler(options, app).listen(443);
   *
   * @return {http.Server}
   * @public
   */

  listen(...args) {
    return http.createServer(this).listen(...args);
  }

  _writeObject(res, chunk, encoding, callback) {
    if (this.writeObject && this.writeObject(res, chunk, encoding, callback))
      return true;
    if (chunk instanceof Error) {
      const err = chunk;
      if (!res.headersSent)
        res.statusCode =
            (err instanceof errors.HttpError ? err.code : 500) || 400;
      //console.log('_writeObject', err.code);
      res.write(err.message, encoding, callback);
      this.emit('error', err);
      return true;
    }
    if (isPlainObject(chunk) || Array.isArray(chunk)) {
      if (!res.headersSent && !res.hasHeader('content-type'))
        res.setHeader('Content-Type', 'application/json');
      res.write(JSON.stringify(chunk), encoding, callback);
      return true;
    }
  }

  /**
   * Invoke a route handle.
   * @param {*} handle
   * @param {string} route
   * @param {*} err
   * @param {*} req
   * @param {*} res
   * @param {*} next
   * @private
   */
  _callHandler(handle, route, err, req, res, next) {
    const arity = handle.length;
    let error = err;
    const hasError = Boolean(err);
    const self = this;

    if (process.env.DEBUG)
      debug('I: %s(%s) %s > %s', req.method, handle.name ||
          '<anonymous>', route,
          req.originalUrl);

    res.__callCount = res.__callCount || 0;
    /* Patch response at first call */
    if (++res.__callCount === 1) {
      const oldEnd = res.end;
      res.end = function(data, encoding, callback) {
        if (data instanceof Error) {
          res.write(data);
          data = '';
        }
        oldEnd.call(res, data, encoding, callback);
      };

      const oldWrite = res.write;
      let callOriginal;
      res.write = function(chunk, encoding, callback) {
        if (callOriginal)
          oldWrite.call(res, chunk, encoding, callback);
        else {
          callOriginal = true;
          try {
            self._writeObject(res, chunk, encoding, callback);
          } finally {
            callOriginal = false;
          }
        }
      };
    }

    try {
      if (hasError && arity === 4) {
        // error-handling middleware
        handle(err, req, res, next);
        return;
      } else if (!hasError && arity < 4) {
        // request-handling middleware
        const o = handle(req, res, next);
        if (o && (o instanceof Promise ||
            (typeof o.then === 'function' &&
            typeof o.catch === 'function'))) {
          o.catch(e => {
            const err = e instanceof Error ? e : new Error(e);
            err.request = req;
            res.end(err);
          });
        }
        return;
      }
    } catch (e) {
      // replace the error
      error = e instanceof Error ? e : new Error(e);
      error.request = req;
    }

    // continue
    next(error);
  }

}

/**
 * Log error using console.error.
 *
 * @param {Error} err
 * @private
 */

function logError(err) {
  if (env !== 'test') // eslint-disable-next-line
    console.error(err.stack || err.toString());
}

/**
 * Get get protocol + host for a URL.
 *
 * @param {string} url
 * @private
 */

function getProtoHost(url) {
  if (url.length === 0 || url[0] === '/') {
    return undefined;
  }

  const searchIndex = url.indexOf('?');
  const pathLength = searchIndex !== -1
      ? searchIndex
      : url.length;
  const fqdnIndex = url.substr(0, pathLength).indexOf('://');

  return fqdnIndex !== -1
      ? url.substr(0, url.indexOf('/', 3 + fqdnIndex))
      : undefined;
}

module.exports = RestHandler;
