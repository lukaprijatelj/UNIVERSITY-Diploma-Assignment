/**
 * Timer class.
 * @constructor 
 * @param {number=} timeInMiliseconds - time specified in miliseconds (optional)
 */
function Timer(timeInMiliseconds)
{
    /**
     * Needs timer looping.
     * @private
     * @type {boolean}
     * @default
     */
    this._needsLooping = false;

    /**
     * Time of the timer.
     * @private
     * @type {number}
     * @default
     */
    this._timeInMiliseconds = (timeInMiliseconds >= 0) ? timeInMiliseconds : -1;

    /**
     * Id of the timer that setTimeout function returns.
     * @private
     * @type {number|null}
     * @default
     */
    this._id = null;

    /**
     * basic event for handling timer ticks.
     * @private
     * @type {BasicEvent}
     */
    this.callback = Function.empty;    
}

/**
 * Sets looping flag to true.
 */
Timer.prototype.enableLooping = function()
{
    this._needsLooping = true;
};

/**
 * Sets looping flag to false.
 */
Timer.prototype.disableLooping = function()
{
    this._needsLooping = true;
};

/**
 * Sets new time for timer.
 * @param {number} miliseconds - time in miliseconds 
 */
Timer.prototype.setTime = function(miliseconds)
{
    this._timeInMiliseconds = miliseconds;
};

/**
 * Sets timer to browser.
 * @private
 */
Timer.prototype._setTimer = function()
{
    if (this._timeInMiliseconds < 0)
    {
        warning('[Timer] Invalid timer value "' + this._timeInMiliseconds + '" (aborting)');
        return;
    }

    var preCallback = function()
    {    
        if (this._needsLooping == true)
        {
            this.restart();
        }
        
        this.callback();
    };
    this._id = window.setTimeout(preCallback.bind(this), this._timeInMiliseconds);
};

/**
 * Clears timer from browser.
 * @private
 */
Timer.prototype._clearTimer = function()
{
    if(!this._id)
    {
        return;
    }

    window.clearTimeout(this._id);

    this._id = null;
};

/**
 * Is timer active.
 * @return {boolean}
 */
Timer.prototype.isActive = function()
{
    if (this._id)
    {
        return true;
    }

    return false;
};

/**
 * Restarts timer.
 */
Timer.prototype.restart = function()
{
    this._clearTimer();
    this._setTimer();
};

/**
 * Starts timer.
 */
Timer.prototype.start = function()
{
    this._setTimer();
};

/**
 * Stops timer.
 */
Timer.prototype.stop = function()
{
    this._clearTimer();
};