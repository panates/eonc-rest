/*
 * Tests for endpoints
 */

const assert = require('assert');
const rest = require('..');
const SchemaItem = rest.SchemaItem;

const internalTypes = ["any", "string", "number", "integer", "long", "double", "boolean", "date", "object"];


describe('SchemaItem', function () {

    describe('Define internal types from string', function () {

        let item;

        it('should set name correctly', function (done) {
            item = new SchemaItem("name", "long");
            assert.equal(item.name, "name");
            done();
        });

        it('should not create without name', function (done) {
            let ok;
            try {
                item = new SchemaItem("", "long");
            } catch (e) {
                ok = true;
            }
            assert.ok(ok);
            done();
        });

        it('should not create with invalid string definition', function (done) {
            let ok;
            try {
                item = new SchemaItem("", "string+@");
            } catch (e) {
                ok = true;
            }
            assert.ok(ok);
            done();
        });

        for (let i = 0; i < internalTypes.length; i++) {
            it('should define internal "' + internalTypes[i] + '" types', function (done) {
                item = new SchemaItem("name", internalTypes[i]);
                assert.equal(item.type, internalTypes[i]);
                done();
            });
        }

    });

    describe('Define flags from string', function () {

        let item;

        it('should define "optional" flag', function (done) {
            item = new SchemaItem("name", "long?");
            assert.equal(item.optional, true);
            done();
        });

        it('should define minSize / maxSize for "string" type', function (done) {
            item = new SchemaItem("name", "string(1-5)");
            assert.ok(item.minSize === 1 && item.maxSize === 5);
            item = new SchemaItem("name", "string(5)");
            assert.ok(item.minSize === 0 && item.maxSize === 5);
            item = new SchemaItem("name", "string()");
            assert.ok(item.minSize === undefined && item.maxSize === undefined);
            done();
        });

        it('should define minValue / maxValue for "number|integer" types', function (done) {
            item = new SchemaItem("name", "number(1-5)");
            assert.ok(item.minValue === 1 && item.maxValue === 5);
            item = new SchemaItem("name", "number(5)");
            assert.ok(item.minValue === undefined && item.maxValue === 5);
            item = new SchemaItem("name", "number()");
            assert.ok(item.minValue === undefined && item.maxValue === undefined);
            done();
        });

        it('should define minValue / maxValue for "date" type', function (done) {
            let d1 = new Date(2017,0,1, 0,0,0,0).getTime();
            let d2 = new Date(2018,0,1, 0,0,0,0).getTime();
            item = new SchemaItem("name", "date(20170101-20180101)");
            assert.ok(item.minValue.getTime() === d1 && item.maxValue.getTime() === d2);
            item = new SchemaItem("name", "date(20180101)");
            assert.ok(item.minValue === undefined && item.maxValue.getTime() === d2);
            item = new SchemaItem("name", "date()");
            assert.ok(item.minValue === undefined && item.maxValue === undefined);
            done();
        });

        it('should define minOccurs / maxOccurs for array', function (done) {
            item = new SchemaItem("name", "string[1-5]");
            assert.ok(item.minOccurs === 1 && item.maxOccurs === 5);
            item = new SchemaItem("name", "string[5]");
            assert.ok(item.minOccurs === 0 && item.maxOccurs === 5);
            item = new SchemaItem("name", "string[]");
            assert.ok(item.minOccurs === 0 && item.maxOccurs === undefined);
            done();
        });

        it('should define regex pattern', function (done) {
            item = new SchemaItem("name", "long"+/\d{3}/);
            assert.ok(!!"123".match(item.pattern));
            //assert.ok(!"1234".match(item.pattern));
            done();
        });

    });

});