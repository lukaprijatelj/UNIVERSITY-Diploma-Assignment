'use strict';
var _global = this;
if (typeof module !== 'undefined' && module.exports) {
    _global = global;
}
const YES = true;
const NO = false;
const FORCE = true;
const ANIMATE = true;
const INFINITY = Infinity;
if (typeof _global.IS_DEBUG === 'undefined') {
    _global.IS_DEBUG = false;
}
if (typeof _global.IS_CONSOLE_ENABLED === 'undefined') {
    _global.IS_CONSOLE_ENABLED = true;
}
if (typeof _global.CHECK_IF_IDISPOSABLE_IMPLEMENTED === 'undefined') {
    _global.CHECK_IF_IDISPOSABLE_IMPLEMENTED = false;
}
if (typeof _global.IS_NODEJS === 'undefined') {
    _global.IS_NODEJS = (typeof module !== 'undefined' && module.exports) ? true : false;
}
if (typeof _global.IS_WEB_WORKER === 'undefined') {
    _global.IS_WEB_WORKER = (typeof WorkerGlobalScope !== 'undefined') ? true : false;
}
var Exception;
(function (Exception) {
    class NotImplemented {
        constructor(extraMessage) {
            let message = 'Logic is not yet implemented!';
            message += extraMessage ? (' ' + extraMessage) : '';
            throw new Error(message);
        }
    }
    Exception.NotImplemented = NotImplemented;
    class Deprecated {
        constructor(deprecatedProperty, newProperty) {
            let message = '"' + deprecatedProperty + '" is deprecated! Use "' + newProperty + '" instead!';
            throw new Error(message);
        }
    }
    Exception.Deprecated = Deprecated;
    class InputMissing {
        constructor(extraMessage) {
            let message = 'Input is missing!';
            message += extraMessage ? (' ' + extraMessage) : '';
            throw new Error(message);
        }
    }
    Exception.InputMissing = InputMissing;
    class RendererMissing {
        constructor(extraMessage) {
            let message = 'Renderer is missing!';
            message += extraMessage ? (' ' + extraMessage) : '';
            throw new Error(message);
        }
    }
    Exception.RendererMissing = RendererMissing;
    class ArrayEmpty {
        constructor(extraMessage) {
            let message = 'Array is empty!';
            message += extraMessage ? (' ' + extraMessage) : '';
            throw new Error(message);
        }
    }
    Exception.ArrayEmpty = ArrayEmpty;
    class ArrayNotEmpty {
        constructor(extraMessage) {
            let message = 'Array must be empty!';
            message += extraMessage ? (' ' + extraMessage) : '';
            throw new Error(message);
        }
    }
    Exception.ArrayNotEmpty = ArrayNotEmpty;
    class ArgumentUndefined {
        constructor(extraMessage) {
            let message = 'Argument is undefined!';
            message += extraMessage ? (' ' + extraMessage) : '';
            throw new Error(message);
        }
    }
    Exception.ArgumentUndefined = ArgumentUndefined;
    class ArgumentInvalid {
        constructor(value, extraMessage) {
            let message = 'Argument with value "' + value + '" is invalid!';
            message += extraMessage ? (' ' + extraMessage) : '';
            throw new Error(message);
        }
    }
    Exception.ArgumentInvalid = ArgumentInvalid;
    class ValueUndefined {
        constructor(extraMessage) {
            let message = 'Value is undefined!';
            message += extraMessage ? (' ' + extraMessage) : '';
            throw new Error(message);
        }
    }
    Exception.ValueUndefined = ValueUndefined;
    class ValueInvalid {
        constructor(value, extraMessage) {
            let message = 'Value "' + value + '" is invalid!';
            message += extraMessage ? (' ' + extraMessage) : '';
            throw new Error(message);
        }
    }
    Exception.ValueInvalid = ValueInvalid;
    class Disposed {
        constructor(extraMessage) {
            let message = 'Object is already disposed!';
            message += extraMessage ? (' ' + extraMessage) : '';
            throw new Error(message);
        }
    }
    Exception.Disposed = Disposed;
    class Other {
        constructor(message) {
            throw new Error(message);
        }
    }
    Exception.Other = Other;
})(Exception || (Exception = {}));
_global.Exception = Exception;
var Warning;
(function (Warning) {
    class NotImplemented {
        constructor(extraMessage) {
            let message = 'Logic is not yet implemented!';
            message += extraMessage ? (' ' + extraMessage) : '';
            console.warn(message);
        }
    }
    Warning.NotImplemented = NotImplemented;
    class Deprecated {
        constructor(deprecatedProperty, newProperty) {
            let message = '"' + deprecatedProperty + '" is deprecated! Use "' + newProperty + '" instead!';
            console.warn(message);
        }
    }
    Warning.Deprecated = Deprecated;
    class InputMissing {
        constructor(extraMessage) {
            let message = 'Input is missing!';
            message += extraMessage ? (' ' + extraMessage) : '';
            console.warn(message);
        }
    }
    Warning.InputMissing = InputMissing;
    class ArrayEmpty {
        constructor(extraMessage) {
            let message = 'Array is empty!';
            message += extraMessage ? (' ' + extraMessage) : '';
            console.warn(message);
        }
    }
    Warning.ArrayEmpty = ArrayEmpty;
    class ArrayNotEmpty {
        constructor(extraMessage) {
            let message = 'Array must be empty!';
            message += extraMessage ? (' ' + extraMessage) : '';
            console.warn(message);
        }
    }
    Warning.ArrayNotEmpty = ArrayNotEmpty;
    class ValueUndefined {
        constructor(extraMessage) {
            let message = 'Value is undefined!';
            message += extraMessage ? (' ' + extraMessage) : '';
            console.warn(message);
        }
    }
    Warning.ValueUndefined = ValueUndefined;
    class ValueInvalid {
        constructor(value, extraMessage) {
            let message = 'Value "' + value + '" is invalid!';
            message += extraMessage ? (' ' + extraMessage) : '';
            console.warn(message);
        }
    }
    Warning.ValueInvalid = ValueInvalid;
    class NotDisposable {
        constructor(extraMessage) {
            let message = 'Object is not disposable!';
            message += extraMessage ? (' ' + extraMessage) : '';
            console.warn(message);
        }
    }
    Warning.NotDisposable = NotDisposable;
    class Other {
        constructor(message) {
            console.warn(message);
        }
    }
    Warning.Other = Other;
})(Warning || (Warning = {}));
_global.Warning = Warning;
var namespace;
(function (namespace) {
    var core;
    (function (core) {
        class Ajax {
            constructor(url) {
                this.url = '';
                this.timeLapsed = 0;
                this.method = 'POST';
                this.skipJsonStringify = false;
                let _this = this;
                _this.url = url;
            }
            send(data) {
                let _this = this;
                let promise = new Promise((resolve, reject) => {
                    var xhr = new XMLHttpRequest();
                    xhr.open(_this.method, _this.url, true);
                    if (data) {
                        if (_this.skipJsonStringify == false) {
                            xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                            data = JSON.stringify(data);
                        }
                    }
                    xhr.onreadystatechange = function () {
                        if (this.readyState !== 4) {
                            return;
                        }
                        _this.timeLapsed = Date.nowInMiliseconds() - _this.timeLapsed;
                        if (this.status !== 200) {
                            new Warning.Other(String(this.status));
                            reject();
                            return;
                        }
                        resolve(this);
                    };
                    _this.timeLapsed = Date.nowInMiliseconds();
                    xhr.send(data);
                });
                return promise;
            }
        }
        core.Ajax = Ajax;
    })(core = namespace.core || (namespace.core = {}));
})(namespace || (namespace = {}));
_global.Class = (() => {
    var Class = {};
    Class.inherit = function (child, parent) {
        if (Class.isInheriting(child, parent)) {
            new Exception.Other('Object already inherits this class!');
        }
        parent.apply(child);
        Object.defineProperty(child, '__parentClass', {
            writable: true,
            enumerable: false
        });
        child.__parentClass = parent;
    };
    Class.inheritPrototype = function (child, parent) {
        if (Class.isInheritingPrototype(child, parent)) {
            new Exception.Other('Prototype already inherits this class!');
        }
        function tempCtor() {
        }
        ;
        tempCtor.prototype = parent.prototype;
        child.prototype = new tempCtor();
        child.prototype.constructor = child;
        Object.defineProperty(child, '__parentClass', {
            writable: true,
            enumerable: false
        });
        child.__parentClass = parent;
    };
    Class.isInheriting = function (child, parent) {
        if (!child.__parentClass) {
            return false;
        }
        if (child.__parentClass == parent) {
            return true;
        }
        return false;
    };
    Class.isInheritingPrototype = function (child, parent) {
        return Class.isInheriting(child.prototype, parent.prototype);
    };
    return Class;
})();
_global.Interface = (() => {
    var Interface = {};
    Interface.inherit = function (child, parent) {
        if (Interface.isInheriting(child, parent)) {
            new Exception.Other('Object already inherits this interface!');
        }
        if (!child.__interfaces) {
            Object.defineProperty(child, '__interfaces', {
                writable: true,
                enumerable: false
            });
            child.__interfaces = new Array();
        }
        let interfaces;
        if (parent.__interfaces) {
            interfaces = parent.__interfaces.concat(child.__interfaces);
        }
        else {
            interfaces = child.__interfaces;
        }
        interfaces.push(parent);
        parent.apply(child);
    };
    Interface.inheritPrototype = function (child, parent) {
        if (Interface.isInheritingPrototype(child, parent)) {
            new Exception.Other('Prototype already inherits this interface!');
        }
        if (!child.__interfaces) {
            Object.defineProperty(child, '__interfaces', {
                writable: true,
                enumerable: false
            });
            child.__interfaces = new Array();
        }
        let interfaces;
        if (parent.__interfaces) {
            interfaces = parent.__interfaces.concat(child.__interfaces);
        }
        else {
            interfaces = child.__interfaces;
        }
        interfaces.push(parent);
        for (var key in parent.prototype) {
            if (child.prototype.hasOwnProperty(key)) {
                continue;
            }
            if (parent.prototype.hasOwnProperty(key)) {
                child.prototype[key] = parent.prototype[key];
            }
        }
        child.__interfaces = interfaces;
    };
    Interface.isInheriting = function (child, parent) {
        if (!child.__interfaces) {
            return false;
        }
        let interfacesLength = child.__interfaces.length;
        for (let i = 0; i < interfacesLength; i++) {
            if (child.__interfaces[i] == parent) {
                return true;
            }
        }
        return false;
    };
    Interface.isInheritingPrototype = function (child, parent) {
        return Interface.isInheriting(child.prototype, parent.prototype);
    };
    return Interface;
})();
var namespace;
(function (namespace) {
    var core;
    (function (core) {
        class Application {
            constructor(title) {
                this.title = '';
                this.version = new namespace.core.Version();
                this.globals = null;
                let _this = this;
                _this.title = title;
            }
        }
        core.Application = Application;
        class WebApplication extends Application {
            constructor(title) {
                super(title);
            }
        }
        core.WebApplication = WebApplication;
    })(core = namespace.core || (namespace.core = {}));
})(namespace || (namespace = {}));
Array.isEmpty = function (_this) {
    if (_this.length > 0) {
        return false;
    }
    return true;
};
Array.clear = function (_this) {
    _this.length = 0;
};
Array.clone = function (array) {
    if (!array) {
        return null;
    }
    return array.slice();
};
Array.removeAtIndex = function (array, index) {
    if (index < 0 || index >= array.length) {
        return;
    }
    array.splice(index, 1);
};
Array.remove = function (array, element) {
    let index = array.indexOf(element);
    Array.removeAtIndex(array, index);
};
Array.getFirst = function (array) {
    return Array.getAtIndex(array, 0);
};
Array.getLast = function (array) {
    return Array.getAtIndex(array, array.length - 1);
};
Array.getAtIndex = function (array, index) {
    if (array.length == 0) {
        return undefined;
    }
    if (index < 0) {
        new Exception.ValueInvalid('Index must be larger than 0!');
    }
    if (index >= array.length) {
        new Exception.ValueInvalid('Index must be smaller than array size!');
    }
    return array[index];
};
Array.setAtIndex = function (array, element, index) {
    if (array.length == 0) {
        return undefined;
    }
    if (index < 0) {
        new Exception.ValueInvalid('Index must be larger than 0!');
    }
    if (index >= array.length) {
        new Exception.ValueInvalid('Index must be smaller than array size!');
    }
    array[index] = element;
};
Array.contains = function (array, element) {
    let index = array.indexOf(element);
    if (index < 0) {
        return false;
    }
    return true;
};
var EventListener = function (value) {
    this.value = value ? value : Function.empty;
};
var OneTimeEventListener = function (value) {
    this.value = value ? value : Function.empty;
};
OneTimeEventListener.attach = function (evt, listener) {
    if (!listener) {
        new Warning.ValueUndefined();
        return;
    }
    let _this = evt;
    if (EventListener.isAttached(_this, listener) == true) {
        new Warning.Other('Cannot add handler function that already exists! (aborting)');
        return;
    }
    _this._handlers.push(new OneTimeEventListener(listener));
};
EventListener.attach = function (evt, listener) {
    if (!listener) {
        new Warning.ValueUndefined();
        return;
    }
    let _this = evt;
    if (EventListener.isAttached(_this, listener) == true) {
        new Warning.Other('Cannot add handler function that already exists! (aborting)');
        return;
    }
    _this._handlers.push(new EventListener(listener));
};
EventListener.isAttached = function (evt, listener) {
    if (!listener) {
        new Warning.ValueUndefined();
        return;
    }
    let _this = evt;
    let handlersLength = _this._handlers.length;
    for (var i = 0; i < handlersLength; i++) {
        var eventHandler = _this._handlers[i];
        if (eventHandler.value == listener) {
            return true;
        }
    }
    return false;
};
EventListener.detach = function (evt, handler) {
    if (!handler) {
        new Warning.ValueUndefined();
        return;
    }
    let _this = evt;
    let handlersLength = _this._handlers.length;
    for (var i = 0; i < handlersLength; i++) {
        var eventHandler = _this._handlers[i];
        if (eventHandler.value == handler) {
            Array.removeAtIndex(_this._handlers, i);
            break;
        }
    }
};
let _Event = Event;
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    _Event.prototype._stopPropagation = _Event.prototype.stopPropagation;
    _Event.prototype.stopPropagation = function () {
        Event.fire(namespace.__.MOUSE.globalClick);
        _Event.prototype._stopPropagation.apply(this, arguments);
    };
}
var Event = function () {
    this._handlers = [];
    this._isDisabled = false;
    this.dispose = this.dispose.bind(this);
};
Event.prototype.dispose = function () {
    let _this = this;
    Event.clear(_this);
};
Event.enable = function (_this) {
    _this._isDisabled = false;
};
Event.disable = function (_this) {
    _this._isDisabled = true;
};
Event.fire = function (_this, eventArgs) {
    if (_this._isDisabled == true) {
        return;
    }
    let handlersLength = _this._handlers.length;
    let newHandlers = [];
    for (var i = 0; i < handlersLength; i++) {
        var eventHandler = _this._handlers[i];
        eventHandler.value(eventArgs);
        if (eventHandler instanceof EventListener) {
            newHandlers.push(eventHandler);
        }
    }
    _this._handlers = newHandlers;
};
Event.clear = function (_this) {
    _this._handlers = [];
};
var namespace;
(function (namespace) {
    var __;
    (function (__) {
        __.BROWSER = (() => {
            if (typeof window !== 'undefined' && typeof document !== 'undefined') {
                let BROWSER = {
                    resizeEvent: null,
                    init: function () {
                        BROWSER.resizeEvent = new Event();
                        window.onresize = function (event) {
                            BROWSER.updateBody(event);
                            let eventArgs = new EventArgs(BROWSER);
                            eventArgs.event = event;
                            Event.fire(BROWSER.resizeEvent, eventArgs);
                        };
                        if (document.readyState === "complete") {
                            BROWSER.updateBody();
                        }
                        else if (document.readyState === "interactive") {
                            BROWSER.updateBody();
                        }
                        else {
                            var firstCall = () => {
                                BROWSER.updateBody();
                                window.removeEventListener("load", firstCall);
                            };
                            window.addEventListener("load", firstCall);
                        }
                    },
                    updateBody: function (event) {
                        let element = document.body;
                        let width = element.clientWidth;
                        if (width < 481) {
                            element.setAttribute('responsive-type', 'smartphone');
                        }
                        else if (width < 641) {
                            element.setAttribute('responsive-type', 'smartphone-landscape');
                        }
                        else if (width < 961) {
                            element.setAttribute('responsive-type', 'tablet');
                        }
                        else if (width < 1025) {
                            element.setAttribute('responsive-type', 'tablet-landscape');
                        }
                        else if (width < 1281) {
                            element.setAttribute('responsive-type', 'laptop');
                        }
                        else {
                            element.setAttribute('responsive-type', 'desktop');
                        }
                    }
                };
                BROWSER.init();
                return BROWSER;
            }
            return null;
        })();
    })(__ = namespace.__ || (namespace.__ = {}));
})(namespace || (namespace = {}));
(function (namespace) {
    var core;
    (function (core) {
        class Browser {
            constructor(application) {
                this.application = null;
                this.resizeEvent = namespace.__.BROWSER.resizeEvent;
                this.state = null;
                this.localStorage = null;
                this.isStateRestoring = false;
                this.application = application;
                this.state = window.history.state;
                this.localStorage = window.localStorage;
            }
            dispose() {
                new Exception.NotImplemented();
            }
            setTitle(value) {
                document.title = value;
            }
            getType() {
                new Exception.NotImplemented();
            }
            isSecureHTTP() {
                return location.protocol === 'https:';
            }
            isRetinaDisplay() {
                if (typeof window.devicePixelRatio !== 'undefined') {
                    if (window.devicePixelRatio >= 1.5) {
                        return true;
                    }
                }
                else if (typeof window.matchMedia !== 'undefined') {
                    if (window.matchMedia('(-webkit-min-device-pixel-ratio: 1.5),(min-resolution: 1.5dppx),(min-resolution: 144dpi)').matches) {
                        return true;
                    }
                }
                return false;
            }
        }
        core.Browser = Browser;
    })(core = namespace.core || (namespace.core = {}));
})(namespace || (namespace = {}));
var namespace;
(function (namespace) {
    var core;
    (function (core) {
        class Cache {
        }
        core.Cache = Cache;
    })(core = namespace.core || (namespace.core = {}));
})(namespace || (namespace = {}));
_global.Char = (() => {
    var Char = function () {
    };
    Char.isDigit = function (_this) {
        if (_this >= '0' && _this <= '9') {
            return true;
        }
        return false;
    };
    return Char;
})();
_global.IStringify = (() => {
    let IStringify = function () {
    };
    IStringify.prototype.toString = Function.empty;
    return IStringify;
})();
_global.Color = (() => {
    let Color = function (arg1, arg2, arg3, arg4) {
        if (arg1 || arg1 == 0) {
            if (!arg2 && arg2 != 0) {
                return Color._parse(value);
            }
            else {
                if (arg3 || arg3 == 0) {
                    let objColor = new Color();
                    objColor.red = arg1;
                    objColor.green = arg2;
                    objColor.blue = arg3;
                    if (arguments.length == 4) {
                        objColor.alpha = arg4;
                    }
                    return objColor;
                }
                else {
                    new Exception.ArgumentInvalid(value);
                }
            }
        }
        this.red = 0;
        this.green = 0;
        this.blue = 0;
        this.alpha = 255;
    };
    Color._parse = function (value) {
        if (!value) {
            new Exception.ArgumentUndefined();
        }
        if (value instanceof Color) {
            return value;
        }
        if (typeof value !== 'string') {
            new Exception.ArgumentInvalid(value);
        }
        let internalColor = new Color();
        if (value[0] == '#') {
            value = value.substr(1);
            if (value.length >= 2) {
                let number = parseInt(value.substr(0, 2), 16);
                internalColor.red = number;
            }
            if (value.length >= 4) {
                let number = parseInt(value.substr(2, 2), 16);
                internalColor.green = number;
            }
            if (value.length >= 6) {
                let number = parseInt(value.substr(4, 2), 16);
                internalColor.blue = number;
            }
            if (value.length >= 8) {
                let number = parseInt(value.substr(6, 2), 16);
                internalColor.alpha = number;
            }
        }
        else if (value.match('rgb') == true) {
            value = value.substr(4);
            value = value.substr(0, value.length - 2);
            let values = value.split(',');
            let number;
            number = parseInt(values[0]);
            internalColor.red = number;
            number = parseInt(values[1]);
            internalColor.green = number;
            number = parseInt(values[2]);
            internalColor.blue = number;
        }
        else if (value.match('rgba') == true) {
            value = value.substr(5);
            value = value.substr(0, value.length - 2);
            let values = value.split(',');
            let number;
            number = parseInt(values[0]);
            internalColor.red = number;
            number = parseInt(values[1]);
            internalColor.green = number;
            number = parseInt(values[2]);
            internalColor.blue = number;
            number = Math.round(parseInt(values[3]) * 255);
            internalColor.alpha = number;
        }
        else {
            new Exception.ArgumentInvalid(value);
        }
        return internalColor;
    };
    Color.toRgb = function (value) {
        let _this = Color._parse(value);
        return _this;
    };
    Color.toRgbString = function (value) {
        let _this = Color._parse(value);
        return 'rgb(' + _this.red + ', ' + _this.green + ', ' + _this.blue + ')';
    };
    Color.toRgbaString = function (value) {
        let _this = Color._parse(value);
        let alpha = Math.round(_this.alpha / 255);
        return 'rgba(' + _this.red + ', ' + _this.green + ', ' + _this.blue + ', ' + alpha + ')';
    };
    Color.toHex = function (value) {
        let _this = Color._parse(value);
        _this.red = parseInt(_this.red, 16);
        _this.green = parseInt(_this.green, 16);
        _this.blue = parseInt(_this.blue, 16);
        _this.alpha = parseInt(_this.alpha, 16);
        return _this;
    };
    Color.toHexString = function (value) {
        let _this = Color._parse(value);
        let r = _this.red.toString(16);
        let g = _this.green.toString(16);
        let b = _this.blue.toString(16);
        if (r.length == 1) {
            r = "0" + r;
        }
        if (g.length == 1) {
            g = "0" + g;
        }
        if (b.length == 1) {
            b = "0" + b;
        }
        return '#' + r + g + b;
    };
    Color.toHexAlphaString = function (rawValue) {
        let _this = Color._parse(rawValue);
        let r = _this.red.toString(16);
        let g = _this.green.toString(16);
        let b = _this.blue.toString(16);
        if (r.length == 1) {
            r = "0" + r;
        }
        if (g.length == 1) {
            g = "0" + g;
        }
        if (b.length == 1) {
            b = "0" + b;
        }
        let a = _this.alpha.toString(16);
        if (a.length == 1) {
            a = "0" + a;
        }
        return '#' + r + g + b + a;
    };
    Color.getHsvAlpha = function (rawValue) {
        let _this = Color._parse(rawValue);
        let r = _this.red / 255;
        let g = _this.green / 255;
        let b = _this.blue / 255;
        var max = Math.max(r, g, b);
        var min = Math.min(r, g, b);
        var h;
        var s;
        var v = max;
        var d = max - min;
        s = max == 0 ? 0 : d / max;
        if (max == min) {
            h = 0;
        }
        else {
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }
        let alpha = Math.round(_this.alpha / 255);
        return [h, s, v, alpha];
    };
    return Color;
})();
var namespace;
(function (namespace) {
    var core;
    (function (core) {
        class Cookie {
            constructor(name) {
                this.name = '';
                let _this = this;
                _this.name = name;
            }
            getValue() {
                let _this = this;
                var name = _this.name + "=";
                var decodedCookie = decodeURIComponent(document.cookie);
                var ca = decodedCookie.split(';');
                for (var i = 0; i < ca.length; i++) {
                    var c = ca[i];
                    while (c.charAt(0) == ' ') {
                        c = c.substring(1);
                    }
                    if (c.indexOf(name) == 0) {
                        return c.substring(name.length, c.length);
                    }
                }
                return "";
            }
            setValue(value) {
                let _this = this;
                document.cookie = _this.name + '=' + value + ';';
            }
            remove() {
                let _this = this;
                document.cookie = _this.name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            }
        }
        core.Cookie = Cookie;
    })(core = namespace.core || (namespace.core = {}));
})(namespace || (namespace = {}));
Date.timestampToDays = function (time) {
    return Math.ceil(time / datetime.DAY_MSEC);
};
Date.timestampToHours = function (time) {
    return Math.ceil(time / (1000 * 60 * 60));
};
Date.diffInDays = function (a, b) {
    var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.floor((utc2 - utc1) / datetime.DAY_MSEC);
};
Date.nowInMiliseconds = function () {
    var now = new Date();
    return now.getTime();
};
Date.nowInNanoseconds = function () {
    return performance.now();
};
Date.today = function () {
    var today = new Date();
    return Date.getMidnightDate(today);
};
Date.clone = function (date) {
    return new Date(date.getTime());
};
Date.prototype.nextDay = function () {
    this.setDate(this.getDate() + 1);
};
Date.prototype.previousDay = function () {
    this.setDate(this.getDate() - 1);
};
Date.prototype.nextMonth = function () {
    this.setMonth(this.getMonth() + 1);
};
Date.prototype.previousMonth = function () {
    this.setMonth(this.getMonth() - 1);
};
Date.getMidnightDate = function (date) {
    var newDate = new Date(date.getTime());
    newDate.setHours(0);
    newDate.setMinutes(0);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    return newDate;
};
Date.getDayName = function (relativeDay) {
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[relativeDay];
};
Date.getMonthName = function (relativeMonth) {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return monthNames[relativeMonth];
};
Date.format = function (date, format) {
    var formattedString = '';
    if (format.length == 1) {
        return Date.getFormatPart(date, format);
    }
    var partialFormat = '';
    for (let i = 0; i < format.length; i++) {
        let fChar = format[i];
        let nextChar = format[i + 1];
        partialFormat += fChar;
        if (fChar == nextChar) {
            continue;
        }
        formattedString += Date.getFormatPart(date, partialFormat);
        partialFormat = '';
    }
    return formattedString;
};
Date.getFormatPart = function (date, format) {
    let value;
    switch (format) {
        case 'd':
            return date.getDate();
        case 'dd':
            value = date.getDate();
            if (value < 10) {
                value = '0' + value;
            }
            return value;
        case 'ddd':
            return Date.getDayName(date.getDay()).substr(0, 3);
        case 'dddd':
            return Date.getDayName(date.getDay());
        case 'M':
            return date.getMonth() + 1;
        case 'MM':
            value = date.getMonth() + 1;
            if (value < 10) {
                value = '0' + value;
            }
            return value;
        case 'MMM':
            return Date.getMonthName(date.getMonth()).substr(0, 3);
        case 'MMMM':
            return Date.getMonthName(date.getMonth());
        case 'h':
            return date.getHours();
        case 'hh':
            value = date.getHours();
            if (value < 10) {
                value = '0' + value;
            }
            return value;
        case 'm':
            return date.getMinutes();
        case 'mm':
            value = date.getMinutes();
            if (value < 10) {
                value = '0' + value;
            }
            return value;
        case 's':
            return date.getSeconds();
        case 'ss':
            value = date.getSeconds();
            if (value < 10) {
                value = '0' + value;
            }
            return value;
        case 'yyyy':
            return date.getFullYear();
    }
    return format;
};
_global.Enum = function (values) {
    Object.cloneData(this, values);
};
var EventArgs = function (sender) {
    this.sender = sender ? sender : null;
};
Function.empty = function () {
};
_global.IDisposable = (() => {
    let IDisposable = function () {
        Object.defineProperty(this, '_isDisposed', {
            writable: true,
            enumerable: false
        });
        this._isDisposed = false;
        Object.defineProperty(this, 'onDispose', {
            writable: true,
            enumerable: false
        });
        this.onDispose = new Event();
    };
    Object.defineProperty(IDisposable.prototype, 'dispose', {
        writable: true,
        enumerable: false
    });
    IDisposable.prototype.dispose = Function.empty;
    return IDisposable;
})();
var GarbageCollector = {};
GarbageCollector.dispose = function (obj) {
    if (GarbageCollector.isDisposable(obj) == false) {
        new Exception.Other('Element is not disposable!');
    }
    if (_global.CHECK_IF_IDISPOSABLE_IMPLEMENTED == true) {
        if (!element.dispose) {
            new Warning.Other('Element is not disposable!');
        }
        if (!element.onDispose) {
            new Warning.Other('Element is not disposable!');
        }
    }
    if (obj.onDispose) {
        Event.fire(obj.onDispose);
        Event.clear(obj.onDispose);
    }
    if (obj.dispose) {
        obj.dispose();
    }
    if (obj instanceof Array) {
        obj.length = 0;
        obj.push = undefined;
        obj.pop = undefined;
        obj.slice = undefined;
        obj.concat = undefined;
        obj.reverse = undefined;
        obj.splice = undefined;
        obj.shift = undefined;
    }
    else {
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                obj[key] = undefined;
            }
        }
    }
    obj._isDisposed = true;
};
GarbageCollector.isDisposable = function (obj) {
    if (!obj) {
        return false;
    }
    if (typeof obj !== 'object') {
        return false;
    }
    if (obj instanceof Array) {
        return true;
    }
    return true;
};
var namespace;
(function (namespace) {
    var core;
    (function (core) {
        class Globals {
        }
        core.Globals = Globals;
    })(core = namespace.core || (namespace.core = {}));
})(namespace || (namespace = {}));
if (typeof Image !== 'undefined') {
    Image.load = function (filepath) {
        return new Promise((resolve, reject) => {
            let image = new Image();
            image.onload = function () {
                resolve(image);
            };
            image.onerror = function () {
                reject();
            };
            image.src = filepath;
        });
    };
    Image.preload = function (filepath) {
        if (!window.preloadedImages) {
            window.preloadedImages = new Object();
        }
        return new Promise((resolve, reject) => {
            let image = new Image();
            image.onload = function () {
                window.preloadedImages[filepath] = image;
                resolve(image);
            };
            image.onerror = function () {
                reject(image);
            };
            image.src = filepath;
        });
    };
    if (typeof HTMLCanvasElement !== 'undefined') {
        Image.prototype.toRawImage = function () {
            var _this = this;
            var canvas = new namespace.html.Canvas(false);
            canvas.width = _this.width;
            canvas.height = _this.height;
            var context = canvas.getContext('2d');
            context.drawImage(_this, 0, 0, _this.width, _this.height);
            var rawImage = new namespace.core.RawImage(_this.src);
            rawImage.imageData = canvas.toImageData();
            return rawImage;
        };
        Image.toPNGString = function (buffer, width, height) {
            var canvas = new namespace.html.Canvas(false);
            canvas.width = width;
            canvas.height = height;
            var imagedata = new ImageData(new Uint8ClampedArray(buffer), width, height);
            canvas.getContext('2d').putImageData(imagedata, 0, 0);
            return canvas.toDataURL('image/png');
        };
    }
}
if (typeof ImageData !== 'undefined') {
    ImageData.prototype.getPixel = function (posX, posY) {
        let imageData = this;
        let NUM_OF_CHANNELS = 4;
        let position = 0;
        position += posY * imageData.width;
        position += posX;
        position *= NUM_OF_CHANNELS;
        var color = new Color();
        color.red = imageData.data[position + 0];
        color.green = imageData.data[position + 1];
        color.blue = imageData.data[position + 2];
        color.alpha = imageData.data[position + 3];
        return color;
    };
    ImageData.prototype.setPixel = function (posX, posY, color) {
        let imageData = this;
        let NUM_OF_CHANNELS = 4;
        let position = 0;
        position += posY * imageData.width;
        position += posX;
        position *= NUM_OF_CHANNELS;
        imageData.data[position + 0] = color.red;
        imageData.data[position + 1] = color.green;
        imageData.data[position + 2] = color.blue;
        imageData.data[position + 3] = color.alpha;
    };
    ImageData.scale = function (imageData, direction, factor) {
        let NUM_OF_CHANNELS = 4;
        if (direction == namespace.enums.Direction.UP) {
            new Exception.NotImplemented();
            return null;
        }
        else if (direction == namespace.enums.Direction.DOWN) {
            let newWidth = Math.ceil(imageData.width / factor);
            let newHeight = Math.ceil(imageData.height / factor);
            let newImageData = new ImageData(newWidth, newHeight);
            let sampleRate = Math.pow(factor, 2);
            for (let j = 0; j < newHeight; j++) {
                for (let i = 0; i < newWidth; i++) {
                    let above = newWidth * NUM_OF_CHANNELS * j;
                    let index = above + (i * NUM_OF_CHANNELS);
                    let red = 0;
                    let green = 0;
                    let blue = 0;
                    let alpha = 0;
                    for (let y = 0; y < factor; y++) {
                        for (let x = 0; x < factor; x++) {
                            let largerAbove = (newWidth * NUM_OF_CHANNELS * factor) * (y + j * factor);
                            let largeIndex = largerAbove + ((x + i * factor) * NUM_OF_CHANNELS);
                            red += imageData.data[largeIndex + 0];
                            green += imageData.data[largeIndex + 1];
                            blue += imageData.data[largeIndex + 2];
                            alpha += imageData.data[largeIndex + 3];
                        }
                    }
                    newImageData.data[index + 0] = red / sampleRate;
                    newImageData.data[index + 1] = green / sampleRate;
                    newImageData.data[index + 2] = blue / sampleRate;
                    newImageData.data[index + 3] = alpha / sampleRate;
                }
            }
            return newImageData;
        }
    };
}
var namespace;
(function (namespace) {
    var core;
    (function (core) {
        class IsolatedStorage {
            constructor(location) {
                this.location = '';
                let _this = this;
                _this.location = location;
            }
        }
        core.IsolatedStorage = IsolatedStorage;
    })(core = namespace.core || (namespace.core = {}));
})(namespace || (namespace = {}));
var namespace;
(function (namespace) {
    var __;
    (function (__) {
        __.KEYBOARD = (() => {
            if (typeof window !== 'undefined' && typeof document !== 'undefined') {
                let KEYBOARD = {
                    map: {},
                    event: null,
                    init: function () {
                        document.body.onkeydown = KEYBOARD.onKeyPressChange;
                        document.body.onkeyup = KEYBOARD.onKeyPressChange;
                    },
                    onKeyPressChange: function (event) {
                        KEYBOARD.event = event;
                        KEYBOARD.map[event.keyCode] = event.type == 'keydown';
                    }
                };
                KEYBOARD.init();
                return KEYBOARD;
            }
        })();
    })(__ = namespace.__ || (namespace.__ = {}));
})(namespace || (namespace = {}));
(function (namespace) {
    var core;
    (function (core) {
        class Keyboard {
            isKeyDown(key) {
                if (namespace.__.KEYBOARD.map[key] == true) {
                    return true;
                }
                return false;
            }
            isKeyUp(key) {
                let _this = this;
                return !_this.isKeyDown(key);
            }
            ;
            isNumberPressed() {
                let _this = this;
                let event = namespace.__.KEYBOARD.event;
                if (!event) {
                    return false;
                }
                var key = event.keyCode;
                if ((key >= 48 && key <= 57) || (key >= 96 && key <= 105)) {
                    return true;
                }
                return false;
            }
            isLetterPressed() {
                let _this = this;
                let event = namespace.__.KEYBOARD.event;
                if (!event) {
                    return false;
                }
                var key = event.keyCode;
                if (key >= 65 && key <= 90) {
                    return true;
                }
                return false;
            }
            dispose() {
                new Exception.NotImplemented();
            }
        }
        core.Keyboard = Keyboard;
    })(core = namespace.core || (namespace.core = {}));
})(namespace || (namespace = {}));
var namespace;
(function (namespace) {
    var core;
    (function (core) {
        class LoadingCounter {
            constructor(maxValue, element) {
                this.maxValue = 0;
                this.value = 0;
                this.element = null;
                this.maxValue = maxValue;
                this.element = element;
            }
            setValue(value) {
                value = typeof value !== 'undefined' ? value : 0;
                let _this = this;
                if (value > _this.maxValue) {
                    new Warning.Other('Cannot set counter value! Value is larger than max allowed value.');
                    return;
                }
                _this.value = value;
                _this._updateElement();
            }
            increase(value) {
                value = typeof value !== 'undefined' ? value : 1;
                let _this = this;
                if (_this.value >= _this.maxValue) {
                    new Warning.Other('Cannot increase counter! Max value is already reached.');
                    return;
                }
                _this.value += value;
                _this._updateElement();
            }
            decrease(value) {
                value = typeof value !== 'undefined' ? value : 1;
                let _this = this;
                if (_this.value <= 0) {
                    new Warning.Other('Cannot decrease counter! Min value is already reached.');
                    return;
                }
                _this.value -= value;
                _this._updateElement();
            }
            getPercentage() {
                let _this = this;
                return (_this.value / _this.maxValue) * 100;
            }
            _updateElement() {
                let _this = this;
                if (!_this.element) {
                    return;
                }
                _this.element.removeClass('continous');
                var percentage = _this.getPercentage();
                _this.element.style.setProperty('--PROGRESS-WIDTH', percentage + "%");
            }
        }
        core.LoadingCounter = LoadingCounter;
    })(core = namespace.core || (namespace.core = {}));
})(namespace || (namespace = {}));
Math.roundToTwoDecimals = function (value) {
    return Math.round(value * 100) / 100;
};
Math.isPositive = function (value) {
    return value >= 0;
};
Math.isNegative = function (value) {
    return value < 0;
};
Math.toNegative = function (value) {
    if (Math.isNegative()) {
        return value;
    }
    return -value;
};
Math.toPositive = function (value) {
    if (Math.isNegative()) {
        return -value;
    }
    return value;
};
Math.toPercentage = function (value, maxValue) {
    return (100 * value) / maxValue;
};
String.generateUUID = function () {
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
};
String.prototype.capitalize = function () {
    let _this = this;
    if (_this.length < 1) {
        return _this;
    }
    let firstLetter = _this.charAt(0);
    let otherLetters = _this.slice(1);
    return firstLetter.toUpperCase() + otherLetters;
};
String.prototype.hasNumbers = function () {
    let _this = this;
    if (_this.length == 0) {
        return false;
    }
    return /\d/.test(_this);
};
String.prototype.hasOnlyNumbers = function () {
    let _this = this;
    if (_this.length == 0) {
        return false;
    }
    return /^\d+$/.test(_this);
};
String.prototype.hasLetters = function () {
    let _this = this;
    if (_this.length == 0) {
        return false;
    }
    return /[a-zA-Z]/.test(_this);
};
String.prototype.hasOnlyLetters = function () {
    let _this = this;
    if (_this.length == 0) {
        return false;
    }
    return /^[a-zA-Z]+$/.test(_this);
};
String.prototype.reverse = function () {
    let _this = this;
    let newString = String();
    for (let i = _this.length - 1; i >= 0; i--) {
        let char = _this[i];
        newString += char;
    }
    return newString;
};
String.empty = '';
var parseUnit = function (value) {
    if (typeof value !== 'string') {
        new Exception.ArgumentInvalid(value);
    }
    if (value == '') {
        new Exception.ArgumentInvalid(value);
    }
    let unit = '';
    for (var i = value.length - 1; i >= 0; i--) {
        let char = value[i];
        if (char >= '0' && char <= '9') {
            break;
        }
        unit += char;
    }
    return unit.reverse();
};
var parseValue = function (value) {
    return parseFloat(value);
};
class Unit {
    static getValueAndUnit(value, defaultUnit) {
        let newUnit = '';
        let newValue = 0;
        if (typeof value == "string") {
            newValue = parseValue(value);
            newUnit = parseUnit(value);
        }
        else if (typeof value == "number") {
            newValue = value;
        }
        else {
            new Exception.ArgumentInvalid(value);
        }
        if (newUnit == '') {
            newUnit = defaultUnit;
        }
        return { value: newValue, unit: newUnit };
    }
    static getUnanimousUnit(array) {
        let unanimousUnit = Array.getFirst(array).unit;
        for (var i = 1; i < array.length; i++) {
            let current = array[i];
            if (unanimousUnit != current.unit) {
                return null;
            }
        }
        return unanimousUnit;
    }
}
class MemoryUnit extends Unit {
    static parse(value) {
        let newValue = MemoryUnit.getValueAndUnit(value, namespace.enums.MemoryUnit.B);
        return MemoryUnit.toString(newValue.value, newValue.unit);
    }
    static getValueAndUnitArray(array) {
        let newArray = new Array(array.length);
        for (var i = 0; i < array.length; i++) {
            newArray[i] = MemoryUnit.getValueAndUnit(array[i], namespace.enums.MemoryUnit.B);
        }
        return newArray;
    }
    static add() {
        let array = MemoryUnit.getValueAndUnitArray(arguments);
        let unit = MemoryUnit.getUnanimousUnit(array);
        if (unit == null) {
            new Exception.ArgumentInvalid('Units do not match!');
        }
        let firstElement = Array.getFirst(array);
        let sum = firstElement.value;
        sum = sum + array[1].value;
        return MemoryUnit.toString(sum, unit);
    }
    static subtract() {
        let array = MemoryUnit.getValueAndUnitArray(arguments);
        let unit = MemoryUnit.getUnanimousUnit(array);
        if (unit == null) {
            new Exception.ArgumentInvalid('Units do not match!');
        }
        let firstElement = Array.getFirst(array);
        let sum = firstElement.value;
        sum = sum - array[1].value;
        return MemoryUnit.toString(sum, unit);
    }
    static divide() {
        let array = MemoryUnit.getValueAndUnitArray(arguments);
        let unit = MemoryUnit.getUnanimousUnit(array);
        if (unit == null) {
            new Exception.ArgumentInvalid('Units do not match!');
        }
        let firstElement = Array.getFirst(array);
        let sum = firstElement.value;
        sum = sum / array[1].value;
        return MemoryUnit.toString(sum, unit);
    }
    static multiply() {
        let array = MemoryUnit.getValueAndUnitArray(arguments);
        let unit = MemoryUnit.getUnanimousUnit(array);
        if (unit == null) {
            new Exception.ArgumentInvalid('Units do not match!');
        }
        let firstElement = Array.getFirst(array);
        let sum = firstElement.value;
        sum = sum * array[1].value;
        return MemoryUnit.toString(sum, unit);
    }
    static toString(value, unit) {
        return value + unit;
    }
    static toBytes(value) {
        let parsed = MemoryUnit.getValueAndUnit(value, namespace.enums.MemoryUnit.B);
        let newValue;
        let newUnit = namespace.enums.MemoryUnit.B;
        let sizeUnit;
        let prefixUnit;
        if (parsed.unit.length == 2) {
            sizeUnit = parsed.unit[1];
            prefixUnit = parsed.unit[0];
        }
        else {
            sizeUnit = parsed.unit[0];
        }
        if (sizeUnit == namespace.enums.MemoryUnit.Bit) {
            newValue = parsed.value / 8;
        }
        else if (sizeUnit == namespace.enums.MemoryUnit.Byte) {
            newValue = parsed.value;
        }
        else {
            new Exception.ArgumentInvalid(value, 'Unknown memory unit type!');
        }
        if (prefixUnit) {
            newValue = parsed.value * Number.fromMetricPrefix(prefixUnit);
        }
        return MemoryUnit.toString(newValue, newUnit);
    }
    static getValue(value) {
        return parseValue(value);
    }
    static getUnit(value) {
        let parsedUnit = parseUnit(value);
        MemoryUnit.getValueAndUnit(valuenamespace.enums.MemoryUnit.Byte);
        return parsedUnit.unit;
    }
    static toReadableString(filesize) {
        var sizeText = '';
        var KILO = Math.pow(1024, 1);
        var MEGA = Math.pow(1024, 2);
        var GIGA = Math.pow(1024, 3);
        var sizeinGB = filesize / GIGA;
        if (sizeinGB >= 1) {
            sizeinGB = parseFloat(sizeinGB).toFixed(1);
            sizeText = sizeinGB + ' GB';
        }
        else {
            var sizeinMB = filesize / MEGA;
            if (sizeinMB >= 1) {
                sizeinMB = parseFloat(sizeinMB).toFixed(1);
                sizeText = sizeinMB + ' MB';
            }
            else {
                var sizeinKB = filesize / KILO;
                if (sizeinKB >= 1) {
                    sizeinKB = parseFloat(sizeinKB).toFixed(1);
                    sizeText = sizeinKB + ' KB';
                }
                else {
                    sizeText = filesize + ' B';
                }
            }
        }
        return sizeText;
    }
    static toPercentage(value, maxValue) {
        let unit = namespace.enums.LengthUnit.PERCENTAGE;
        let newValue = Math.toPercentage(value, maxValue);
        return MemoryUnit.toString(newValue, unit);
    }
}
var namespace;
(function (namespace) {
    var __;
    (function (__) {
        __.MOUSE = (() => {
            if (typeof window !== 'undefined' && typeof document !== 'undefined') {
                let MOUSE = {
                    moveEvent: null,
                    globalClick: new Event(),
                    init: function () {
                        document.addEventListener('mousemove', MOUSE.onMouseMove, false);
                        document.body.addEventListener('click', MOUSE.onGlobalClick);
                    },
                    onGlobalClick: function (event) {
                        let eventArgs = new EventArgs(MOUSE);
                        eventArgs.event = event;
                        Event.fire(MOUSE.globalClick, eventArgs);
                    },
                    onMouseMove: function (event) {
                        MOUSE.moveEvent = event;
                    }
                };
                MOUSE.init();
                return MOUSE;
            }
        })();
    })(__ = namespace.__ || (namespace.__ = {}));
})(namespace || (namespace = {}));
(function (namespace) {
    var core;
    (function (core) {
        class Mouse {
            constructor(event) {
                this.event = null;
                this.event = event;
            }
            getPositionX() {
                let _this = this;
                let event = namespace.__.MOUSE.moveEvent;
                if (!event) {
                    return 0;
                }
                return event.clientX;
            }
            getPositionY() {
                let _this = this;
                let event = namespace.__.MOUSE.moveEvent;
                if (!event) {
                    return 0;
                }
                return event.clientY;
            }
            isMiddleClick() {
                let _this = this;
                let event = _this.event;
                if (!event) {
                    return false;
                }
                else if (event.ctrlKey || event.which == 2) {
                    event.stopImmediatePropagation();
                    return true;
                }
                else {
                    _this.stopPropagation();
                    return false;
                }
            }
            isLeftClick() {
                let _this = this;
                if (!_this.event) {
                    return false;
                }
                if (_this.event.which == 0) {
                    return true;
                }
                return false;
            }
            isRightClick() {
                let _this = this;
                if (!_this.event) {
                    return false;
                }
                if (_this.event.which == 2) {
                    return true;
                }
                return false;
            }
            stopPropagation() {
                let _this = this;
                if (!_this.event) {
                    return;
                }
                _this.event.preventDefault();
                _this.event.stopPropagation();
            }
            isTarget(target) {
                let _this = this;
                if (!_this.event) {
                    return false;
                }
                return _this.event.target == target;
            }
            dispose() {
                new Exception.NotImplemented();
            }
        }
        core.Mouse = Mouse;
    })(core = namespace.core || (namespace.core = {}));
})(namespace || (namespace = {}));
Number.fromMetricPrefix = function (unit) {
    if (unit == namespace.enums.MetricPrefix.pico) {
        return Math.pow(10, -12);
    }
    else if (unit == namespace.enums.MetricPrefix.Nano) {
        return Math.pow(10, -9);
    }
    else if (unit == namespace.enums.MetricPrefix.Micro) {
        return Math.pow(10, -6);
    }
    else if (unit == namespace.enums.MetricPrefix.Mili) {
        return Math.pow(10, -3);
    }
    else if (unit == namespace.enums.MetricPrefix.Centi) {
        return Math.pow(10, -2);
    }
    else if (unit == namespace.enums.MetricPrefix.Deci) {
        return Math.pow(10, -1);
    }
    else if (unit == namespace.enums.MetricPrefix.Deca) {
        return Math.pow(10, 1);
    }
    else if (unit == namespace.enums.MetricPrefix.Hecto) {
        return Math.pow(10, 2);
    }
    else if (unit == namespace.enums.MetricPrefix.Kilo) {
        return Math.pow(10, 3);
    }
    else if (unit == namespace.enums.MetricPrefix.Mega) {
        return Math.pow(10, 6);
    }
    else if (unit == namespace.enums.MetricPrefix.Giga) {
        return Math.pow(10, 9);
    }
    else if (unit == namespace.enums.MetricPrefix.Tera) {
        return Math.pow(10, 12);
    }
    else {
        new Exception.ArgumentInvalid(unit, 'Unknown metric prefix type!');
    }
};
Object.cloneData = function (dst, src) {
    for (var key in src) {
        if (src.hasOwnProperty(key)) {
            dst[key] = src[key];
        }
    }
    return dst;
};
Object.parse = function (obj) {
    let constructorString = Object.getMetadata(obj, 'constructor');
    if (!constructorString) {
        new Exception.ValueUndefined('Constructor metadata is mising!');
    }
    let constructorClass = new Reflection(constructorString, _this);
    if (!constructorClass) {
        new Exception.ValueUndefined();
    }
    if (!constructorClass.parse) {
        new Exception.Other('Constructor class does not have parse method implemented!');
    }
    constructorClass.parse(obj);
};
Object.toJson = function (obj) {
    let constructorString = Object.getMetadata(obj, 'constructor');
    if (!constructorString) {
        new Exception.ValueUndefined('Constructor metadata is mising!');
    }
    let constructorClass = new Reflection(constructorString, _this);
    if (!constructorClass) {
        new Exception.ValueUndefined();
    }
    if (!constructorClass.toJson) {
        new Exception.Other('Constructor class does not have toJson method implemented!');
    }
    constructorClass.toJson(obj);
};
Object.setMetadata = function (dst, property, value) {
    if (!dst['_metadata']) {
        dst['_metadata'] = new Object();
    }
    dst['_metadata'][property] = value;
};
Object.getMetadata = function (dst, property) {
    if (!dst['_metadata']) {
        return null;
    }
    return dst['_metadata'][property];
};
Object.destroy = function (src) {
    for (var key in src) {
        if (src.hasOwnProperty(key)) {
            delete src[key];
        }
    }
    return src;
};
Object.shrink = function (template, src) {
    var dst = new Object();
    for (var key in template) {
        if (src.hasOwnProperty(key)) {
            dst[key] = src[key];
        }
    }
    return dst;
};
Object.isEmpty = function (obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
};
Object.isNotEmpty = function (obj) {
    return !Object.isEmpty(obj);
};
Object.getSizeInBytes = function (object) {
    if (!object) {
        return 0;
    }
    var objectList = [];
    var stack = [object];
    var bytes = 0;
    while (stack.length) {
        var value = stack.pop();
        if (typeof value === 'function') {
            value = '' + value;
        }
        if (typeof value === 'boolean') {
            bytes += 4;
        }
        else if (typeof value === 'string') {
            bytes += value.length * 2;
        }
        else if (typeof value === 'number') {
            bytes += 8;
        }
        else if (typeof value === 'object') {
            if (value instanceof Int8Array || value instanceof Uint8Array || value instanceof Uint8ClampedArray) {
                bytes += value.length;
            }
            else if (value instanceof Int16Array || value instanceof Uint16Array) {
                bytes += value.length * 2;
            }
            else if (value instanceof Int32Array || value instanceof Uint32Array || value instanceof Float32Array) {
                bytes += value.length * 4;
            }
            else if (value instanceof Float64Array || value instanceof BigInt64Array || value instanceof BigUint64Array) {
                bytes += value.length * 8;
            }
            else {
                if (objectList.indexOf(value) === -1) {
                    objectList.push(value);
                    for (var i in value) {
                        stack.push(value[i]);
                    }
                }
            }
        }
    }
    return bytes;
};
var namespace;
(function (namespace) {
    var core;
    (function (core) {
        class OperatingSystem {
            constructor(type) {
                this.type = '';
                this.type = type;
            }
        }
        core.OperatingSystem = OperatingSystem;
    })(core = namespace.core || (namespace.core = {}));
})(namespace || (namespace = {}));
(() => {
    let PathInfo = _global.PathInfo = function (value) {
        if (value) {
            return PathInfo._parse(value);
        }
        this.value = '';
        this.extension = '';
        this.isFile = false;
    };
    PathInfo._parse = function (value) {
        let _this = new PathInfo();
        _this.value = value;
        let i = value.length - 1;
        while (i >= 0) {
            let char = value[i];
            if (char == '.') {
                _this.isFile = true;
                break;
            }
            else if (char == '\\' || char == '\\\\' || char == '/' || char == '//') {
                return _this;
            }
            i--;
        }
        if (i < 0) {
            return _this;
        }
        i++;
        while (i < value.length) {
            let char = value[i];
            _this.extension += char;
            i++;
        }
        return _this;
    };
    let Path = _global.Path = function (value) {
    };
    Path.getExtension = function (value) {
        let obj = new PathInfo(value);
        return obj.extension;
    };
    Path.isFile = function (value) {
        let obj = new PathInfo(value);
        return obj.isFile;
    };
})();
var namespace;
(function (namespace) {
    var core;
    (function (core) {
        class RawImage {
            constructor(url, width, height) {
                this.url = null;
                this.numOfChannels = 4;
                this.imageData = null;
                Interface.inherit(this, IDisposable);
                let _this = this;
                if (url) {
                    _this.url = url;
                }
                if (typeof width != 'undefined' && typeof height != 'undefined') {
                    _this.imageData = new ImageData(width, height);
                }
            }
            toJSON() {
                let _this = this;
                let _thisJson = {
                    url: _this.url,
                    imageData: _this.imageData
                };
                Object.setMetadata(_thisJson, 'constructor', 'namespace.core.RawImage');
                return _thisJson;
            }
            static parse(jsonData) {
                return Object.cloneData(new RawImage(), jsonData);
            }
            scale(direction, factor) {
                let _this = this;
                _this.imageData = ImageData.scale(_this.imageData, direction, factor);
            }
        }
        core.RawImage = RawImage;
        Interface.inheritPrototype(RawImage, IDisposable);
    })(core = namespace.core || (namespace.core = {}));
})(namespace || (namespace = {}));
function Reflection(value, parent) {
    parent = typeof parent !== 'undefined' ? parent : _this;
    let parts = value.split('.');
    let currentPart = parent[Array.getFirst(parts)];
    for (let i = 1; i < parts.length; i++) {
        currentPart = currentPart[parts[i]];
    }
    return currentPart;
}
;
class ScreenUnit extends Unit {
    static parse(value) {
        let newValue = ScreenUnit.getValueAndUnit(value, namespace.enums.LengthUnit.PX);
        return ScreenUnit.toString(newValue.value, newValue.unit);
    }
    static getValueAndUnitArray(array) {
        let newArray = new Array(array.length);
        for (var i = 0; i < array.length; i++) {
            newArray[i] = ScreenUnit.getValueAndUnit(array[i], namespace.enums.LengthUnit.PX);
        }
        return newArray;
    }
    static add() {
        let array = ScreenUnit.getValueAndUnitArray(arguments);
        let unit = ScreenUnit.getUnanimousUnit(array);
        if (unit == null) {
            new Exception.Other('Units do not match!');
        }
        let sum = Array.getFirst(array).value;
        sum = sum + array[1].value;
        return ScreenUnit.toString(sum, unit);
    }
    static subtract() {
        let array = ScreenUnit.getValueAndUnitArray(arguments);
        let unit = ScreenUnit.getUnanimousUnit(array);
        if (unit == null) {
            new Exception.Other('Units do not match!');
        }
        let sum = Array.getFirst(array).value;
        sum = sum - array[1].value;
        return ScreenUnit.toString(sum, unit);
    }
    static divide() {
        let array = ScreenUnit.getValueAndUnitArray(arguments);
        let unit = ScreenUnit.getUnanimousUnit(array);
        if (unit == null) {
            new Exception.Other('Units do not match!');
        }
        let sum = Array.getFirst(array).value;
        sum = sum / array[1].value;
        return ScreenUnit.toString(sum, unit);
    }
    static multiply() {
        let array = ScreenUnit.getValueAndUnitArray(arguments);
        let unit = ScreenUnit.getUnanimousUnit(array);
        if (unit == null) {
            new Exception.Other('Units do not match!');
        }
        let sum = Array.getFirst(array).value;
        sum = sum * array[1].value;
        return ScreenUnit.toString(sum, unit);
    }
    static toString(value, unit) {
        return value + unit;
    }
    static toPx(value) {
        let unit = namespace.enums.LengthUnit.PX;
        return ScreenUnit.toString(value, unit);
    }
    static getValue(value) {
        let parsedUnit = ScreenUnit.getValueAndUnit(value);
        return parsedUnit.value;
    }
    static getUnit(value) {
        let parsedUnit = ScreenUnit.getValueAndUnit(value);
        return parsedUnit.unit;
    }
    static toPercentage(value, maxValue) {
        let unit = namespace.enums.LengthUnit.PERCENTAGE;
        let newValue = Math.toPercentage(value, maxValue);
        return ScreenUnit.toString(newValue, unit);
    }
}
var namespace;
(function (namespace) {
    var core;
    (function (core) {
        class State {
            constructor() {
                this.previousState = null;
                this.nextState = 0;
                this.data = 0;
                Interface.inherit(this, IDisposable);
            }
        }
        core.State = State;
        Interface.inheritPrototype(State, IDisposable);
    })(core = namespace.core || (namespace.core = {}));
})(namespace || (namespace = {}));
var namespace;
(function (namespace) {
    var __;
    (function (__) {
        __.THREADING = (() => {
            if (typeof Worker !== 'undefined') {
                let THREADING = {
                    threads: new Array(),
                    init: function () {
                    },
                };
                THREADING.init();
                return THREADING;
            }
        })();
    })(__ = namespace.__ || (namespace.__ = {}));
})(namespace || (namespace = {}));
(function (namespace) {
    var core;
    (function (core) {
        core.MainThread = (() => {
            if (_global.IS_WEB_WORKER == true) {
                let MainThread = {
                    _instance: null,
                    _promiseQueue: {},
                    _init: function () {
                        let _this = MainThread;
                        _this._onMessage = _this._onMessage.bind(_this);
                        _this._instance = self;
                        _this._instance.onmessage = _this._onMessage;
                    },
                    _onMessage: function (event) {
                        let _this = MainThread;
                        let parameters = event.data;
                        let threadType = Object.getMetadata(parameters, 'threadType');
                        if (threadType == 'main') {
                            return;
                        }
                        let functionType = Object.getMetadata(parameters, 'functionType');
                        let functionName = Object.getMetadata(parameters, 'functionName');
                        let functionArgument = parameters.data;
                        if (functionType == 'resolve') {
                            MainThread._promiseQueue[functionName].resolve(functionArgument);
                            delete MainThread._promiseQueue[functionName];
                        }
                        else if (functionType == 'reject') {
                            MainThread._promiseQueue[functionName].reject(functionArgument);
                            delete MainThread._promiseQueue[functionName];
                        }
                        else {
                            var actualFunction = new Reflection(functionName, self);
                            if (functionType == 'request') {
                                let resolve = function (data) {
                                    _this._onResolve(functionName, data);
                                };
                                let reject = function (data) {
                                    _this._onReject(functionName, data);
                                };
                                actualFunction(_this, functionArgument, resolve, reject);
                            }
                            else if (functionType == 'invoke') {
                                actualFunction(_this, functionArgument);
                            }
                            else {
                                new Exception.ValueInvalid('Invalid metadata type functionType of value "' + functionType + '"');
                            }
                        }
                    },
                    _onResolve: function (functionName, data) {
                        let _this = MainThread;
                        let parameters = {
                            data: data
                        };
                        Object.setMetadata(parameters, 'threadType', 'main');
                        Object.setMetadata(parameters, 'functionName', functionName);
                        Object.setMetadata(parameters, 'functionType', 'resolve');
                        _this._instance.postMessage(parameters);
                    },
                    _onReject: function (functionName, data) {
                        let _this = MainThread;
                        let parameters = {
                            data: data
                        };
                        Object.setMetadata(parameters, 'threadType', 'main');
                        Object.setMetadata(parameters, 'functionName', functionName);
                        Object.setMetadata(parameters, 'functionType', 'reject');
                        _this._instance.postMessage(parameters);
                    },
                    invoke: function (functionName, data) {
                        let _this = MainThread;
                        let parameters = {
                            data: data
                        };
                        Object.setMetadata(parameters, 'threadType', 'main');
                        Object.setMetadata(parameters, 'functionName', functionName);
                        Object.setMetadata(parameters, 'functionType', 'invoke');
                        _this._instance.postMessage(parameters);
                    },
                    invokeRequest: function (functionName, data) {
                        let _this = MainThread;
                        let parameters = {
                            data: data
                        };
                        Object.setMetadata(parameters, 'threadType', 'main');
                        Object.setMetadata(parameters, 'functionName', functionName);
                        Object.setMetadata(parameters, 'functionType', 'request');
                        return new Promise((resolve, reject) => {
                            _this._addResolveToQueue(functionName, resolve, reject);
                            _this._instance.postMessage(parameters);
                        });
                    },
                    _addResolveToQueue: function (functionName, resolve, reject) {
                        let _this = MainThread;
                        let newElement = {
                            resolve: resolve,
                            reject: reject
                        };
                        _this._promiseQueue[functionName] = newElement;
                    },
                    dispose: function () {
                        new Exception.NotImplemented();
                    }
                };
                MainThread._init();
                return MainThread;
            }
        })();
        core.Thread = (() => {
            if (typeof Worker !== 'undefined') {
                let Thread = function (filename) {
                    this._instance = null;
                    this._promiseQueue = {};
                    this._init(filename);
                };
                Thread.prototype._init = function (filename) {
                    let _this = this;
                    namespace.__.THREADING.threads.push(_this);
                    _this._onMessage = _this._onMessage.bind(this);
                    _this._instance = new Worker(filename);
                    _this._instance.onmessage = _this._onMessage;
                };
                Thread.prototype._onMessage = function (event) {
                    let _this = this;
                    let parameters = event.data;
                    let threadType = Object.getMetadata(parameters, 'threadType');
                    if (threadType == 'worker') {
                        return;
                    }
                    let functionType = Object.getMetadata(parameters, 'functionType');
                    let functionName = Object.getMetadata(parameters, 'functionName');
                    let functionArgument = parameters.data;
                    if (functionType == 'resolve') {
                        _this._promiseQueue[functionName].resolve(functionArgument);
                        delete _this._promiseQueue[functionName];
                    }
                    else if (functionType == 'reject') {
                        _this._promiseQueue[functionName].reject(functionArgument);
                        delete _this._promiseQueue[functionName];
                    }
                    else {
                        var actualFunction = new Reflection(functionName, self);
                        if (functionType == 'request') {
                            let resolve = function (data) {
                                _this._onResolve(functionName, data);
                            };
                            let reject = function (data) {
                                _this._onReject(functionName, data);
                            };
                            actualFunction(_this, functionArgument, resolve, reject);
                        }
                        else if (functionType == 'invoke') {
                            actualFunction(_this, functionArgument);
                        }
                        else {
                            new Exception.ValueInvalid('Invalid metadata type functionType of value "' + functionType + '"');
                        }
                    }
                };
                Thread.prototype._onResolve = function (functionName, data) {
                    let _this = this;
                    let parameters = {
                        data: data
                    };
                    Object.setMetadata(parameters, 'threadType', 'worker');
                    Object.setMetadata(parameters, 'functionName', functionName);
                    Object.setMetadata(parameters, 'functionType', 'resolve');
                    _this._instance.postMessage(parameters);
                };
                Thread.prototype._onReject = function (functionName, data) {
                    let _this = this;
                    let parameters = {
                        data: data
                    };
                    Object.setMetadata(parameters, 'threadType', 'worker');
                    Object.setMetadata(parameters, 'functionName', functionName);
                    Object.setMetadata(parameters, 'functionType', 'reject');
                    _this._instance.postMessage(parameters);
                };
                Thread.prototype.invoke = function (functionName, data) {
                    let _this = this;
                    let parameters = {
                        data: data
                    };
                    Object.setMetadata(parameters, 'threadType', 'worker');
                    Object.setMetadata(parameters, 'functionName', functionName);
                    Object.setMetadata(parameters, 'functionType', 'invoke');
                    _this._instance.postMessage(parameters);
                };
                Thread.prototype.invokeRequest = function (functionName, data) {
                    let _this = this;
                    let parameters = {
                        data: data
                    };
                    Object.setMetadata(parameters, 'threadType', 'worker');
                    Object.setMetadata(parameters, 'functionName', functionName);
                    Object.setMetadata(parameters, 'functionType', 'request');
                    return new Promise((resolve, reject) => {
                        _this._addResolveToQueue(functionName, resolve, reject);
                        _this._instance.postMessage(parameters);
                    });
                };
                Thread.prototype._addResolveToQueue = function (functionName, resolve, reject) {
                    let _this = this;
                    let newElement = {
                        resolve: resolve,
                        reject: reject
                    };
                    _this._promiseQueue[functionName] = newElement;
                };
                Thread.prototype.terminate = function () {
                    let _this = this;
                    _this._instance.terminate();
                    Array.remove(namespace.__.THREADING.threads, _this);
                };
                Thread.prototype.dispose = function () {
                    let _this = this;
                    _this.terminate();
                    new Exception.NotImplemented();
                };
                return Thread;
            }
        })();
    })(core = namespace.core || (namespace.core = {}));
})(namespace || (namespace = {}));
_global.Timer = (() => {
    let Timer = function (timeInMiliseconds) {
        this.loop = false;
        this.time = -1;
        this._id = null;
        this.callback = Function.empty;
        this._init(timeInMiliseconds);
    };
    Timer.prototype._init = function (timeInMiliseconds) {
        this.time = (timeInMiliseconds >= 0) ? timeInMiliseconds : -1;
    };
    Timer.prototype._setTimer = function () {
        let _this = this;
        if (_this.time < 0) {
            new Warning.ValueInvalid();
            return;
        }
        var preCallback = () => {
            if (_this.loop == true) {
                _this.restart();
            }
            _this.callback();
        };
        _this._id = window.setTimeout(preCallback, _this.time);
    };
    Timer.prototype._clearTimer = function () {
        if (!this._id && this._id != 0) {
            return;
        }
        window.clearTimeout(this._id);
        this._id = null;
    };
    Timer.prototype.isActive = function () {
        if (this._id && this._id != 0) {
            return true;
        }
        return false;
    };
    Timer.prototype.restart = function () {
        this._clearTimer();
        this._setTimer();
    };
    Timer.prototype.start = function () {
        this._setTimer();
    };
    Timer.prototype.stop = function () {
        this._clearTimer();
    };
    Timer.prototype.dispose = function () {
        this.stop();
        this.callback = null;
    };
    return Timer;
})();
var namespace;
(function (namespace) {
    var core;
    (function (core) {
        class Version {
            constructor(value) {
                this.major = 0;
                this.minor = 0;
                this.build = 0;
                this.revision = 0;
                Interface.inherit(this, IStringify);
                if (value) {
                    this._parse(value);
                }
            }
            toString() {
                let _this = this;
                return _this.major + '.' + _this.minor + '.' + _this.build + '.' + _this.revision;
            }
            _parse(value) {
                let _this = this;
                let array = value.split('.');
                if (array.length > 4 || Array.isEmpty(array)) {
                    new Exception.Other('Incorrect number of version numbers!');
                }
                _this.major = parseInt(array[0]);
                _this.minor = parseInt(array[1]);
                _this.build = parseInt(array[2]);
                _this.revision = parseInt(array[3]);
            }
            compare(second) {
                let _this = this;
                if (second.major > _this.major) {
                    return true;
                }
                else if (second.major < _this.major) {
                    return false;
                }
                if (second.minor > _this.minor) {
                    return true;
                }
                else if (second.minor < _this.minor) {
                    return false;
                }
                if (second.build > _this.build) {
                    return true;
                }
                else if (second.build < _this.build) {
                    return false;
                }
                if (second.revision > _this.revision) {
                    return true;
                }
                else if (second.revision < _this.revision) {
                    return false;
                }
                return true;
            }
        }
        core.Version = Version;
        Interface.inheritPrototype(Version, IStringify);
    })(core = namespace.core || (namespace.core = {}));
})(namespace || (namespace = {}));
var namespace;
(function (namespace) {
    var core;
    (function (core) {
        class WebPage {
            constructor(title) {
                this.title = '';
                this.title = title;
            }
        }
        core.WebPage = WebPage;
    })(core = namespace.core || (namespace.core = {}));
})(namespace || (namespace = {}));
console._log = console.log;
console._error = console.error;
console._warn = console.warn;
console._trace = console.trace;
console.log = function () {
    if (_global.IS_CONSOLE_ENABLED == false) {
        return;
    }
    console._log.apply(this, arguments);
};
console.error = function () {
    console._error.apply(this, arguments);
};
console.warn = function () {
    if (_global.IS_CONSOLE_ENABLED == false) {
        return;
    }
    console._warn.apply(this, arguments);
};
console.trace = function () {
    if (_global.IS_CONSOLE_ENABLED == false) {
        return;
    }
    console._trace.apply(this, arguments);
};
_global.IUpdateable = (() => {
    let IUpdateable = function () {
        this.onUpdate = null;
    };
    IUpdateable.prototype.update = function () {
        let _this = this;
        if (_this.onUpdate) {
            Event.fire(_this.onUpdate);
        }
    };
    return IUpdateable;
})();
