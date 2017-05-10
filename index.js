/*!
 * eonc-rest
 * Copyright(c) 2017 Panates Ltd.
 * MIT Licensed
 */

'use strict';

const server = require('./lib/server');
const Endpoint = require('./lib/endpoint');
const schema = require('./lib/schema');
const errors = require('./lib/errors');
const DynamicRouter = require('./lib/dynamicrouter');

exports = module.exports = {
    server: server,
    Endpoint: Endpoint,
    endpoint: function () {
        return new Endpoint();
    },
    DynamicRouter: DynamicRouter,
    dynamicRouter: function (cfg) {
        return new DynamicRouter(cfg);
    },
    Schema: schema.Schema,
    schema: function (namespace) {
        return new schema.Schema(namespace);
    },
    SchemaItem: schema.SchemaItem,
    errors: errors,
    HttpError: errors.HttpError,
    InvalidRequestError: errors.InvalidRequestError,
    ImplementationError: errors.ImplementationError
};