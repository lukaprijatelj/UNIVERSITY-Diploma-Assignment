var _this = this;

if (typeof _this.namespace == 'undefined')
{
    _this.namespace = new Object();
}

if (typeof namespace.html == 'undefined')
{
    namespace.html = new Object();
}

/**
 * All functions needed to extend Div class can be implemented via HTMLDivElement.prototype object.
 */
(() => 
{
    let Dropdown = namespace.html.Dropdown = function()
    {
		let _this = document.createElement('dropdown');
		Object.cloneData(_this, Dropdown.prototype);

		return _this;
	}
})();