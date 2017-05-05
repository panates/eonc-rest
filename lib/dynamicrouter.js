/*!
 * eonc
 * Copyright(c) 2017 Panates Ltd.
 * MIT Licensed
 */

/**
 * External module dependencies.
 */

const util = require('util');
const url = require('url');
const fs = require('fs');
const path = require('path');
const debug = require('debug')('eonc:dynrouter');

/**
 * Internal module dependencies.
 */
const errors = require('./errors');
const Endpoint = require('./endpoint');

/**
 * Create a new DynamicRouter handler
 *
 * @return {function}
 * @public
 */

class DynamicRouter {

    constructor(cfg) {
        this.suffix = ".js";
        this.localDir = "./";
        if (util.isObject(cfg))
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
        if (cfg.filter !== undefined)
            this.filter = cfg.filter;
    }

    /**
     * Handle server requests, punting them down
     * the middleware stack.
     *
     * @private
     */

    handle(req, res, next) {

        let pt = url.parse(req.url).pathname;
        let dir = path.join((this.localDir), path.dirname(pt));
        let filename = (this.prefix || '') + path.basename(pt) + (this.suffix || '');

        filename = path.join(dir, filename);

        if (!path.isAbsolute(filename))
            filename = path.join(path.dirname(require.main.filename), filename);


        if (typeof this.filter === 'function' && !this.filter(filename)) {
            next();
            return;
        }

        fs.access(filename, fs.constants.R_OK, (err) => {
            if (err) {
                next();
            } else {
                let ep = require(filename);
                if (!(ep instanceof Endpoint)) {
                    res.writeHead(400, 'You can not access this resource');
                    res.end();
                } else
                    ep.handle(req, res);
            }
        });
    }

}

/**
 * Module exports.
 * @public
 */

exports = module.exports = DynamicRouter;