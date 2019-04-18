var HTML = (function(selector) {
    return new HTML_ELEMENT(selector);
});

function HTML_ELEMENT(selector)
{
    this.elements = document.querySelectorAll(selector);

    this.enabled = true;
}

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

HTML_ELEMENT.prototype.hide = function()
{
    this.removeClass('visible');
    this.addClass('hidden');
};

HTML_ELEMENT.prototype.show = function()
{
    this.removeClass('hidden');
    this.addClass('visible');
};

HTML_ELEMENT.prototype.enable = function()
{
    this.removeClass('disabled');
    this.enable = false;
};

HTML_ELEMENT.prototype.disable = function()
{
    this.addClass('disabled');
    this.enable = true;
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
            var elements = this.elements;

            for (var i=0; i<elements.length; i++)
            {
                var currentElement = elements[i];

                for (var j=0; j<value.elements.length; j++)
                {
                    var newCurrentElement = value.elements[j];

                    currentElement.appendChild(newCurrentElement);
                }
            }
        }
    }

    return this;
};