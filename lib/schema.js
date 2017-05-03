/*!
 * eonc
 * Copyright(c) 2017 Panates Ltd.
 * MIT Licensed
 */

/**
 * External module dependencies.
 */

const debug = require('debug')('eonc:schema');
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
const numberPattern = /^[\+\-]?\d+(\.)?\d*$/;
const longPattern = /^[\+\-]?(\d+)$/;
const datePattern = helpers.datePattern;

let gSchemas = {};
let gSchemasNS = {};

/**
 * SchemaError class
 *
 * @class
 * @public
 * @extends ImplementationError
 */

class SchemaError extends errors.ImplementationError {
}

/**
 * SchemaNotFoundError class
 *
 * @class
 * @public
 * @extends ImplementationError
 */

class SchemaNotFoundError extends errors.ImplementationError {
}

/**
 * TypeNotFoundError class
 *
 * @class
 * @public
 * @extends ImplementationError
 */

class TypeNotFoundError extends errors.ImplementationError {
}

/**
 * TypeNotFoundError class
 *
 * @class
 * @public
 * @extends ImplementationError
 */

class DeserializeError extends errors.InvalidRequestError {
}

/**
 * Helper functions
 * @private
 */

const parseDate = function (val, name) {
    let d = helpers.parseDate(val);
    if (!d)
        throw new DeserializeError(`Indalid date format for "${name}"`);
    return d;
};

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
            this.ns = a.ns || 'ns' + (Object.keys(gSchemas).length + 1);

            if (gSchemas[a.namespace.toLowerCase()])
                throw new SchemaError(`Shchema for namespace "${a.namespace}" already initialized`);

            if (gSchemasNS[this.ns.toLowerCase()])
                throw new SchemaError(`Shchema for namespace "${this.ns}" already initialized`);

            gSchemasNS[this.ns] = this;
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

        let item = new SchemaItem(name, typeDef);
        let nameKey = item.name.toLowerCase();
        if (this._items[nameKey])
            throw new SchemaError(`${name} already defined${this.namespace ? ' in schema "' + this.namespace + '"' : ''}`);
        this._items[nameKey] = item;
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
     * @param {String} typeName
     * @param {*} input
     * @returns {*}
     * @public
     */
    deserialize(typeName, input) {
        let item = this.get(typeName);
        if (!item)
            throw new TypeNotFoundError(`Type not found "${typeName}"`);
        return item ? item.deserialize(input) : undefined;
    }

    /**
     *
     *
     * @param namespace
     * @return {Schema}
     */
    static get(namespace) {
        let schema;
        if (namespace) {
            if (String(namespace).indexOf(':') >= 0) {
                let m = namespace.match(/([\w]*)\:([\s\S]*)/);
                if (m && m.length >= 3)
                    return Schema.get(m[1]).get(m[2]);
            }
            schema = gSchemasNS[namespace.toLowerCase()] || gSchemas[namespace.toLowerCase()];
        }
        if (!schema)
            throw new SchemaNotFoundError(`Schema not found "${namespace}"`);
        return schema;
    }

}

/**
 * SchemaItem class
 *
 * @class
 * @public
 */

class SchemaItem {

    constructor(name, typeDef) {
        this._assign(name, typeDef);
    }

