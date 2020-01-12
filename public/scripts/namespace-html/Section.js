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
    let Section = namespace.html.Section = function()
    {
		let _this = document.createElement('Section');
		Object.cloneData(_this, Section.prototype);

		return _this;
	}
})();