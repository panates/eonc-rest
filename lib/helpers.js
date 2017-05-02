/*!
 * eonc
 * Copyright(c) 2017 Panates Ltd.
 * MIT Licensed
 */


exports = module.exports = {

    parseNS: function (namespace) {
        if (namespace) {
            let a = namespace.match(/^(\w+\:(?!\/))(.+)$/);
            return {
                ns: a ? a[1].toLowerCase().substring(0, a[1].length - 1) : undefined,
                namespace: a ? a[2] : namespace
            }
        } else
            throw new Error("Namespace is required");
    }

};
