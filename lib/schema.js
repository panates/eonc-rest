/*!
 * eonc
 * Copyright(c) 2017 Panates Ltd.
 * MIT Licensed
 */

/**
 * External module dependencies.
 */

const debug = require('debug')('eonc:schema');
const url = require('url');
const util = require('util');
const jsonic = require('jsonic');

/**
 * Internal module dependencies.
 */
const errors = require('./errors');
const helpers = require('./helpers');


/**
 * Module variables.
 * @private
 */

const internalTypes = ["any", "string", "number", "integer", "long", "double", "boolean", "date", "object"];
const parseStringPattern = /^(\w+)?(?:\:)?(?:(\b\w+\b)(\??)(?:\((?:(\d+)(?:-(\d+))?)?\))?)(\[(?:(\d+)(?:-(\d+))?)?\])?(\/[^\/]*\/)?$/;
const datePattern = /^(19\d{2}|20\d{2})(?:\/)?(1[012]|0[0-9])(?:\/)?(3[01]|[0-2][0-9])(?:[\ T])?(?:(2[0-3]|[0-1][0-9])(?:\:)?([0-5][0-9])(?:\:)?([0-5][0-9])?(\.\d{1,3})?)?$/;
const numberPattern = /^\d+(\.)?\d*$/;
const longPattern = /^\d+$/;

let gSchemas = {};
let gSchemasNS = {};


class SchemaError extends errors.ImplementationError {
}

class TypeNotFoundError extends SchemaError {
}

/**
 * Schema class
 *
 * @class
 * @public
 */

class Schema {

    /**
     * @constructor
     * @param {String} namespace A valid namespace url for schema
     * @public
     */

    constructor(namespace) {
        if (namespace && typeof namespace === "string") {
            let a = helpers.parseNS(namespace);
            if (!a.ns)
                a.ns = 'ns' + (Object.keys(gSchemas).length + 1);

            if (gSchemas[a.namespace.toLowerCase()])
                throw new SchemaError(`Shchema for namespace "${a.namespace}" already initialized`);

            if (gSchemasNS[a.ns.toLowerCase()])
                throw new SchemaError(`Shchema for namespace "${a.ns}" already initialized`);

            gSchemas[a.ns] = this;
            gSchemas[a.namespace] = this;
        }
        this._items = {};
    }

    /**
     * Adds type definition to schema. It accepts  object and string for definition.
     *
     * schema.define('field1', {
     *      type: "string",  // field 1 is a string parameter
     *      minSize: 1,      // Min length must be 1
     *      maxSize: 5,      // Max length must be 5
     *      minOccurs: 0,    // It accepts array and 0 items is accepted
     *      maxOccurs: 10,   // Array may contain 10 items max
     *      pattern: /\w+/,  // input string must match given pattern
     *      optional: true,  // field is optional
     *      onvalidate: function(name, val) {    // a callback function will be called after parse
     *          if (val.indexOf('cat')>=0) throw new Error('Meow');
     *          return val + ' validated!';
     *      }
     * });
     *
     * schema.define('field1', "double"); // define field1 as double type
     * schema.define('field2', "string(1-5)[]"); // define field2 as string, length between 1-5 and array
     * schema.define('field3', "number?(0-100)"); // define field3 as number, value between 0-100, optional
     *
     * @param {String} name Name schema item
     * @param {Object} typeDef string representation or object definition
     * @public
     */

    define(name, typeDef) {
        if (!name || !typeDef)
            throw new SchemaError('"name" and "typeDef" parameters are required for method schema.define()');
        let nameKey = name.toLowerCase();
        if (this._items[nameKey])
            throw new SchemaError(`${name} already defined${this.namespace ? ' in schema "' + this.namespace + '"' : ''}`);

        this._items[nameKey] = Schema.parseTypeDef(name, typeDef);
        return this;
    }

    /**
     * Gets the schema item
     *
     * @param name Name of the type item
     * @returns {*}
     * @public
     */
    get(name) {
        return this._items[name.toLowerCase()];
    }

