/*
 * Tests for custom helpers
 */

const assert = require('assert');
const helpers = require('../src/helpers');

describe('helpers', function () {

    describe('parseNS', function () {

        it('should parse ns and namepsace from string', function (done) {

            let a = helpers.parseNS("ns1:http://any.url.com");
            assert.ok(a.ns === "ns1" && a.namespace === "http://any.url.com")
            done();
        });

        it('should not parse with empty string', function (done) {

            let ok;
            try {
                let a = helpers.parseNS("");
            } catch (e) {
                ok = true;
            }
            assert.ok(ok);
            done();
        });
    });

    describe('parseDate', function () {

        it('should return back if value is instance of Date', function (done) {

            let d = new Date();
            assert.equal(helpers.parseDate(d), d);
            done();
        });

    });


});