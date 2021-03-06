/*!
 * eonc-rest
 * Copyright(c) 2017 Panates Ltd.
 * MIT Licensed
 */

/* External module dependencies. */

const url = require('url');

/* Internal module dependencies. */
const {Callable} = require('./callable');
const {Schema} = require('./schema');
const errors = require('./errors');

/**
 * Endpoint class
 *
 * @class
 * @public
 */

class Endpoint extends Callable {

  constructor() {
    super('handle');
    this._handlers = {};
    this._types = new Schema(this);
  }

  /**
   * Sets handler for all HTTP methods
   *
   * @param {String|String[]|Object} inputTypeDef Definition for input parameters
   * @param {Function} [handler]
   * @return {Endpoint} for chaining
   * @public
   */
  all(inputTypeDef, handler) {
    this.setHandler('ALL', inputTypeDef, handler);
    return this;
  }

  /**
   * Sets handler for HTTP GET method
   *
   * @param {String|String[]|Object} inputTypeDef Definition for input parameters
   * @param {Function} [handler]
   * @return {Endpoint} for chaining
   * @public
   */
  onGet(inputTypeDef, handler) {
    this.setHandler('GET', inputTypeDef, handler);
    return this;
  }

  /**
   * Sets handler for HTTP PATCH method
   *
   * @param {String|String[]|Object} inputTypeDef Definition for input parameters
   * @param {Function} [handler]
   * @return {Endpoint} for chaining
   * @public
   */
  onPatch(inputTypeDef, handler) {
    this.setHandler('PATCH', inputTypeDef, handler);
    return this;
  }

  /**
   * Sets handler for HTTP POST method
   *
   * @param {String|String[]|Object} inputTypeDef Definition for input parameters
   * @param {Function} [handler]
   * @return {Endpoint} for chaining
   * @public
   */
  onPost(inputTypeDef, handler) {
    this.setHandler('POST', inputTypeDef, handler);
    return this;
  }

  /**
   * Sets handler for HTTP PUT method
   *
   * @param {String|String[]|Object} inputTypeDef Definition for input parameters
   * @param {Function} [handler]
   * @return {Endpoint} for chaining
   * @public
   */
  onPut(inputTypeDef, handler) {
    this.setHandler('PUT', inputTypeDef, handler);
    return this;
  }

  /**
   * Sets handler for HTTP DELETE method
   *
   * @param {String|String[]|Object} inputTypeDef Definition for input parameters
   * @param {Function} [handler]
   * @return {Endpoint} for chaining
   * @public
   */
  onDelete(inputTypeDef, handler) {
    this.setHandler('DELETE', inputTypeDef, handler);
    return this;
  }

  /**
   * Sets handler for given HTTP method
   *
   * @param {String} method Http method (GET|PATCH|POST|PUT|DELETE)
   * @param {String|String[]|Object|Function} inputTypeDef Definition for input parameters
   * @param {Function} [handler]
   * @return {Endpoint} for chaining
   * @protected
   */
  setHandler(method, inputTypeDef, handler) {
    if (typeof inputTypeDef === 'function') {
      handler = inputTypeDef;
      inputTypeDef = undefined;
    }

    if (inputTypeDef) {
      this._types.define(method, {
        type: 'object',
        items: inputTypeDef
      });
    } else
      this._types.define(method, 'any');

    this._handlers[method] = {
      method: method,
      handler: handler
    };
    return this;
  }

  /**
   * Handler function http request
   *
   * @param {Object} req Http request object
   * @param {Object} res Http response object
   * @param {Function} next
   * @public
   */
  handle(req, res, next) {
    const self = this;
    req.route = self.route;
    req.fullRoute = self.fullRoute;
    try {
      const method = req.method;
      const layer = this._handlers[method] || this._handlers['ALL'];
      if (layer && layer.handler) {
        const query = url.parse(req.url, true).query;
        req.params = this._types.deserialize(layer.method, query, req);
        // call handler
        const o = layer.handler(req, res);
        if (o && (o instanceof Promise ||
            (typeof o.then === 'function' &&
            typeof o.catch === 'function'))) {
          o.catch(e => {
            next(e instanceof Error ? e : new Error(e));
          });
        }
      } else {
        const err = new errors.HttpError(400, 'Invalid request error. This endpoint can`t handle HTTP ' +
            req.method + ' method');
        next(err);
      }
    } catch (e) {
      next(e instanceof Error ? e : new Error(e));
    }
  }

}

/**
 * Module exports.
 * @public
 */

exports = module.exports = Endpoint;
