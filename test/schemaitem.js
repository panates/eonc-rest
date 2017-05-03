/*
 * Tests for endpoints
 */

const assert = require('assert');
const rest = require('..');
const SchemaItem = rest.SchemaItem;

const internalTypes = ["any", "string", "number", "integer", "long", "double", "boolean", "date", "object"];


describe('SchemaItem', function () {

    let item;

    describe('Define internal types from string', function () {

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
                item = new SchemaItem("a", "string+@");
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

    describe('Define type from string', function () {

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
            let d1 = new Date(2017, 0, 1, 0, 0, 0, 0).getTime();
            let d2 = new Date(2018, 0, 1, 0, 0, 0, 0).getTime();
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
            item = new SchemaItem("name", "long" + /^\d{3}$/);
            assert.ok(!!"123".match(item.pattern) && !"1234".match(item.pattern));
            done();
        });

        it('should not use () for unsupported types', function (done) {
            let ok;
            try {
                item = new SchemaItem("name", "boolean(1-5)");
            } catch (e) {
                ok = true;
            }
            assert.ok(ok);
            done();
        });

        it('should use minSize and maxSize for "string" only', function (done) {
            let ok;
            try {
                item = new SchemaItem("name",
                    {
                        type: "long",
                        minSize: 1,
                        maxSize: 5
                    });
            } catch (e) {
                ok = true;
            }
            assert.ok(ok);
            done();
        });

        it('should use minValue and maxValue for "number|double|integer|long|date" only', function (done) {
            let ok;
            try {
                item = new SchemaItem("name",
                    {
                        type: "string",
                        minValue: 1,
                        maxValue: 5
                    });
            } catch (e) {
                ok = true;
            }
            assert.ok(ok);
            done();
        });

    });

    describe('Define type from object', function () {

        it('should define "type"', function (done) {
            item = new SchemaItem("name", {
                type: "date"
            });
            assert.ok(item.type === "date");
            done();
        });

        it('should define "optional"', function (done) {
            item = new SchemaItem("name", {
                type: "date",
                optional: true
            });
            assert.ok(item.optional === true);
            done();
        });

        it('should define "minSize" and "maxSize"', function (done) {
            item = new SchemaItem("name", {
                type: "string",
                minSize: 1,
                maxSize: 5,
            });
            assert.ok(item.type === "string"
                && item.minSize === 1
                && item.maxSize === 5);
            done();
        });

        it('should check "minSize" < "maxSize"', function (done) {
            let ok;
            try {
                item = new SchemaItem("name", {
                    type: "string",
                    minSize: 5,
                    maxSize: 1,
                });
            } catch (e) {
                ok = true;
            }
            assert.ok(ok);
            done();
        });

        it('should define "minValue" and "maxValue"', function (done) {
            item = new SchemaItem("name", {
                type: "long",
                minValue: 1,
                maxValue: 5,
            });
            assert.ok(item.type === "long"
                && item.minValue === 1
                && item.maxValue === 5);
            done();
        });

        it('should check "minValue" < "maxValue"', function (done) {
            let ok;
            try {
                item = new SchemaItem("name", {
                    type: "long",
                    minValue: 5,
                    maxValue: 1,
                });
            } catch (e) {
                ok = true;
            }
            assert.ok(ok);
            done();
        });

        it('should define "minOccurs" and "maxOccurs"', function (done) {
            item = new SchemaItem("name", {
                type: "object",
                minOccurs: 0,
                maxOccurs: 10,
            });
            assert.ok(item.minOccurs === 0 && item.maxOccurs === 10);
            done();
        });

        it('should check "minOccurs" < "maxOccurs"', function (done) {
            let ok;
            try {
                item = new SchemaItem("name", {
                    type: "string",
                    minOccurs: 5,
                    maxOccurs: 1,
                });
            } catch (e) {
                ok = true;
            }
            assert.ok(ok);
            done();
        });

        it('should define "pattern"', function (done) {
            item = new SchemaItem("name", {
                type: "long",
                pattern: /^\d{3}$/
            });
            assert.ok(!!"123".match(item.pattern) && !"1234".match(item.pattern));
            done();
        });

        it('should define "onvalidate"', function (done) {
            item = new SchemaItem("name", {
                type: "long",
                onvalidate: function () {
                }
            });
            assert.ok(typeof item.onvalidate === "function");
            done();
        });

        it('should check "onvalidate" is function', function (done) {
            let ok;
            try {
                item = new SchemaItem("name", {
                    type: "long",
                    onvalidate: "string"
                });
            } catch (e) {
                ok = true;
            }
            assert.ok(ok);
            done();
        });

        it('should check "pattern" is valid', function (done) {
            let ok;
            try {
                item = new SchemaItem("name", {
                    type: "long",
                    pattern: /+/
                });
            } catch (e) {
                ok = true;
            }
            assert.ok(ok);
            done();
        });


    });

    describe('Deserialize', function () {

        it('should deserialize "any"', function (done) {
            item = new SchemaItem("name", "any");
            let d = new Date();
            assert.ok(item.deserialize(12345) === 12345
                && item.deserialize(d) === d
                && item.deserialize("12345") === "12345");
            done();
        });

        it('should deserialize "boolean"', function (done) {
            item = new SchemaItem("name", "boolean");
            let d = new Date();
            assert.ok(item.deserialize(true) === true
                && item.deserialize(1) === true
                && item.deserialize("true") === true
                && item.deserialize("True") === true);
            done();
        });

        it('should deserialize "string"', function (done) {
            item = new SchemaItem("name", "string");
            let d = new Date();
            assert.ok(item.deserialize(12345) === "12345"
                && item.deserialize(d) === String(d)
                && item.deserialize("12345") === "12345");
            done();
        });

        it('should deserialize "number|double"', function (done) {
            item = new SchemaItem("name", "number");
            assert.ok(item.deserialize(1234.5) === 1234.5
                && item.deserialize("1234.5") === 1234.5);
            done();
        });

        it('should deserialize "integer|long"', function (done) {
            item = new SchemaItem("name", "long");
            assert.ok(item.deserialize(1234) === 1234
                && item.deserialize("12345") === 12345);
            done();
        });

        it('should deserialize "date" | 20170125', function (done) {
            item = new SchemaItem("name", "date");
            assert.deepEqual(item.deserialize("20170125"), new Date(2017, 0, 25, 0, 0, 0, 0));
            done();
        });

        it('should deserialize "date" | 201701251030', function (done) {
            item = new SchemaItem("name", "date");
            assert.deepEqual(item.deserialize("201701251030"), new Date(2017, 0, 25, 10, 30, 0, 0));
            done();
        });

        it('should deserialize "date" | 20170125103045', function (done) {
            item = new SchemaItem("name", "date");
            assert.deepEqual(item.deserialize("20170125103045"), new Date(2017, 0, 25, 10, 30, 45, 0));
            done();
        });

        it('should deserialize "date" | 20170125103045100', function (done) {
            item = new SchemaItem("name", "date");
            assert.deepEqual(item.deserialize("20170125103045100"), new Date(2017, 0, 25, 10, 30, 45, 100));
            done();
        });

        it('should deserialize "date" | 2017-01-25 10:30:45.100', function (done) {
            item = new SchemaItem("name", "date");
            assert.deepEqual(item.deserialize("2017-01-25 10:30:45.100"), new Date(2017, 0, 25, 10, 30, 45, 100));
            done();
        });

        it('should deserialize "date" | 2017/01/25 10:30:45.100', function (done) {
            item = new SchemaItem("name", "date");
            assert.deepEqual(item.deserialize("2017-01-25 10:30:45.100"), new Date(2017, 0, 25, 10, 30, 45, 100));
            done();
        });

        it('should deserialize "date" | 2017-01-25T10:30:45.100Z', function (done) {
            item = new SchemaItem("name", "date");
            assert.deepEqual(item.deserialize("2017-01-25T10:30:45.100Z"), new Date(Date.UTC(2017, 0, 25, 10, 30, 45, 100)));
            done();
        });

        it('should deserialize "date" | 2017-01-25T10:30:45.100+01:00', function (done) {
            item = new SchemaItem("name", "date");
            assert.deepEqual(item.deserialize("2017-01-25T10:30:45.100+01:00"), new Date(Date.UTC(2017, 0, 25, 9, 30, 45, 100)));
            done();
        });

        it('should deserialize "date" | 2017-01-25T10:30+01:00', function (done) {
            item = new SchemaItem("name", "date");
            assert.deepEqual(item.deserialize("2017-01-25T10:30+01:00"), new Date(Date.UTC(2017, 0, 25, 9, 30, 0, 0)));
            done();
        });

        it('should deserialize "date" | 25.12.2017', function (done) {
            item = new SchemaItem("name", "date");
            assert.deepEqual(item.deserialize("25.12.2017"), new Date(2017, 11, 25, 0, 0, 0, 0));
            done();
        });

        it('should deserialize "date" | 25.12.2017 10:30', function (done) {
            item = new SchemaItem("name", "date");
            assert.deepEqual(item.deserialize("25.12.2017 10:30"), new Date(2017, 11, 25, 10, 30, 0, 0));
            done();
        });

        it('should deserialize "date" | 25.12.2017 10:30:15.100Z', function (done) {
            item = new SchemaItem("name", "date");
            assert.deepEqual(item.deserialize("25.12.2017 10:30:15.100Z"), new Date(Date.UTC(2017, 11, 25, 10, 30, 15, 100)));
            done();
        });

        it('should deserialize "date" | 25.12.2017 10:30:15.100+01:00', function (done) {
            item = new SchemaItem("name", "date");
            assert.deepEqual(item.deserialize("25.12.2017 10:30:15.100+01:00"), new Date(Date.UTC(2017, 11, 25, 9, 30, 15, 100)));
            done();
        });

        it('should deserialize "date" | 12/25/2017', function (done) {
            item = new SchemaItem("name", "date");
            assert.deepEqual(item.deserialize("12/25/2017"), new Date(2017, 11, 25, 0, 0, 0, 0));
            done();
        });

        it('should deserialize "date" | 12/25/2017 10:30', function (done) {
            item = new SchemaItem("name", "date");
            assert.deepEqual(item.deserialize("12/25/2017 10:30"), new Date(2017, 11, 25, 10, 30, 0, 0));
            done();
        });

        it('should deserialize "date" | 12/25/2017 10:30:15.100Z', function (done) {
            item = new SchemaItem("name", "date");
            assert.deepEqual(item.deserialize("12/25/2017 10:30:15.100Z"), new Date(Date.UTC(2017, 11, 25, 10, 30, 15, 100)));
            done();
        });

        it('should deserialize "date" | 12/25/2017 10:30:15.100+01:00', function (done) {
            item = new SchemaItem("name", "date");
            assert.deepEqual(item.deserialize("12/25/2017 10:30:15.100+01:00"), new Date(Date.UTC(2017, 11, 25, 9, 30, 15, 100)));
            done();
        });

        it('should deserialize "array"', function (done) {
            item = new SchemaItem("name", "long[]");
            let d = new Date();
            assert.deepEqual(item.deserialize("123"), [123]);
            assert.deepEqual(item.deserialize(["123"]), [123]);
            assert.deepEqual(item.deserialize(["1", "2", "3"]), [1, 2, 3]);
            done();
        });

        it('should deserialize explicit "object" ', function (done) {
            item = new SchemaItem("name", "object");
            assert.deepEqual(item.deserialize("{a:1,b:2,c:'c'}"), {a: 1, b: 2, c: 'c'});
            done();
        });

        it('should deserialize implicit "object" ', function (done) {
            item = new SchemaItem("name", {
                type: "object",
                items: {
                    a: "number",
                    b: "long",
                    c: "string"
                }
            });
            assert.deepEqual(item.deserialize("{a:1,b:2,c:'c',d:5}"), {a: 1, b: 2, c: 'c'});
            done();
        });


        it('should validate "number|double" format', function (done) {
            let ok;
            item = new SchemaItem("name", "number");
            try {
                item.deserialize("12abc");
            } catch (e) {
                ok = true
            }
            assert.ok(ok);
            done();
        });

        it('should validate "integer|long" format', function (done) {
            let ok;
            item = new SchemaItem("name", "long");
            try {
                item.deserialize("2.5");
            } catch (e) {
                ok = true
            }
            assert.ok(ok);
            done();
        });


    });


});