/*!
 * eonc-rest
 * Copyright(c) 2017 Panates Ltd.
 * MIT Licensed
 */

const {EventEmitter} = require('events');
const helpers = require('./helpers');

/**
 * @class
 */

function Callable(property) {
  const func = this.constructor.prototype[property || '__call__'];
  const apply = function(...args) {
    return func.apply(apply, args);
  };
  Object.setPrototypeOf(apply, this.constructor.prototype);
  Object.getOwnPropertyNames(func).forEach(function(p) {
    Object.defineProperty(apply, p, Object.getOwnPropertyDescriptor(func, p));
  });
  return apply;
}
Callable.prototype = Object.create(Function.prototype);


/**
 * @class
 */

class CallableEventEmitter extends Callable {
  constructor(property) {
    super(property);
  }
}

helpers.extend(CallableEventEmitter.prototype, EventEmitter.prototype);

module.exports = {
  Callable,
  CallableEventEmitter
};
