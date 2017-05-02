/*!
 * eonc
 * Copyright(c) 2017 Panates Ltd.
 * MIT Licensed
 */

'use strict';

const server = require('./lib/server');
const Endpoint = require('./lib/endpoint');
const schema = require('./lib/schema');
const errors = require('./lib/errors');

exports = module.exports = {
    server: server,
    Endpoint: Endpoint,
    endpoint: function () {
        return new Endpoint();
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