    /**
     * Deserialize input value to JS
     *
     * @param {String|Object} typeDef
     * @param {*} input
     * @returns {*}
     * @public
     */
    deserialize(typeDef, input) {

        if (input === undefined || input === null) return undefined;

        if (util.isObject(typeDef)) {

            let typeKey = typeDef.type.toLowerCase(),
                out;

            switch (typeKey) {
                case "any":
                    out = input;
                    break;
                case "string":
                    out = String(input);
                    break;
                case "boolean":
                    out = (input === "true") || (String(input) === "1");
                    break;
                case "number":
                case "double": {
                    if (!String(input).match(numberPattern))
                        throw new errors.InvalidRequestError(`Invalid ${typeDef.type} value "${input}"`);
                    out = parseFloat(input);
                    break;
                }
                case "long":
                case "integer": {
                    if (!String(input).match(longPattern))
                        throw new errors.InvalidRequestError(`Invalid ${typeDef.type} value "${input}"`);
                    out = parseInt(input);
                    break;
                }
                case "date": {
                    let m = String(input).match(datePattern);
                    if (!m)
                        throw new errors.InvalidRequestError(`Invalid date value ${input}`);
                    out = new Date(parseInt(m[1]), parseInt(m[2]), parseInt(m[3]),
                        m[4] ? parseInt(m[4]) : 0,
                        m[5] ? parseInt(m[5]) : 0,
                        m[6] ? parseInt(m[6]) : 0,
                        m[7] ? parseInt(m[7]) : 0);
                    break;
                }
                case "object": {
                    if (!util.isObject(input))
                        input = jsonic(input);
                    if (typeDef.items) {
                        out = {};
                        Object.getOwnPropertyNames(typeDef.items).forEach(name => {
                            let ti = typeDef.items[name],
                                val = input[ti.name];
                            out[name] = this.deserialize(ti, val);
                        });
                    } else out = input;
                    break;
                }
                default: {
                    let schema = typeDef.ns ? Schema.get(typeDef.ns) : this;
                    if (!schema)
                        throw new SchemaError(`Schema not found for ns "${typeDef.ns}"`);
                    let typeItem = schema.get(typeKey);
                    if (!typeItem)
                        throw new TypeNotFoundError(`Type "${typeDef.type}" not found in schema`);
                    out = typeItem ? this.deserialize(typeItem, input) : input;
                }
            }

            let ti;
            if (typeDef.onvalidate) {
                ti = {};
                Object.assign(ti, typeDef);
                out = typeDef.onvalidate(ti, out);
            } else ti = typeDef;

            if (!ti.optional && (out === undefined || out === null))
                throw new errors.InvalidRequestError(`Parameter "${ti.name}" is required`);

            return out;
        } else {
            let typeKey = typeDef.toLowerCase(),
                typeItem = this.get(typeKey);
            return typeItem ? this.deserialize(typeItem, input) : undefined;
        }
    }

    /**
     *
     *
     * @param namespace
     * @return {Schema}
     */
    static get(namespace) {
        if (!namespace) return undefined;
        let out = gSchemasNS[namespace.toLowerCase()];
        if (!out) {
            let a = helpers.parseNS(namespace);
            out = gSchemas[a.namespace.toLowerCase()];
        }
        return out;
    }

    /**
     *
     * @param {String} name
     * @param {String|Object} typeDef
     * @returns {Object}
     * @private
     */
    static parseTypeDef(name, typeDef) {
        let out = util.isObject(typeDef) ? Schema.parseTypeObject(name, typeDef) : Schema.parseTypeString(name, typeDef);
        if (out.ns) {
            let schema = Schema.get(out.ns);
            if (!(schema && schema.get(out.name)))
                throw new TypeNotFoundError(`Type not found "${out.ns}/${out.name}"`);
        }
        //console.log(out);
        return out;
    }

