/*!
 * eonc-rest
 * Copyright(c) 2017 Panates Ltd.
 * MIT Licensed
 */

class CustomError extends Error {

    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ImplementationError extends CustomError {
}

class HttpError extends CustomError {

    constructor(code, message) {
        super(message);
        this.code = code;
    }
}

class InvalidRequestError extends HttpError {

    constructor(message) {
        super(400, message || "Bad request");
    }
}


/**
 * Module exports.
 * @public
 */

exports.HttpError = HttpError;
exports.ImplementationError = ImplementationError;
exports.InvalidRequestError = InvalidRequestError;