    /**
     * * Parses type object definition
     *
     * @param {String} name
     * @param {Object|String} typeDef
     * @returns {Object}
     * @private
     */
    _assign(name, typeDef) {

        if (!name || !typeDef)
            throw new SchemaError('"name" and "typeDef" parameters are required');

        this.name = name;

        if (typeof typeDef === "string") {

            this._parseString(typeDef);

        } else {

            this._parseString((typeDef.ns ? typeDef.ns + ":" : "") + typeDef.type);

            if (typeDef.minOccurs !== undefined)
                this.minOccurs = typeDef.minOccurs;
            if (typeDef.maxOccurs !== undefined)
                this.maxOccurs = typeDef.maxOccurs;
            if (typeDef.minSize !== undefined)
                this.minSize = typeDef.minSize;
            if (typeDef.maxSize !== undefined)
                this.maxSize = typeDef.maxSize;
            if (typeDef.minValue !== undefined)
                this.minValue = typeDef.minValue;
            if (typeDef.maxValue !== undefined)
                this.maxValue = typeDef.maxValue;
            if (typeDef.pattern !== undefined)
                this.pattern = typeDef.pattern;
            if (typeDef.optional)
                this.optional = typeDef.optional;
            if (typeDef.onvalidate)
                this.onvalidate = typeDef.onvalidate;
            if (this.type === 'object') {
                let items = typeDef.items;
                if (util.isObject(items)) {
                    this.items = {};
                    Object.getOwnPropertyNames(items).forEach(k => {
                        this.items[k] = new SchemaItem(k, items[k]);
                    });
                } else {
                    this.items = {};
                    if (items) {
                        if (!Array.isArray(items))
                            items = [items];
                        for (let i of items) {
                            let items = i.split(/\s*;\s*/);
                            for (let item of items) {
                                let a = item.match(/([\w]*)\:([\s\S]*)/);
                                if (!a)
                                    throw new SchemaError(`Invalid definition for "${name}"`);
                                if (this.items[a[1]])
                                    throw new SchemaError(`Item ${a[1]} already defined`);
                                this.items[a[1]] = new SchemaItem(a[1], a[2]);
                            }
                        }
                    }
                }
            }
        }
        this.validate();
    }

    /**
     * Parse string definition
     *
     * @param {String} str
     * @static
     * @private
     */
    _parseString(str) {

        let m = str.match(parseStringPattern);
        if (!m)
            throw new SchemaError('Invalid type definition for "' + this.name + '"');

        if (m[1]) this.ns = m[1];
        this.type = m[2];

        // Is optional
        if (m[3])
            this.optional = true;

        // Has size limit or min, max values?
        if (m[4] !== undefined) {
            let typ = this.type.toLowerCase();

            if (typ.match(/^(integer|long|number|double|date)$/)) {
                if (m[5] !== undefined) {
                    this.minValue = m[4];
                    this.maxValue = m[5];
                } else {
                    this.minValue = undefined;
                    this.maxValue = m[4];
                }
            }
            else if (typ === "string") {
                if (m[5] !== undefined) {
                    this.minSize = m[4];
                    this.maxSize = m[5];
                } else {
                    this.minSize = 0;
                    this.maxSize = m[4];
                }
            } else
                throw new SchemaError('Invalid type definition for "' + this.name + '"');
        }

        // Is array?
        if (m[6]) {
            if (m[8] !== undefined) {
                this.minOccurs = m[7];
                this.maxOccurs = m[8];
            } else if (m[7] !== undefined) {
                this.minOccurs = 0;
                this.maxOccurs = m[7];
            } else {
                this.minOccurs = 0;
                this.maxOccurs = undefined;
            }
        }

        // Regex pattern
        if (m[9])
            this.pattern = m[9].substring(1, m[9].length - 1);

    }

    get realType() {
        let typ = this, t2, schema;
        while (internalTypes.indexOf(typ.type) < 0) {
            schema = Schema.get(typ.ns);
            t2 = schema.get(typ.type);
            if (!t2)
                throw new TypeNotFoundError(`Type "${typ.type}" not found in schema`);
            typ = t2;
        }
        return typ.type;
    }

    /**
     * @public
     */