    /**
     * * Parses type object definition
     *
     * @param name
     * @param typeObj
     * @returns {Object}
     * @private
     */
    static parseTypeObject(name, typeObj) {
        let out = Schema.parseTypeString(name, typeObj.type);
        if (typeObj.ns !== undefined)
            out.ns = typeObj.ns;
        if (typeObj.minOccurs !== undefined)
            out.minOccurs = typeObj.minOccurs;
        if (typeObj.maxOccurs !== undefined)
            out.maxOccurs = typeObj.maxOccurs;
        if (typeObj.minSize !== undefined)
            out.minSize = typeObj.minSize;
        if (typeObj.maxSize !== undefined)
            out.maxSize = typeObj.maxSize;
        if (typeObj.pattern !== undefined)
            out.pattern = typeObj.pattern;
        if (typeObj.optional)
            out.optional = typeObj.optional;
        if (typeObj.onvalidate)
            out.onvalidate = typeObj.onvalidate;
        if (out.type === 'object') {
            let items = typeObj.items;
            if (util.isObject(items)) {
                out.items = {};
                Object.getOwnPropertyNames(items).forEach(k => {
                    out.items[k] = Schema.parseTypeDef(k, items[k]);
                });
            } else {
                out.items = {};
                if (items) {
                    if (!Array.isArray(items))
                        items = [items];
                    for (let i of items) {
                        let items = i.split(/\s*;\s*/);
                        for (let item of items) {
                            let a = item.match(/([\w]*)\:([\s\S]*)/);
                            if (!a)
                                throw new SchemaError(`Invalid definition for "${name}"`);
                            out.items[a[1]] = Schema.parseTypeDef(a[1], a[2]);
                        }
                    }
                }
            }
        }
        return out;
    }

    /**
     * Parses type string definition
     *
     * @param {String} name
     * @param {String} str
     * @static
     * @private
     */
    static parseTypeString(name, str) {
        let out = {name: name};
        if (!str)
            throw new SchemaError('Empty type definition for "' + name + '"');

        let m = str.match(parseStringPattern);
        if (!m)
            throw new SchemaError('Invalid type definition for "' + name + '"');

        if (m[1]) out.ns = m[1];
        out.type = m[2];

        // Is optional
        if (m[3])
            out.optional = true;

        // Has size limit or min, max values?
        if (m[4]) {
            let prm;
            let typ = out.type.toLowerCase();

            if (typ.match(/^(number|integer|long|double|date)$/)) prm = "Value";
            else if (typ === "string") prm = "Size";
            else throw new SchemaError('Invalid type definition for "' + name + '"');

            if (m[5] !== undefined) {
                out['min' + prm] = parseInt(m[4]);
                out['max' + prm] = parseInt(m[5]);
            } else {
                out['min' + prm] = 0;
                out['max' + prm] = parseInt(m[5]);
            }
        }

        // Is array?
        if (m[6]) {
            if (m[7] !== undefined) {
                out.minOccurs = parseInt(m[7]);
                out.maxOccurs = parseInt(m[8]);
            } else {
                out.minOccurs = 0;
                let v = m[7] ? parseInt(m[7]) : undefined;
                if (v)
                    out.maxOccurs = m[7] ? parseInt(m[7]) : -1;
            }
        }

        // Regex pattern
        if (m[9])
            out.pattern = m[9];

        Schema.validate(name, out);
        return out;
    }

    /**
     * Validates type object
     *
     * @param name
     * @param obj
     * @private
     */
    static validate(name, obj) {

        let typ = obj.type;

        // validate type name
        if (!typ)
            throw new SchemaError(`Empty type must be defined for "${name}"`);

        typ = typ.toLowerCase();

        if (internalTypes.indexOf(typ) < 0) {
            let schema = Schema.get(obj.ns);
            if (!(schema && schema.get(typ)))
                throw new SchemaError(`Unknown type "${obj.type}" for "${name}"`);
        }

        // validate minSize, maxSize
        if (obj.minSize !== undefined || obj.maxSize !== undefined) {
            if (typ !== "string")
                throw new SchemaError(`Invalid definition for "${name}". "minSize" and "maxSize" is only available for string type.`);
            if (obj.minSize > obj.maxSize)
                throw new SchemaError(`Invalid definition for "${name}". "minSize" must be a lower value than "maxSize".`);
        }

        // validate minValue, maxValue
        if (obj.minValue !== undefined || obj.maxValue !== undefined) {
            if (!typ.match(/^(number|integer|long|double|date)$/))
                throw new SchemaError(`Invalid definition for "${name}". "minValue" and "maxValue" is available for number, integer, long, double and date type.`);
            if (obj.minValue > obj.maxValue)
                throw new SchemaError(`Invalid definition for "${name}". "minValue" must be a lower value than "maxValue".`);
        }

        // validate regex pattern
        if (obj.pattern) {
            try {
                new RegExp(obj.pattern);
            } catch (e) {
                throw new SchemaError(`Invalid regular expression for "${name}"`);
            }
        }

    }
}

/**
 * Module exports.
 * @public
 */

exports = module.exports = Schema;