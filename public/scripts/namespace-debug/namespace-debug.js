'use strict';
var _this = this;
if (typeof module !== 'undefined' && module.exports) {
    _this = global;
}
if (typeof _this.namespace == 'undefined') {
    _this.namespace = new Object();
}
var namespace = _this.namespace;
if (typeof namespace.debug == 'undefined') {
    namespace.debug = new Object();
}
if (typeof namespace.__ == 'undefined') {
    namespace.__ = new Object();
}
namespace.__.DEBUG = {};
namespace.__.DEBUG.autoId = 0;
HTMLElement.prototype.removeDebugId = function () {
    let _this = this;
    let ATTR_NAME = 'debug-id';
    return _this.removeAttribute(ATTR_NAME);
};
HTMLElement.prototype.setDebugId = function (value) {
    let _this = this;
    let ATTR_NAME = 'debug-id';
    return _this.setAttribute(ATTR_NAME, value);
};
HTMLElement.prototype.hasDebugId = function () {
    let _this = this;
    let ATTR_NAME = 'debug-id';
    if (_this.hasAttribute(ATTR_NAME)) {
        return true;
    }
    return false;
};
HTMLElement.prototype.removeDebugClass = function (value) {
    let _this = this;
    let ATTR_NAME = 'debug-class';
    return _this.removeDataClass(ATTR_NAME, value);
};
HTMLElement.prototype.addDebugClass = function (value) {
    let _this = this;
    let ATTR_NAME = 'debug-class';
    return _this.addDataClass(ATTR_NAME, value);
};
HTMLElement.prototype.hasDebugClass = function (value) {
    let _this = this;
    let ATTR_NAME = 'debug-class';
    return _this.hasDataClass(ATTR_NAME, value);
};
EventTarget.prototype._addEventListener = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function () {
    let _this = this;
    EventTarget.prototype._addEventListener.apply(this, arguments);
    if (_this instanceof HTMLElement && _this.hasDebugId() == false) {
        _this.setDebugId(namespace.__.DEBUG.autoId);
        namespace.__.DEBUG.autoId++;
    }
};