    validate() {

        let typ = this.realType;

        typ = typ.toLowerCase();

        // validate minSize, maxSize
        if (this.minSize !== undefined || this.maxSize !== undefined) {
            if (typ !== "string")
                throw new SchemaError(`Invalid definition for "${this.name}". "minSize" and "maxSize" is only available for string type.`);

            if (this.minSize !== undefined)
                this.minSize = parseInt(this.minSize, 10);
            if (this.maxSize !== undefined)
                this.maxSize = parseInt(this.maxSize, 10);

            if (this.minSize !== undefined && isNaN(this.minSize))
                throw new SchemaError(`Invalid value in "minSize" in parameter "${this.name}"`);
            if (this.maxSize !== undefined && isNaN(this.maxSize))
                throw new SchemaError(`Invalid value in "maxSize" in parameter "${this.name}"`);

            if (this.minSize > this.maxSize)
                throw new SchemaError(`Invalid definition for "${this.name}". "minSize" must be a lower value than "maxSize".`);
        }

        // validate minValue, maxValue
        if (this.minValue !== undefined || this.maxValue !== undefined) {
            if (!typ.match(/^number|integer|long|double|date$/))
                throw new SchemaError(`Invalid definition for "${this.name}". "minValue" and "maxValue" is available for number, integer, long, double and date type.`);

            if (typ.match(/^integer|long$/)) {
                if (this.minValue !== undefined)
                    this.minValue = parseInt(this.minValue, 10);
                if (this.maxValue !== undefined)
                    this.maxValue = parseInt(this.maxValue, 10);

            } else if (typ.match(/^number|double$/)) {
                if (this.minValue !== undefined)
                    this.minValue = parseFloat(this.minValue);
                if (this.maxValue !== undefined)
                    this.maxValue = parseFloat(this.maxValue);
            } else if (typ === "date") {
                if (this.minValue !== undefined)
                    this.minValue = parseDate(this.minValue, this.name + "/minValue");
                if (this.maxValue !== undefined)
                    this.maxValue = parseDate(this.maxValue, this.name + "/maxValue");
            }

            if (this.minValue !== undefined && isNaN(this.minValue))
                throw new SchemaError(`Invalid value in "minValue" in parameter "${this.name}"`);
            if (this.maxValue !== undefined && isNaN(this.maxValue))
                throw new SchemaError(`Invalid value in "maxValue" in parameter "${this.name}"`);

            if (this.minValue !== undefined && this.maxValue !== undefined && this.minValue > this.maxValue)
                throw new SchemaError(`Invalid definition for "${this.name}". "minValue" must be a lower value than "maxValue".`);
        }

        if (this.minOccurs !== undefined)
            this.minOccurs = parseInt(this.minOccurs, 10);
        if (this.maxOccurs !== undefined)
            this.maxOccurs = parseInt(this.maxOccurs, 10);

        if (this.minOccurs !== undefined && isNaN(this.minOccurs))
            throw new SchemaError(`Invalid value in "minOccurs" in parameter "${this.name}"`);
        if (this.maxOccurs !== undefined && isNaN(this.maxOccurs))
            throw new SchemaError(`Invalid value in "maxOccurs" in parameter "${this.name}"`);

        if (this.minOccurs !== undefined && this.maxOccurs !== undefined && this.minOccurs > this.maxOccurs)
            throw new SchemaError(`Invalid definition for "${this.name}". "minOccurs" must be a lower value than "maxOccurs".`);

        if (this.optional !== undefined)
            this.optional = !!this.optional;

        if (this.onvalidate && typeof this.onvalidate !== "function")
            throw new SchemaError(`Invalid definition for "${this.name}". "onvalidate" have to be a function.`);

        // validate regex pattern
        if (this.pattern) {
            try {
                if (!(this.pattern instanceof RegExp))
                    this.pattern = new RegExp(this.pattern);
            } catch (e) {
                throw new SchemaError(`Invalid regular expression for "${this.name}"`);
            }
        }
    }

    /**
     * Deserialize input value to JS
     *
     * @param {*} input
     * @returns {*}
     * @public
     */
    deserialize(input) {
        let merged = this._merge(),
            out;

        if (this.minOccurs !== undefined || this.maxOccurs !== undefined) {
            if (this.minOccurs && input.length < this.minOccurs)
                throw new DeserializeError('"' + this.name + '" must have minimum ' + this.minOccurs + ' sub values');
            if (this.maxOccurs && input.length > this.maxOccurs)
                throw new DeserializeError('"' + this.name + '" can have maximum ' + this.maxOccurs + ' sub values');
            out = [];
            if (util.isArray(input)) {
                for (let i = 0; i < input.length; i++) {
                    out.push(this._deserialize(merged, input[i]));
                }
            } else out.push(this._deserialize(merged, input));
        } else
            out = this._deserialize(merged, input);



        return out;
    }

