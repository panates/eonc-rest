/*!
 * eonc-rest
 * Copyright(c) 2017 Panates Ltd.
 * MIT Licensed
 */

//const handler = require('./core');
const {Callable, CallableEventEmitter} = require('./callable');
const RestHandler = require('./resthandler');
const Endpoint = require('./endpoint');
const schema = require('./schema');
const errors = require('./errors');
const DynamicRouter = require('./dynamicrouter');

function restHandler(cfg) {
  return new RestHandler(cfg);
}

Object.assign(restHandler, {
  Callable,
  CallableEventEmitter,
  RestHandler,
  Endpoint,
  endpoint: function() {
    return new Endpoint();
  },
  DynamicRouter,
  dynamicRouter: function(cfg) {
    return new DynamicRouter(cfg);
  },
  Schema: schema.Schema,
  schema: function(namespace) {
    return new schema.Schema(namespace);
  },
  SchemaItem: schema.SchemaItem,
  errors,
  HttpError: errors.HttpError,
  InvalidRequestError: errors.InvalidRequestError,
  ImplementationError: errors.ImplementationError
});

module.exports = restHandler;
