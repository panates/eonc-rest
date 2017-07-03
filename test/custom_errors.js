/*
 * Tests for custom errors
 */

const assert = require('assert');
const rest = require('..');
const http = require('http');
const request = require('supertest');

describe('Custom errors', function () {

    let app;
    let ep;

    beforeEach(function () {
        app = rest();
        ep = new rest.Endpoint();
    });

    it('should handle ImplementationError', function (done) {

        ep.all(function (req, res) {
            throw new rest.ImplementationError();
        });

        app.use('/blog', ep);

        request(app)
            .get('/blog')
            .expect(500, done);
    });

    it('should handle custom HttpError', function (done) {

        ep.all(function (req, res) {
            throw new rest.HttpError(401);
        });

        app.use('/blog', ep);

        request(app)
            .get('/blog')
            .expect(401, done);
    });

    it('should handle InvalidRequestError', function (done) {

        ep.all(function (req, res) {
            throw new rest.InvalidRequestError();
        });

        app.use('/blog', ep);

        request(app)
            .get('/blog')
            .expect(400, done);
    });

});