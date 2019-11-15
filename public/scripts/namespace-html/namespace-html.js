'use strict';
var _global = this;
if (typeof _global.namespace == 'undefined') {
    _global.namespace = new Object();
}
var namespace = _global.namespace;
if (typeof namespace.html == 'undefined') {
    namespace.html = new Object();
}
if (typeof namespace.__ == 'undefined') {
    namespace.__ = new Object();
}
namespace.html.Anchor = (() => {
    let Anchor = function (element) {
        this.onDispose = new Event();
        this._constructor(element);
    };
    Anchor.prototype._constructor = function (element) {
        let _this = this;
        _this.updatePosition = _this.updatePosition.bind(_this);
        _this._onElementDisposeEventHandler = _this._onElementDisposeEventHandler.bind(_this);
        _this._onBrowserResizeEventHandler = _this._onBrowserResizeEventHandler.bind(_this);
        _this.element = element;
        _this.element.addClass('has-anchor');
        EventListener.attach(_this.element.onDispose, _this._onElementDisposeEventHandler);
        _this.target = null;
        _this.top = '0px';
        _this.left = '0px';
        _this.centerTop = '0px';
        _this.centerLeft = '0px';
        let browser = new namespace.core.Browser();
        EventListener.attach(browser.resizeEvent, _this._onBrowserResizeEventHandler);
    };
    Anchor.prototype._onBrowserResizeEventHandler = function (eventArgs) {
        let _this = this;
        _this.updatePosition();
    };
    Anchor.prototype._onElementDisposeEventHandler = function () {
        let _this = this;
        GarbageCollector.dispose(_this);
    };
    Anchor.prototype.dispose = function () {
        let _this = this;
        let browser = new namespace.core.Browser();
        EventListener.detach(browser.resizeEvent, _this._onBrowserResizeEventHandler);
    };
    Anchor.prototype.setPosition = function (top, left) {
        let _this = this;
        if (top) {
            _this.top = ScreenUnit.parse(top);
        }
        if (left) {
            _this.left = ScreenUnit.parse(left);
        }
        _this.updatePosition();
    };
    Anchor.prototype.setTarget = function (target) {
        let _this = this;
        if (!target) {
            new Exception.ValueUndefined();
        }
        _this.target = target;
        _this.updatePosition();
    };
    Anchor.prototype.updatePosition = function () {
        let _this = this;
        if (_this.target) {
            _this.top = ScreenUnit.parse(_this.target.getTop());
            _this.left = ScreenUnit.parse(_this.target.getLeft());
        }
        _this.element.style.top = _this.top;
        _this.element.style.left = _this.left;
        _this.element.style.marginTop = _this.centerTop;
        _this.element.style.marginLeft = _this.centerLeft;
    };
    Anchor.prototype.setCenter = function (top, left) {
        let _this = this;
        if (top) {
            _this.centerTop = ScreenUnit.parse(top);
        }
        if (left) {
            _this.centerLeft = ScreenUnit.parse(left);
        }
        _this.updatePosition();
    };
    return Anchor;
})();
namespace.html.Button = (() => {
    let Button = function (text) {
        let _this = document.createElement('button');
        Object.cloneData(_this, Button.prototype);
        _this._constructor(text);
        return _this;
    };
    Button.prototype._constructor = function (text) {
        let _this = this;
        if (text) {
            _this.innerHTML = text;
        }
    };
    return Button;
})();
namespace.html.Canvas = (() => {
    let Canvas = function (resizable) {
        var _this = document.createElement('canvas');
        Object.cloneData(_this, Canvas.prototype);
        _this.resizeCanvas = _this.resizeCanvas.bind(_this);
        _this._onBrowserResizeEventHandler = _this._onBrowserResizeEventHandler.bind(_this);
        _this.onDispose = new Event();
        _this._constructor(resizable);
        return _this;
    };
    Canvas.prototype._constructor = function (resizable) {
        let _this = this;
        if (resizable == true) {
            EventListener.attach(namespace.__.BROWSER.resizeEvent, _this._onBrowserResizeEventHandler);
        }
    };
    Canvas.prototype._onBrowserResizeEventHandler = function (eventArgs) {
        let _this = this;
        _this.resizeCanvas();
    };
    HTMLCanvasElement.prototype.resizeCanvas = function () {
        var _this = this;
        var width = _this.parentElement.clientWidth;
        var height = _this.parentElement.clientHeight;
        _this.width = width;
        _this.height = height;
    };
    Canvas.prototype.setPixel = function (posX, posY, color) {
        var _this = this;
        _this.fillStyle = color;
        _this.fillRect(posX, posY, 1, 1);
    };
    Canvas.prototype.toImageData = function (posX, posY, width, height) {
        var _this = this;
        posX = typeof posX != 'undefined' ? posX : 0;
        posY = typeof posY != 'undefined' ? posY : 0;
        width = typeof width != 'undefined' ? width : _this.width;
        height = typeof height != 'undefined' ? height : _this.height;
        var context = _this.getContext('2d');
        return context.getImageData(posX, posY, width, height);
    };
    Canvas.prototype.getPixel = function (posX, posY) {
        var _this = this;
        return _this.toImage(posX, posY, 1, 1).data;
    };
    Canvas.prototype.dispose = function () {
        EventListener.detach(namespace.__.BROWSER.resizeEvent, _this._onBrowserResizeEventHandler);
    };
    return Canvas;
})();
namespace.html.Checkbox = (() => {
    let Checkbox = function () {
        var _this = document.createElement('input');
        _this.setAttribute('type', 'checkbox');
        Object.cloneData(_this, Checkbox.prototype);
        _this._constructor();
        return _this;
    };
    Checkbox.prototype._constructor = function () {
        let _this = this;
    };
    return Checkbox;
})();
namespace.html.Curtain = (() => {
    let Curtain = function () {
        let _this = document.createElement('curtain');
        Object.cloneData(_this, Curtain.prototype);
        return _this;
    };
    return Curtain;
})();
namespace.html.DOMCanvas = (() => {
    let DOMCanvas = function (resizable) {
        var _this = document.createElement('domcanvas');
        Object.cloneData(_this, DOMCanvas.prototype);
        _this.resizeCanvas = _this.resizeCanvas.bind(_this);
        _this._onBrowserResizeEventHandler = _this._onBrowserResizeEventHandler.bind(_this);
        _this._constructor(resizable);
        return _this;
    };
    DOMCanvas.prototype._constructor = function (resizable) {
        let _this = this;
        if (resizable == true) {
            EventListener.attach(namespace.__.BROWSER.resizeEvent, _this._onBrowserResizeEventHandler);
        }
    };
    DOMCanvas.prototype._onBrowserResizeEventHandler = function (eventArgs) {
        let _this = this;
        _this.resizeCanvas();
    };
    DOMCanvas.prototype.resizeCanvas = function () {
        var _this = this;
        var width = _this.parentElement.clientWidth;
        var height = _this.parentElement.clientHeight;
        _this.style.width = ScreenUnit.parse(width);
        _this.style.height = ScreenUnit.parse(height);
    };
    DOMCanvas.prototype.appendChild = function (element, posX, posY) {
        var _this = this;
        posX = typeof posX !== 'undefined' ? posX : 0;
        posY = typeof posY !== 'undefined' ? posY : 0;
        element.style.left = ScreenUnit.parse(posX);
        element.style.top = ScreenUnit.parse(posY);
        HTMLElement.prototype.appendChild.call(_this, element);
    };
    DOMCanvas.prototype.setBackground = function (value) {
        var _this = this;
        _this.style.background = value;
    };
    DOMCanvas.prototype.dispose = function () {
        EventListener.detach(namespace.__.BROWSER.resizeEvent, _this._onBrowserResizeEventHandler);
    };
    return DOMCanvas;
})();
namespace.html.DatePicker = (() => {
    let DatePicker = function (selectedDate) {
        var _this = document.createElement('datepicker');
        Object.cloneData(_this, DatePicker.prototype);
        _this.selectedDate = selectedDate;
        _this.minDate = Date.clone(selectedDate);
        _this.onDatePick = new Event();
        _this.onClose = new Event();
        _this._constructor();
        return _this;
    };
    DatePicker.prototype._constructor = function () {
        let _this = this;
        let topBar = new namespace.html.Div();
        topBar.addClass('top-bar');
        _this.appendChild(topBar);
        let leftButton = new namespace.html.Button('<');
        leftButton.onClick(_this.previousMonth.bind(_this));
        topBar.appendChild(leftButton);
        let middle = new namespace.html.Div();
        middle.addClass('middle');
        topBar.appendChild(middle);
        let rightButton = new namespace.html.Button('>');
        rightButton.onClick(_this.nextMonth.bind(_this));
        topBar.appendChild(rightButton);
        let content = new namespace.html.Div();
        content.addClass('content');
        _this.appendChild(content);
        _this._render();
    };
    DatePicker.prototype.dispose = function () {
        let _this = this;
        GarbageCollector.dispose(_this.onDatePick);
        GarbageCollector.dispose(_this.onClose);
    };
    DatePicker.prototype.pickDate = function (date) {
        let _this = this;
        let eventArgs = new EventArgs(_this);
        eventArgs.date = date;
        Event.fire(_this.onDatePick, eventArgs);
        _this.close();
    };
    DatePicker.prototype.close = function () {
        let _this = this;
        Event.fire(_this.onClose);
        _this.remove();
    };
    DatePicker.prototype.previousMonth = function () {
        let _this = this;
        _this.selectedDate.setMonth(_this.selectedDate.getMonth() - 1);
        _this._render();
    };
    DatePicker.prototype.nextMonth = function () {
        let _this = this;
        _this.selectedDate.setMonth(_this.selectedDate.getMonth() + 1);
        _this._render();
    };
    DatePicker.prototype._render = function () {
        let _this = this;
        let selectedDate = _this.selectedDate;
        let minDate = _this.minDate;
        let content = _this.children[1];
        content.empty();
        _this.querySelector('.top-bar .middle').innerHTML = Date.getMonthName(selectedDate.getMonth());
        let DAYS_IN_WEEK = 7;
        let days = namespace.html.DatePicker.getDataForMonth(selectedDate);
        var frag = document.createDocumentFragment();
        for (let i = 0; i < days.length;) {
            let week = new namespace.html.Div();
            week.addClass('week');
            for (let j = 0; j < DAYS_IN_WEEK; j++) {
                let zeroDate = days[i];
                let day = new namespace.html.Div();
                day.addClass('day');
                day.appendChild('<span>' + zeroDate.getDate() + '</span>');
                if (zeroDate >= minDate) {
                    day.onClick(_this.pickDate.bind(_this, zeroDate));
                }
                else {
                    day.addClass('not-allowed-day');
                }
                if (zeroDate.getMonth() != selectedDate.getMonth()) {
                    day.addClass('not-current-month');
                }
                if (j > 0) {
                    week.appendChild('<br>');
                }
                week.appendChild(day);
                i++;
            }
            frag.appendChild(week);
        }
        content.appendChild(frag);
    };
    DatePicker.getDataForMonth = function (selectedDay) {
        let zeroDate = Date.clone(Date.getMidnightDate(selectedDay));
        zeroDate.setDate(1);
        var dayIndex = zeroDate.getDay();
        if (dayIndex == 0) {
            dayIndex = 7;
        }
        dayIndex--;
        zeroDate.setDate(zeroDate.getDate() - dayIndex);
        let DAYS_IN_WEEK = 7;
        let days = new Array();
        do {
            for (let j = 0; j < DAYS_IN_WEEK; j++) {
                days.push(Date.clone(zeroDate));
                zeroDate.nextDay();
            }
        } while (zeroDate.getMonth() == selectedDay.getMonth());
        return days;
    };
    return DatePicker;
})();
namespace.html.Div = (() => {
    let Div = function () {
        let _this = document.createElement('div');
        Object.cloneData(_this, Div.prototype);
        return _this;
    };
    return Div;
})();
namespace.html.EmbeddedObject = (() => {
    let EmbeddedObject = function () {
        var _this = document.createElement('object');
        Object.cloneData(_this, EmbeddedObject.prototype);
        return _this;
    };
    return EmbeddedObject;
})();
namespace.html.FileDrop = (() => {
    let FileDrop = function () {
        var _this = document.createElement('filedrop');
        Object.cloneData(_this, FileDrop.prototype);
        return _this;
    };
    return FileDrop;
})();
namespace.html.FileInput = (() => {
    let FileInput = function () {
        var _this = document.createElement('input');
        _this.setAttribute('type', 'file');
        Object.cloneData(_this, FileInput.prototype);
        return _this;
    };
    return FileInput;
})();
namespace.html.Flex = (() => {
    let Flex = function () {
        var _this = document.createElement('flex');
        Object.cloneData(_this, Flex.prototype);
        return _this;
    };
    return Flex;
})();
namespace.html.Frame = (() => {
    let Frame = function () {
        var _this = document.createElement('frame');
        Object.cloneData(_this, Frame.prototype);
        return _this;
    };
    return Frame;
})();
var ANIMATION_END_NAMES = {
    webkit: 'webkitAnimationEnd',
    standard: 'animationend',
    ms: ' msAnimationEnd'
};
var TRANSITION_END_NAMES = {
    webkit: 'webkitTransitionEnd',
    standard: 'transitionend'
};
HTMLElement.parse = function (htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString;
    return div.firstChild;
};
HTMLElement.prototype.getPrecalculatedSize = function () {
    new Exception.NotImplemented();
};
HTMLElement.prototype.getTop = function (parent) {
    var _this = this;
    var box = _this.getBoundingClientRect();
    var body = document.body;
    var docEl = document.documentElement;
    var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
    var clientTop = docEl.clientTop || body.clientTop || 0;
    var top = Math.round(box.top + scrollTop - clientTop);
    if (parent) {
        var parentTop = parent.getTop();
        top = ScreenUnit.subtract(top, parentTop);
    }
    return top;
};
HTMLElement.prototype.getLeft = function (parent) {
    var _this = this;
    var box = _this.getBoundingClientRect();
    var body = document.body;
    var docEl = document.documentElement;
    var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;
    var clientLeft = docEl.clientLeft || body.clientLeft || 0;
    var left = Math.round(box.left + scrollLeft - clientLeft);
    if (parent) {
        var parentTop = parent.getLeft();
        left = ScreenUnit.subtract(left, parentTop);
    }
    return left;
};
HTMLElement.prototype.getOuterHeight = function () {
    let elmHeight;
    let elmMargin;
    let elmPadding;
    let elm = this;
    let computedStyle;
    if (document.all) {
        computedStyle = elm.currentStyle;
        elmHeight = parseFloat(computedStyle.height);
    }
    else {
        computedStyle = document.defaultView.getComputedStyle(elm, '');
        elmHeight = parseFloat(computedStyle.getPropertyValue('height'));
    }
    if (isNaN(elmHeight)) {
        elmHeight = 0;
    }
    if (elm.style.webkitBoxSizing == 'content-box') {
        if (document.all) {
            elmPadding = parseFloat(computedStyle.paddingTop, 10);
            elmPadding += parseFloat(computedStyle.paddingBottom, 10);
        }
        else {
            elmPadding = parseFloat(computedStyle.getPropertyValue('padding-top'));
            elmPadding += parseInt(computedStyle.getPropertyValue('padding-bottom'));
        }
        if (isNaN(elmPadding)) {
            elmPadding = 0;
        }
        elmHeight = ScreenUnit.add(elmHeight, elmPadding);
    }
    if (document.all) {
        elmMargin = parseFloat(computedStyle.marginTop, 10);
        elmMargin += parseFloat(computedStyle.marginBottom, 10);
    }
    else {
        elmMargin = parseFloat(computedStyle.getPropertyValue('margin-top'));
        elmMargin += parseInt(computedStyle.getPropertyValue('margin-bottom'));
    }
    if (isNaN(elmMargin)) {
        elmMargin = 0;
    }
    elmHeight = ScreenUnit.add(elmHeight, elmMargin);
    return elmHeight;
};
HTMLElement.prototype._appendChild = HTMLElement.prototype.appendChild;
HTMLElement.prototype.appendChild = function (value) {
    let _this = this;
    let element;
    if (typeof value == 'string') {
        element = HTMLElement.parse(value);
    }
    else {
        element = value;
    }
    _this._appendChild(element);
    _this.updateTrackChildren();
    _this.isInDOM = true;
};
HTMLElement.prototype.updateTrackChildren = function () {
    let _this = this;
    if (_this.hasAttribute('num-of-children') == false) {
        return;
    }
    _this.setAttribute('num-of-children', String(_this.children.length));
};
HTMLElement.prototype.trackChildren = function () {
    let _this = this;
    _this.setAttribute('num-of-children', '');
    _this.updateTrackChildren();
};
HTMLElement.prototype.removeClass = function (value) {
    this.classList.remove(value);
    return this;
};
HTMLElement.prototype.addClass = function (value) {
    this.classList.add(value);
    return this;
};
HTMLElement.prototype.hasClass = function (value) {
    for (var i = 0; i < this.classList.length; i++) {
        if (this.classList[i] == value) {
            return true;
        }
    }
    return false;
};
HTMLElement.prototype.empty = function () {
    let _this = this;
    _this.children.remove();
};
HTMLElement.prototype.removeJsClass = function (value) {
    let _this = this;
    let ATTR_NAME = 'js-class';
    return _this.removeDataClass(ATTR_NAME, value);
};
HTMLElement.prototype.addJsClass = function (value) {
    let _this = this;
    let ATTR_NAME = 'js-class';
    return _this.addDataClass(ATTR_NAME, value);
};
HTMLElement.prototype.hasJsClass = function (value) {
    let _this = this;
    let ATTR_NAME = 'js-class';
    return _this.hasDataClass(ATTR_NAME, value);
};
HTMLElement.prototype.unSelect = function () {
    let _this = this;
    let ATTR_NAME = 'selected';
    return _this.removeAttribute(ATTR_NAME);
};
HTMLElement.prototype.select = function () {
    let _this = this;
    let ATTR_NAME = 'selected';
    return _this.setAttribute(ATTR_NAME, '');
};
HTMLElement.prototype.isSelected = function () {
    let _this = this;
    let ATTR_NAME = 'selected';
    if (_this.hasAttribute(ATTR_NAME)) {
        return true;
    }
    return false;
};
HTMLElement.prototype.removeDataClass = function (ATTR_NAME, value) {
    let _this = this;
    let prevValue = _this.getAttribute(ATTR_NAME);
    if (!prevValue) {
        _this.removeAttribute(ATTR_NAME);
        return _this;
    }
    let prevValues = prevValue.split(" ");
    let index = prevValues.indexOf(value);
    if (index == -1) {
        return _this;
    }
    Array.removeAtIndex(prevValues, index);
    if (Array.isEmpty(prevValues)) {
        _this.removeAttribute(ATTR_NAME);
        return _this;
    }
    _this.setAttribute(ATTR_NAME, prevValues.join(' '));
    return _this;
};
HTMLElement.prototype.addDataClass = function (ATTR_NAME, value) {
    let _this = this;
    let prevValues;
    if (_this.hasAttribute(ATTR_NAME) == false) {
        prevValues = [];
    }
    else {
        if (_this.hasJsClass(value)) {
            return _this;
        }
        prevValues = _this.getAttribute(ATTR_NAME);
        prevValues = prevValues.split(" ");
    }
    prevValues.push(value);
    _this.setAttribute(ATTR_NAME, prevValues.join(' '));
    return _this;
};
HTMLElement.prototype.hasDataClass = function (ATTR_NAME, value) {
    let _this = this;
    if (_this.hasAttribute(ATTR_NAME) == false) {
        return false;
    }
    let prevValue = _this.getAttribute(ATTR_NAME);
    if (prevValue) {
        let values = prevValue.split(" ");
        if (values.indexOf(value) != -1) {
            return true;
        }
    }
    return false;
};
Element.prototype._traverseDownTheTree = function (options) {
    var _this = this;
    for (var i = 0; i < _this.children.length; i++) {
        var el = _this.children[i];
        if (el && el.parentElement) {
            el._traverseDownTheTree(options);
        }
    }
    if (options.dispose == true) {
        GarbageCollector.dispose(_this);
        _this.isInDOM = false;
    }
};
NodeList.prototype._traverseDownTheTree = HTMLCollection.prototype._traverseDownTheTree = function (options) {
    var _this = this;
    for (var i = 0; i < _this.length; i++) {
        var el = _this[i];
        if (el) {
            el._traverseDownTheTree(options);
        }
    }
};
Element.prototype.remove = function () {
    var _this = this;
    _this._traverseDownTheTree({ dispose: true });
    let parentElement = _this.parentElement;
    if (parentElement) {
        parentElement.removeChild(_this);
        parentElement.updateTrackChildren();
        parentElement.updateTrackLastChild();
    }
};
NodeList.prototype.remove = HTMLCollection.prototype.remove = function () {
    var _this = this;
    for (var i = _this.length - 1; i >= 0; i--) {
        var el = _this[i];
        if (el && el.parentElement) {
            el.remove();
        }
    }
};
HTMLElement.prototype.onClick = function (callback) {
    var _this = this;
    _this.addEventListener("click", callback);
    if (!_this.onDispose) {
        _this.onDispose = new Event();
    }
    let onDisposeEventHandler = (() => {
        _this.removeEventListener("click", callback);
    });
    OneTimeEventListener.attach(_this.onDispose, onDisposeEventHandler);
};
HTMLElement.prototype.onClickOnce = function (callback) {
    var _this = this;
    var preCallback = function () {
        _this.removeEventListener("click", preCallback);
        callback();
    };
    _this.onClick(_this, preCallback);
};
HTMLElement.prototype.updateTrackLastChild = function () {
    let _this = this;
    if (_this.hasJsClass('track-last-child') == false) {
        return;
    }
    for (let i = 0; i < _this.children.length; i++) {
        let child = _this.children[i];
        child.removeClass('last-child');
    }
    for (let i = _this.children.length - 1; i >= 0; i--) {
        let child = _this.children[i];
        if (child.isHidden() == true) {
            continue;
        }
        child.addClass('last-child');
        break;
    }
};
HTMLElement.prototype.trackLastChild = function () {
    let _this = this;
    _this.addJsClass('track-last-child');
    _this.updateTrackLastChild();
};
HTMLElement.prototype.hide = function () {
    let _this = this;
    _this.removeClass('visible');
    _this.addClass('hidden');
    if (_this.parentElement) {
        _this.parentElement.updateTrackLastChild();
    }
};
HTMLElement.prototype.isHidden = function () {
    let _this = this;
    if (_this.hasClass('hidden')) {
        return true;
    }
    return false;
};
HTMLElement.prototype.show = function () {
    let _this = this;
    _this.removeClass('hidden');
    _this.addClass('visible');
    if (_this.parentElement) {
        _this.parentElement.updateTrackLastChild();
    }
};
HTMLElement.prototype.isVisible = function () {
    let _this = this;
    if (_this.hasClass('hidden')) {
        return false;
    }
    return true;
};
HTMLElement.prototype.enableScrolling = function () {
    this.removeClass('scrolling-disabled');
};
HTMLElement.prototype.disableScrolling = function () {
    this.addClass('scrolling-disabled');
};
HTMLElement.prototype.enable = function () {
    let _this = this;
    let ATTR_NAME = 'disabled';
    return _this.removeAttribute(ATTR_NAME);
};
HTMLElement.prototype.isEnabled = function () {
    return !this.isDisable();
};
HTMLElement.prototype.disable = function () {
    let _this = this;
    let ATTR_NAME = 'disabled';
    return _this.setAttribute(ATTR_NAME, '');
};
HTMLElement.prototype.isDisable = function () {
    let _this = this;
    let ATTR_NAME = 'disabled';
    if (_this.hasAttribute(ATTR_NAME)) {
        return true;
    }
    return false;
};
HTMLElement.prototype.removeError = function () {
    let _this = this;
    let ATTR_NAME = 'error';
    return _this.removeAttribute(ATTR_NAME);
};
HTMLElement.prototype.addError = function () {
    let _this = this;
    let ATTR_NAME = 'error';
    return _this.setAttribute(ATTR_NAME, '');
};
HTMLElement.prototype.hasError = function () {
    let _this = this;
    let ATTR_NAME = 'error';
    if (_this.hasAttribute(ATTR_NAME)) {
        return true;
    }
    return false;
};
HTMLElement.prototype.removeAnimationClass = function (value) {
    let _this = this;
    let ATTR_NAME = 'css-animation-class';
    return _this.removeDataClass(ATTR_NAME, value);
};
HTMLElement.prototype.addAnimationClass = function (value) {
    let _this = this;
    let ATTR_NAME = 'css-animation-class';
    return _this.addDataClass(ATTR_NAME, value);
};
HTMLElement.prototype.hasAnimationClass = function (value) {
    let _this = this;
    let ATTR_NAME = 'css-animation-class';
    return _this.hasDataClass(ATTR_NAME, value);
};
HTMLElement.prototype.cssAnimation = function (animationClass, callback) {
    callback = callback ? callback : Function.empty;
    var element = this;
    var onAnimationEndRef = null;
    var onAnimationEnded = () => {
        element.removeEventListener(ANIMATION_END_NAMES.webkit, onAnimationEndRef);
        element.removeEventListener(ANIMATION_END_NAMES.standard, onAnimationEndRef);
        element.removeEventListener(ANIMATION_END_NAMES.ms, onAnimationEndRef);
        element.removeAnimationClass(animationClass);
        callback();
    };
    onAnimationEndRef = onAnimationEnded;
    element.addAnimationClass(animationClass);
    element.removeEventListener(ANIMATION_END_NAMES.webkit, onAnimationEndRef);
    element.removeEventListener(ANIMATION_END_NAMES.standard, onAnimationEndRef);
    element.removeEventListener(ANIMATION_END_NAMES.ms, onAnimationEndRef);
    var options = { once: true };
    element.addEventListener(ANIMATION_END_NAMES.webkit, onAnimationEndRef, options);
    element.addEventListener(ANIMATION_END_NAMES.standard, onAnimationEndRef, options);
    element.addEventListener(ANIMATION_END_NAMES.ms, onAnimationEndRef, options);
};
HTMLElement.forceReflow = function (_this) {
    _this.offsetHeight;
};
namespace.html.HTMLProperty = (() => {
    let HTMLProperty = function (value) {
        this.value = value;
        this.onUpdate = new Event();
    };
    return HTMLProperty;
})();
_this.NotifyUpdate = function (property) {
    if (!(property instanceof namespace.html.HTMLProperty)) {
        new Exception.Other('Cannot notify element that is not of namespace.html.HTMLProperty type!');
    }
    Event.fire(property.onUpdate);
};
namespace.html.Icon = (() => {
    let Icon = function () {
        var _this = document.createElement('icon');
        Object.cloneData(_this, Icon.prototype);
        return _this;
    };
    return Icon;
})();
namespace.html.Image = (() => {
    let _Image = function (src) {
        var _this = document.createElement('img');
        Object.cloneData(_this, _Image.prototype);
        _this._constructor(src);
        return _this;
    };
    _Image.prototype._constructor = function (src) {
        let _this = this;
        if (src) {
            _this.src = src;
        }
    };
    return _Image;
})();
namespace.html.Input = (() => {
    let Input = function () {
        var _this = document.createElement('input');
        Object.cloneData(_this, Input.prototype);
        return _this;
    };
    return Input;
})();
namespace.html.Label = (() => {
    let Label = function () {
        var _this = document.createElement('label');
        Object.cloneData(_this, Label.prototype);
        return _this;
    };
    return Label;
})();
namespace.html.LoadingBar = (() => {
    let LoadingBar = function () {
        let _this = document.createElement('loadingbar');
        Object.cloneData(_this, LoadingBar.prototype);
        _this.appendChild('<div class="progress"></div>');
        return _this;
    };
    return LoadingBar;
})();
namespace.html.NumberInput = (() => {
    let NumberInput = function () {
        var _this = document.createElement('input');
        Object.cloneData(_this, NumberInput.prototype);
        _this.setAttribute('type', 'number');
        return _this;
    };
    return NumberInput;
})();
namespace.html.ObservableArray = (() => {
    let ObservableArray = function (bindToElement) {
        this.value = new Array();
        this.elementBlockValues = new Array();
        this.bindToElement = null;
        this.template = Function.empty;
        this._constructor(bindToElement);
    };
    ObservableArray.prototype._constructor = function (bindToElement) {
        let _this = this;
        _this.bindToElement = bindToElement ? bindToElement : null;
    };
    ObservableArray.prototype.push = function (data) {
        let _this = this;
        let elements = _this.template(_this.value.length, data);
        _this.value.push(data);
        _this.elementBlockValues.push(elements);
        if (elements) {
            if (elements instanceof Array) {
                for (let i = 0; i < elements.length; i++) {
                    _this.bindToElement.appendChild(elements[i]);
                }
            }
            else {
                _this.bindToElement.appendChild(elements);
            }
        }
    };
    ObservableArray.prototype.pop = function () {
        let _this = this;
        let elements = _this.elementBlockValues.pop();
        if (elements) {
            if (elements instanceof Array) {
                for (let i = 0; i < elements.length; i++) {
                    elements[i].remove();
                }
            }
            else {
                elements.remove();
            }
        }
        return _this.value.pop();
    };
    ObservableArray.prototype.shift = function () {
        let _this = this;
        let elements = _this.elementBlockValues.shift();
        if (elements) {
            if (elements instanceof Array) {
                for (let i = 0; i < elements.length; i++) {
                    elements[i].remove();
                }
            }
            else {
                elements.remove();
            }
        }
        return _this.value.shift();
    };
    ObservableArray.prototype.splice = function (start, deleteCount) {
        let _this = this;
        deleteCount = typeof deleteCount !== 'undefined' ? deleteCount : _this.value.length - start;
        let arrayOfElements = _this.elementBlockValues.splice(start, deleteCount);
        for (let j = 0; j < arrayOfElements.length; j++) {
            let elements = arrayOfElements[j];
            if (elements) {
                if (elements instanceof Array) {
                    for (let i = 0; i < elements.length; i++) {
                        elements[i].remove();
                    }
                }
                else {
                    elements.remove();
                }
            }
        }
        return _this.value.splice(start, deleteCount);
    };
    return ObservableArray;
})();
namespace.html.ObservableNumber = (() => {
    let ObservableNumber = function (bindToElement) {
        this.elementBlockValues = null;
        this.bindToElement = null;
        this._constructor(bindToElement);
    };
    ObservableNumber.prototype._constructor = function (bindToElement) {
        let _this = this;
        _this.bindToElement = bindToElement ? bindToElement : null;
    };
    ObservableNumber.prototype.setValue = function (val) {
        let _this = this;
        if (typeof val === 'string') {
            val = Number(val);
        }
        if (_this.bindToElement instanceof HTMLInputElement) {
            _this.bindToElement.value = val;
        }
        else {
            _this.bindToElement.innerHTML = val;
        }
    };
    ObservableNumber.prototype.getValue = function () {
        let _this = this;
        if (_this.bindToElement instanceof HTMLInputElement) {
            return Number(_this.bindToElement.value);
        }
        else {
            return Number(_this.bindToElement.innerHTML);
        }
    };
    return ObservableNumber;
})();
namespace.html.ObservableString = (() => {
    let ObservableString = function (bindToElement) {
        this.elementBlockValues = null;
        this.bindToElement = null;
        this._constructor(bindToElement);
    };
    ObservableString.prototype._constructor = function (bindToElement) {
        let _this = this;
        _this.bindToElement = bindToElement ? bindToElement : null;
    };
    ObservableString.prototype.setValue = function (val) {
        let _this = this;
        if (_this.bindToElement instanceof HTMLInputElement) {
            _this.bindToElement.value = val;
        }
        else {
            _this.bindToElement.innerHTML = val;
        }
    };
    ObservableString.prototype.getValue = function () {
        let _this = this;
        if (_this.bindToElement instanceof HTMLInputElement) {
            return _this.bindToElement.value;
        }
        else {
            return _this.bindToElement.innerHTML;
        }
    };
    return ObservableString;
})();
namespace.html.Paragraph = (() => {
    let Paragraph = function () {
        var _this = document.createElement('p');
        Object.cloneData(_this, Paragraph.prototype);
        return _this;
    };
    return Paragraph;
})();
namespace.html.PasswordInput = (() => {
    let PasswordInput = function () {
        var _this = document.createElement('input');
        Object.cloneData(_this, PasswordInput.prototype);
        _this.setAttribute('type', 'password');
        return _this;
    };
    PasswordInput.prototype.allowOnlyNumbers = function () {
        let _this = this;
        new Exception.NotImplemented();
    };
    return PasswordInput;
})();
namespace.html.RadioButton = (() => {
    let RadioButton = function () {
        var _this = document.createElement('input');
        _this.setAttribute('type', 'radio');
        Object.cloneData(_this, RadioButton.prototype);
        _this._constructor();
        return _this;
    };
    RadioButton.prototype._constructor = function () {
        let _this = this;
    };
    return RadioButton;
})();
namespace.html.ReservedSpace = (() => {
    let ReservedSpace = function () {
        var _this = document.createElement('reservedspace');
        Object.cloneData(_this, ReservedSpace.prototype);
        return _this;
    };
    return ReservedSpace;
})();
namespace.html.ScrollViewer = (() => {
    let ScrollViewer = function (element) {
        var _this;
        if (typeof element !== 'undefined') {
            _this = element;
            Object.cloneData(_this, ScrollViewer.prototype);
        }
        else {
            _this = document.createElement('scrollviewer');
            Object.cloneData(_this, ScrollViewer.prototype);
        }
        _this._constructor();
        return _this;
    };
    ScrollViewer.prototype._constructor = function () {
        let _this = this;
        _this._onScroll = _this._onScroll.bind(this);
        _this.setAttribute('scroll-x', 0);
        _this.setAttribute('scroll-y', 0);
        _this.onscroll = _this._onScroll;
    };
    ScrollViewer.prototype._onScroll = function (event) {
        let _this = this;
        _this.setAttribute('scroll-x', _this.scrollLeft);
        _this.setAttribute('scroll-y', _this.scrollTop);
    };
    ScrollViewer.prototype.scrollIntoView = function (par1, par2) {
        let _this = this;
        if (par1 instanceof HTMLElement) {
            let top;
            top = ScreenUnit.add(_this.scrollTop, par1.getTop(_this));
            top = ScreenUnit.add(top, par1.clientHeight / 4);
            top = ScreenUnit.subtract(top, _this.clientHeight / 2);
            _this.scrollTop = ScreenUnit.getValue(top);
            let left;
            left = ScreenUnit.add(_this.scrollLeft, par1.getLeft(_this));
            left = ScreenUnit.add(left, par1.clientWidth / 4);
            left = ScreenUnit.subtract(left, _this.clientWidth / 2);
            _this.scrollLeft = ScreenUnit.getValue(left);
        }
        else {
            if (typeof par1 == 'number') {
                _this.scrollTop = par1;
            }
            if (typeof par2 == 'number') {
                _this.scrollLeft = par2;
            }
        }
    };
    return ScrollViewer;
})();
namespace.html.Span = (() => {
    let Span = function () {
        var _this = document.createElement('span');
        Object.cloneData(_this, Span.prototype);
        return _this;
    };
    return Span;
})();
namespace.html.SpriteIcon = (() => {
    let SpriteIcon = function () {
        var _this = document.createElement('spriteicon');
        Object.cloneData(_this, SpriteIcon.prototype);
        return _this;
    };
    return SpriteIcon;
})();
namespace.html.Table = (() => {
    let Table = function () {
        var _this = document.createElement('table');
        Object.cloneData(_this, Table.prototype);
        return _this;
    };
    return Table;
})();
namespace.html.Row = (() => {
    let Row = function () {
        var _this = document.createElement('tr');
        return _this;
    };
    return Row;
})();
namespace.html.Column = (() => {
    let Column = function () {
        var _this = document.createElement('td');
        return _this;
    };
    return Column;
})();
namespace.html.TextArea = (() => {
    let TextArea = function () {
        var _this = document.createElement('textarea');
        Object.cloneData(_this, TextArea.prototype);
        return _this;
    };
    return TextArea;
})();
namespace.html.TextInput = (() => {
    let TextInput = function () {
        var _this = document.createElement('input');
        _this.setAttribute('type', 'text');
        Object.cloneData(_this, TextInput.prototype);
        return _this;
    };
    return TextInput;
})();
namespace.html.TimePicker = (() => {
    let TimePicker = function (selectedHour, selectedMinute) {
        var _this = document.createElement('timepicker');
        Object.cloneData(_this, TimePicker.prototype);
        _this.selectedHour = 0;
        _this.selectedMinute = 0;
        _this.onSelect = new Event();
        _this.onClose = new Event();
        _this._constructor(selectedHour, selectedMinute);
        return _this;
    };
    TimePicker.prototype._constructor = function (selectedHour, selectedMinute) {
        let _this = this;
        _this.selectedHour = selectedHour;
        _this.selectedMinute = selectedMinute;
    };
    TimePicker.prototype.dispose = function () {
        let _this = this;
        GarbageCollector.dispose(_this.onSelect);
        GarbageCollector.dispose(_this.onClose);
    };
    TimePicker.prototype.pickDate = function () {
        let _this = this;
        let eventArgs = new EventArgs(_this);
        eventArgs.selectedHour = _this.selectedHour;
        eventArgs.selectedMinute = _this.selectedMinute;
        Event.fire(_this.onSelect, eventArgs);
        _this.close();
    };
    TimePicker.prototype.close = function () {
        let _this = this;
        _this._validate();
        Event.fire(_this.onClose);
        _this.remove();
    };
    TimePicker.prototype._validate = function () {
        let _this = this;
        if (_this.selectedHour < 0) {
            _this.selectedHour = 0;
        }
        if (_this.selectedHour >= 24) {
            _this.selectedHour = 23;
        }
        if (_this.selectedMinute < 0) {
            _this.selectedMinute = 0;
        }
        if (_this.selectedMinute >= 60) {
            _this.selectedMinute = 59;
        }
    };
    TimePicker.prototype._render = function () {
        let _this = this;
        let frag = document.createDocumentFragment();
        let hour = 0;
        let minutes = 0;
        while (hour < 24) {
            let divHour = new namespace.html.Div();
            divHour.innerHTML = hour + ':' + minutes;
            frag.append(divHour);
            minutes += 30;
            if (minutes >= 60) {
                minutes = 0;
                hour++;
            }
        }
        _this.appendChild(frag);
    };
    return TimePicker;
})();
namespace.html.Video = (() => {
    let Video = function () {
        var _this = document.createElement('video');
        Object.cloneData(_this, Video.prototype);
        return _this;
    };
    return Video;
})();
namespace.html.Wrapper = (() => {
    let Wrapper = function () {
        var _this = document.createElement('wrapper_');
        Object.cloneData(_this, Wrapper.prototype);
        return _this;
    };
    return Wrapper;
})();
