/*!
 * eonc-rest
 * Copyright(c) 2017 Panates Ltd.
 * MIT Licensed
 */

/**
 * Module variables.
 * @private
 */

const yearFirstDatePattern = /^(19\d{2}|20\d{2})(?:[-/])?(1[012]|0[0-9])(?:[-/])?(3[01]|[0-2][0-9])(?:[ T])?(?:(2[0-3]|[0-1][0-9])(?::)?([0-5][0-9])(?::)?([0-5][0-9])?(?:\.)?(\d{1,3})?(Z|([+-])(2[0-3]|[0-1][0-9])(?::)?([0-5][0-9])?)?)?$/;
const dayFirstDatePattern = /^(3[01]|[0-2][0-9])(?:.)(1[012]|0[0-9])(?:.)(19\d{2}|20\d{2})(?: )?(?:(2[0-3]|[0-1][0-9])(?::)?([0-5][0-9])(?::)?([0-5][0-9])?(?:\.)?(\d{1,3})?(Z|([+-])(2[0-3]|[0-1][0-9])(?::)?([0-5][0-9])?)?)?$/;
const monthFirstDatePattern = /^(1[012]|0[0-9])(?:.)(3[01]|[0-2][0-9])(?:.)(19\d{2}|20\d{2})(?: )?(?:(2[0-3]|[0-1][0-9])(?::)?([0-5][0-9])(?::)?([0-5][0-9])?(?:\.)?(\d{1,3})?(Z|([+-])(2[0-3]|[0-1][0-9])(?::)?([0-5][0-9])?)?)?$/;

exports = module.exports = {

  extend(target, ...sources) {
    sources.forEach((source) => {
      Object.keys(source).forEach(function(key) {
        target[key] = source[key];
      });
    });
    return target;
  },

  datePattern: yearFirstDatePattern,

  parseNS: function(namespace) {
    if (namespace) {
      const a = namespace.match(/^(\w+:(?!\/))(.+)$/);
      return {
        ns: a ? a[1].toLowerCase().substring(0, a[1].length - 1) : undefined,
        namespace: a ? a[2] : namespace
      };
    } else
      throw new Error('Namespace is required');
  },

  parseDate: function(val) {
    if (val instanceof Date) return val;
    val = String(val);

    if (val.indexOf('.') === 2) { // dd.mm.yyyy format
      const m = String(val).match(dayFirstDatePattern);
      if (m) {
        if (m[8]) {
          let utcdate = Date.UTC(parseInt(m[3]), parseInt(m[2]) - 1,
              parseInt(m[1]),
              parseInt(m[4]) || 0, parseInt(m[5]) || 0, parseInt(m[6]) || 0,
              parseInt(m[7]) || 0);
          if (m[10] && m[11]) {
            const offsetMinutes = parseInt(m[10]) * 60 + parseInt(m[11]);
            utcdate += (m[9] === '+' ? -1 : +1) * offsetMinutes * 60000;
          }
          return new Date(utcdate);
        } else {
          return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]),
              parseInt(m[4]) || 0, parseInt(m[5]) || 0, parseInt(m[6]) || 0,
              parseInt(m[7]) || 0
          );
        }
      }
    } else if (val.indexOf('/') === 2) { // mm/dd/yyyy format
      const m = String(val).match(monthFirstDatePattern);
      if (m) {
        if (m[8]) {
          let utcdate = Date.UTC(parseInt(m[3]), parseInt(m[1]) - 1,
              parseInt(m[2]),
              parseInt(m[4]) || 0, parseInt(m[5]) || 0, parseInt(m[6]) || 0,
              parseInt(m[7]) || 0);
          if (m[10] && m[11]) {
            const offsetMinutes = parseInt(m[10]) * 60 + parseInt(m[11]);
            utcdate += (m[9] === '+' ? -1 : +1) * offsetMinutes * 60000;
          }
          return new Date(utcdate);
        } else {
          return new Date(parseInt(m[3]), parseInt(m[1]) - 1, parseInt(m[2]),
              parseInt(m[4]) || 0, parseInt(m[5]) || 0, parseInt(m[6]) || 0,
              parseInt(m[7]) || 0
          );
        }
      }
    } else {
      const m = String(val).match(yearFirstDatePattern);
      if (m) {
        if (m[8]) {
          let utcdate = Date.UTC(parseInt(m[1]), parseInt(m[2]) - 1,
              parseInt(m[3]),
              parseInt(m[4]) || 0, parseInt(m[5]) || 0, parseInt(m[6]) || 0,
              parseInt(m[7]) || 0);
          if (m[10] && m[11]) {
            const offsetMinutes = parseInt(m[10]) * 60 + parseInt(m[11]);
            utcdate += (m[9] === '+' ? -1 : +1) * offsetMinutes * 60000;
          }
          return new Date(utcdate);
        } else {
          return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]),
              parseInt(m[4]) || 0, parseInt(m[5]) || 0, parseInt(m[6]) || 0,
              parseInt(m[7]) || 0
          );
        }
      }
    }
  }

};
