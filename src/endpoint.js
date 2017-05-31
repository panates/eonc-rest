/*!
 * eonc-rest
 * Copyright(c) 2017 Panates Ltd.
 * MIT Licensed
 */

/**
 * External module dependencies.
 */

const url = require('url');
const debug = require('debug')('eonc:endpoint');

/**
 * Internal module dependencies.
 */
const errors = require('./errors');
const {Schema} = require('./schema');

/**
 * Endpoint class
 *
 * @class
 * @public
 */

class Endpoint {

  constructor() {
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
  }

  /**
   * Sets handler for HTTP GET method
   *
   * @param {String|String[]|Object} inputTypeDef Definition for input parameters
   * @param {Function} [handler]
   * @return {Endpoint} for chaining
   * @public
   */
  GET(inputTypeDef, handler) {
    this.setHandler('GET', inputTypeDef, handler);
  }

  /**
   * Sets handler for HTTP PATCH method
   *
   * @param {String|String[]|Object} inputTypeDef Definition for input parameters
   * @param {Function} [handler]
   * @return {Endpoint} for chaining
   * @public
   */
  PATCH(inputTypeDef, handler) {
    this.setHandler('PATCH', inputTypeDef, handler);
  }

  /**
   * Sets handler for HTTP POST method
   *
   * @param {String|String[]|Object} inputTypeDef Definition for input parameters
   * @param {Function} [handler]
   * @return {Endpoint} for chaining
   * @public
   */
  POST(inputTypeDef, handler) {
    this.setHandler('POST', inputTypeDef, handler);
  }

  /**
   * Sets handler for HTTP PUT method
   *
   * @param {String|String[]|Object} inputTypeDef Definition for input parameters
   * @param {Function} [handler]
   * @return {Endpoint} for chaining
   * @public
   */
  PUT(inputTypeDef, handler) {
    this.setHandler('PUT', inputTypeDef, handler);
  }

  /**
   * Sets handler for HTTP DELETE method
   *
   * @param {String|String[]|Object} inputTypeDef Definition for input parameters
   * @param {Function} [handler]
   * @return {Endpoint} for chaining
   * @public
   */
  DELETE(inputTypeDef, handler) {
    this.setHandler('DELETE', inputTypeDef, handler);
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
        items: inputTypeDef,
      });
    } else
      this._types.define(method, 'any');

    this._handlers[method] = {
      method: method,
      handler: handler,
    };
    return this;
  }

  /**
   * Handler function http request
   *
   * @param {Object} req Http request object
   * @param {Object} res Http response object
   * @public
   */
  handle(req, res) {
    let method = req.method;
    let layer = this._handlers[method] || this._handlers['ALL'];
    if (layer && layer.handler) {
      try {
        let query = url.parse(req.url, true).query;
        req.params = this._types.deserialize(layer.method, query);
        // call handler
        layer.handler(req, res);
      } catch (e) {
        res.statusCode = (e instanceof errors.HttpError ? e.code : 500) || 400;
        res.statusMessage = e.message;
        res.end();
      }
    } else {
      res.statusCode = 400;
      res.statusMessage = 'Invalid request. This endpoint can`t handle HTTP ' +
          req.method + ' method';
      res.end();
    }
    if (res.statusCode >= 400 && res.statusCode < 500)
      debug('W: %s | %s - %s', this.fullRoute, res.statusCode,
          res.statusMessage);
    else if (res.statusCode >= 500 && res.statusCode < 600)
      debug('E: %s | %s - %s', this.fullRoute, res.statusCode,
          res.statusMessage);
  }

}

/**
 * Module exports.
 * @public
 */

exports = module.exports = Endpoint;