/**
 * @fileoverview Basic custom event functions for easier development
 * @include "../includes.js"
 */

/*jslint nomen: true*/

/**
 * Class for custom events.
 * @constructor 
 */
var BasicEvent = function()
{
    /**
     * List of listener functions to be notified when event is invoked.
     * @private
     * @type {Array<Function>} 
     * @default
     */
    this._handlers = [];

    /**
     * Is event handler disabled.
     * @type {boolean}
     * @private
     * @default
     */
    this._isDisabled = false;
};

/**
 * Enables event handler.
 */
BasicEvent.prototype.enable = function()
{
    this._isDisabled = false;
};

/**
 * Disables event handler.
 */
BasicEvent.prototype.disable = function()
{
    this._isDisabled = true;
};

/**
 * Adds callback for when this event will be invoked.
 * @param {Function} handler - callback function for when event is invoked
 */
BasicEvent.prototype.addHandler = function(handler)
{
    if (!handler)
    {
        warning('[BasicEvent] Handler function is undefined! (aborting)');
        return null;
    }    

    for(var i = 0; i < this._handlers.length; i++)
    {
        var eventHandler = this._handlers[i];

        if (eventHandler == handler)
        {
            warning('[BasicEvent] Cannot add handler function that already exists! (aborting)');
            return eventHandler;
        }
    }

    this._handlers.push(handler);
};

/**
 * Removes listener function.
 * @param {Function} handler - function listener that will be removed from array
 */
BasicEvent.prototype.removeHandler = function(handler)
{
    if (this._isDisabled == true)
    {
        return;
    }

    if (!handler)
    {
        warning('[BasicEvent] Handler function is undefined! (aborting)');
        return;
    }    

    for(var i = 0; i < this._handlers.length; i++)
    {
        var eventHandler = this._handlers[i];

        if (eventHandler == handler)
        {
            this._handlers.splice(i, 1);
            break;
        }
    }
};

/**
 * Invokes event listeners.
 * Parameters are optional.
 * @param {*=} par1 - parameter (optional)
 * @param {*=} par2 - parameter (optional)
 * @param {*=} par3 - parameter (optional)
 * @param {*=} par4 - parameter (optional)
 * @param {*=} par5 - parameter (optional)
 * @param {*=} par6 - parameter (optional)
 * @param {*=} par7 - parameter (optional)
 * @param {*=} par8 - parameter (optional)
 * @param {*=} par9 - parameter (optional)
 * @param {*=} par10 - parameter (optional)
 */
BasicEvent.prototype.invoke = function(par1, par2, par3, par4, par5, par6, par7, par8, par9, par10)
{    
    for(var i = 0; i < this._handlers.length; i++)
    {
        var eventHandler = this._handlers[i];

        //debug('[Executing event handler #' + i + ']');
        
        eventHandler(par1, par2, par3, par4, par5, par6, par7, par8, par9, par10);
    }
};