/*!
 * eonc-rest
 * Copyright(c) 2017 Panates Ltd.
 * MIT Licensed
 */

/* External module dependencies. */

const url = require('url');
const path = require('path');
const fs = require('fs');

/* Internal module dependencies. */
const Endpoint = require('./endpoint');

const APP_ROOT = path.dirname(require.main.filename);

/**
 * Create a new DynamicRouter handler
 * @class
 * @public
 */
class DynamicRouter {

  /**
   *
   * @param {String|Object} cfg
   */
  constructor(cfg) {
    this.suffix = undefined;
    this.localDir = './';
    if (typeof cfg === 'object')
      this.configure(cfg);
    else this.localDir = String(cfg);
  }

  configure(cfg) {
    if (cfg.localDir !== undefined)
      this.localDir = cfg.localDir;
    if (cfg.prefix !== undefined)
      this.prefix = cfg.prefix;
    if (cfg.suffix !== undefined)
      this.suffix = cfg.suffix;
    if (cfg.defaultFile !== undefined)
      this.defaultFile = cfg.defaultFile;
    if (cfg.match !== undefined)
      this.match = cfg.match;
    if (cfg.onExecute !== undefined)
      this.onExecute = cfg.onExecute;
  }

  /**
   * Handle server requests, punting them down
   * the middleware stack.
   *
   * @private
   */

  handle(req, res, next) {
    const self = this;
    const pt = url.parse(req.url).pathname;
    const basename = path.basename(pt);
    let dir = path.join((self.localDir), path.dirname(pt));
    if (!path.isAbsolute(dir))
      dir = path.join(APP_ROOT, dir);
    let file = path.join(dir,
        (self.prefix || '') + basename + (self.suffix || ''));
    let ep;

    function tryRequire(filename) {
      if (!self.match ||
          (typeof self.match === 'function' && self.match(filename))) {
        try {
          return require(file);
        } catch (e) {
          return false;
        }
      }
    }

    if (!(ep = tryRequire(file))) {
      file = path.join(dir, basename, (self.defaultFile || '_default'));
      if (!(ep = tryRequire(file))) {
        next();
        return;
      }
    }

    if (ep && ep instanceof Endpoint) {
      if (typeof self.onExecute === 'function') {
        if (self.onExecute(file, ep, req, res)) {
          res.end();
          return;
        }
      }
      return ep.handle(req, res);
    } else {
      res.writeHead(400, 'You can not access this resource');
      res.end();
    }

  }
}

exports = module.exports = DynamicRouter;