    /**
     * Deserialize input value to JS
     *
     * @param {Object} typeObj
     * @param {*} input
     * @returns {*}
     * @public
     */
    _deserialize(typeObj, input) {

        let out;
        if (input) {
            switch (typeObj.type) {
                case "any":
                    out = input;
                    break;
                case "string":
                    out = String(input);
                    break;
                case "boolean":
                    out = (String(input).toLowerCase() === "true") || (String(input) === "1");
                    break;
                case "number":
                case "double": {
                    if (!String(input).match(numberPattern))
                        throw new DeserializeError(`Invalid ${typeObj.type} value "${input}"`);
                    out = parseFloat(input);
                    break;
                }
                case "long":
                case "integer": {
                    if (!String(input).match(longPattern))
                        throw new DeserializeError(`Invalid ${typeObj.type} value "${input}"`);
                    out = parseInt(input, 10);
                    break;
                }
                case "date": {
                    out = parseDate(input, typeObj.name);
                    if (!out)
                        throw new DeserializeError(`Invalid date value ${input}`);
                    break;
                }
                case "object": {
                    if (!util.isObject(input))
                        input = jsonic(input);
                    if (typeObj.items) {
                        out = {};
                        Object.getOwnPropertyNames(typeObj.items).forEach(name => {
                            let ti = typeObj.items[name],
                                val = input[ti.name];
                            out[name] = ti.deserialize(val);
                        });
                    } else out = input;
                    break;
                }
            }

            if (typeObj.onvalidate)
                out = typeObj.onvalidate(typeObj, out);
        }

        if (!typeObj.optional && (out === undefined || out === null || out === ''))
            throw new DeserializeError(`Parameter "${typeObj.name}" is required`);

        if (out) {

            // Validate pattern
            if (typeObj.pattern && !String(out).match(typeObj.pattern))
                throw new DeserializeError(`Input value does not match given pattern`);

            // Validate min/max value
            switch (typeObj.type) {
                case "number":
                case "double":
                case "long":
                case "integer":
                case "date": {
                    if (typeObj.minValue !== undefined && out < typeObj.minValue)
                        throw new DeserializeError(`${this.name} should be at least ${typeObj.minValue}`);
                    if (typeObj.maxValue !== undefined && out > typeObj.maxValue)
                        throw new DeserializeError(`${this.name} should be no more than ${typeObj.maxValue}`);
                    break;
                }
                case "string": {
                    if (typeObj.minSize !== undefined && out.length < typeObj.minSize)
                        throw new DeserializeError(`${this.name} must be at least ${typeObj.minSize} characters`);
                    if (typeObj.maxSize !== undefined && out.length > typeObj.maxSize)
                        throw new DeserializeError(`${this.name} must be a maximum of ${typeObj.minSize} characters`);
                    break;
                }
            }
        }
        return out;
    }

    _merge() {
        let typ = this, t2, schema, out = {};

        while (typ) {
            out.type = typ.type.toLowerCase();
            let fields = ["pattern", "minSize", "maxSize", "minOccurs", "maxOccurs", "minValue", "maxValue", "optional", "onvalidate"], field;
            for (let i = 0; i < fields.length; i++) {
                field = fields[i];
                if (out[field] === undefined && typ[field] !== undefined)
                    out[field] = typ[field];
            }
            if (typ.items) {
                out.items = out.items || {};
                Object.assign(out.items, typ.items);
            }
            if (internalTypes.indexOf(typ.type) < 0) {
                schema = Schema.get(typ.ns);
                typ = schema.get(typ.type);
            } else return out;
        }
        return out;
    }


}

/**
 * Module exports.
 * @public
 */

/**
 * Module exports.
 * @public
 */

exports = module.exports = {
    Schema: Schema,
    SchemaItem: SchemaItem
};