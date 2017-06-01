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
    if (cfg.onMatch !== undefined)
      this.onMatch = cfg.onMatch;
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
        (self.prefix || '') + basename + (self.suffix || '') + '.js');

    fs.access(file, fs.constants.F_OK, (err) => {
      if (err) {
        file = path.join(dir, basename,
            (self.defaultFile || '_default') + '.js');
        fs.access(file, fs.constants.F_OK, (err) => {
          if (err)
            next();
          else callEndpoint(file);
        });
      } else callEndpoint(file);
    });
    
    function callEndpoint(filename) {
      if (typeof self.onMatch === 'function' && !self.onMatch(filename)) {
        next();
        return;
      }
      try {
        const ep = require(filename);
        if (ep instanceof Endpoint) {
          if (typeof self.onExecute === 'function') {
            if (self.onExecute(filename, ep, req, res)) {
              res.end();
              return;
            }
          }
          ep.handle(req, res);
        } else {
          res.writeHead(400, 'You can not access this resource');
          res.end();
        }
      } catch (e) {
        next();
      }
    }

  }
}

exports = module.exports = DynamicRouter;
