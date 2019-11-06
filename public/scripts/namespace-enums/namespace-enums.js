'use strict';
var _this = this;
if (typeof module !== 'undefined' && module.exports) {
    _this = global;
}
var namespace;
(function (namespace) {
    var enums;
    (function (enums) {
        enums.Browser = (() => {
            return new Enum({
                CHROME: 'chrome',
                OPERA: 'opera',
                FIREFOX: 'firefox',
                EDGE: 'edge',
                SAFARI: 'safari',
                IE: 'internet-explorer'
            });
        })();
    })(enums = namespace.enums || (namespace.enums = {}));
})(namespace || (namespace = {}));
var namespace;
(function (namespace) {
    var enums;
    (function (enums) {
        enums.Digit = (() => {
            return new Enum({
                ZERO: 0,
                ONE: 1,
                TWO: 2,
                THREE: 3,
                FOUR: 4,
                FIVE: 5,
                SIX: 6,
                SEVEN: 7,
                EIGHT: 8,
                NINE: 9
            });
        })();
    })(enums = namespace.enums || (namespace.enums = {}));
})(namespace || (namespace = {}));
var namespace;
(function (namespace) {
    var enums;
    (function (enums) {
        enums.Direction = (() => {
            return new Enum({
                NONE: 'none',
                UP: 'up',
                DOWN: 'down',
                LEFT: 'left',
                RIGHT: 'right'
            });
        })();
    })(enums = namespace.enums || (namespace.enums = {}));
})(namespace || (namespace = {}));
var namespace;
(function (namespace) {
    var enums;
    (function (enums) {
        enums.LengthUnit = (() => {
            return new Enum({
                PX: 'px',
                PERCENTAGE: '%',
                POINTS: 'pt',
                INCHES: 'inch',
                CENTIMETERS: 'cm',
                METERS: 'm',
                KILOMETERS: 'km'
            });
        })();
    })(enums = namespace.enums || (namespace.enums = {}));
})(namespace || (namespace = {}));
var namespace;
(function (namespace) {
    var enums;
    (function (enums) {
        enums.MemoryUnit = (() => {
            return new Enum({
                Bit: 'b',
                Byte: 'B'
            });
        })();
    })(enums = namespace.enums || (namespace.enums = {}));
})(namespace || (namespace = {}));
var namespace;
(function (namespace) {
    var enums;
    (function (enums) {
        enums.MetricPrefix = (() => {
            return new Enum({
                pico: 'p',
                Nano: 'n',
                Micro: 'μ',
                Mili: 'm',
                Centi: 'c',
                Deci: 'd',
                Deca: 'da',
                Hecto: 'h',
                Kilo: 'k',
                Mega: 'M',
                Giga: 'G',
                Tera: 'T'
            });
        })();
    })(enums = namespace.enums || (namespace.enums = {}));
})(namespace || (namespace = {}));
var namespace;
(function (namespace) {
    var enums;
    (function (enums) {
        enums.Mobile = (() => {
            return new Enum({
                NONE: 'none',
                ANDROID: 'android',
                IPHONE: 'iphone',
                OTHER: 'other'
            });
        })();
    })(enums = namespace.enums || (namespace.enums = {}));
})(namespace || (namespace = {}));
var namespace;
(function (namespace) {
    var enums;
    (function (enums) {
        enums.OperatingSystem = (() => {
            return new Enum({
                NONE: 'none',
                WINDOWS: 'windows',
                MAC: 'mac',
                LINUX: 'linux',
                OTHER: 'other'
            });
        })();
    })(enums = namespace.enums || (namespace.enums = {}));
})(namespace || (namespace = {}));
