function HTML_ELEMENT(selector)
{
    this.elements = document.querySelectorAll(selector);
}

var HTML = (function(selector) {
    return new HTML_ELEMENT(selector);
});

HTML_ELEMENT.prototype.__parseElementFromString = function(htmlString)
{
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();

    // Change this to div.childNodes to support multiple top-level nodes
    return div.firstChild; 
};

HTML_ELEMENT.prototype.addClass = function(value)
{
    var elements = this.elements;

    for (var i=0; i<elements.length; i++)
    {
        var currentElement = elements[i];

        currentElement.classList.add(value);
    }

    return this;
};

HTML_ELEMENT.prototype.removeClass = function(value)
{
    var elements = this.elements;

    for (var i=0; i<elements.length; i++)
    {
        var currentElement = elements[i];

        currentElement.classList.remove(value);
    }

    return this;
};

HTML_ELEMENT.prototype.getHtml = function()
{
    if (!this.elements || !this.elements.length)
    {
        return null;
    }

    return this.elements[0].innerHTML;
};

HTML_ELEMENT.prototype.empty = function()
{
    this.setHtml('');
};

HTML_ELEMENT.prototype.setHtml = function(value)
{
    if (typeof value !== 'string')
    {
        return;
    }

    var elements = this.elements;

    for (var i=0; i<elements.length; i++)
    {
        var currentElement = elements[i];

        currentElement.innerHTML = value;
    }

    return this;
}

HTML_ELEMENT.prototype.append = function(value)
{
    var elements = this.elements;

    for (var i=0; i<elements.length; i++)
    {
        var currentElement = elements[i];

        if (typeof value === 'string')
        {
            currentElement.innerHTML += value;
        }
        else if (value instanceof HTML)
        {
            currentElement.innerHTML += value.getHtml();
        }
    }

    return this;
};