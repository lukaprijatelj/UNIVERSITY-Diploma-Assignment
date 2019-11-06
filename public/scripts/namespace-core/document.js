/**
 * 
 * Example of how to use loader:
 * (async () =>
 * {
 *    await document.loadScript('test.js');
 *    await document.loadStyle('test.css');
 * })();
 */
 

/**
 * Starts loading file.
 */
document.loadScript = function(filepath)
{
    let TYPE_ATTRIBUTE = 'namespace-core:js-loader';
    let loaderTag = document.querySelector('script[type="' + TYPE_ATTRIBUTE + '"]');

    if (!loaderTag)
    {
        // loader tag is missing in HTML document - it should always be present on the *.html file

        console.error('Script tag with type attribute of "' + TYPE_ATTRIBUTE + '" was not found in <head> tag!');
        return;
    }

    return new Promise((resolve, reject) => 
    {        
        let tag = document.createElement('script');
        tag.setAttribute("type", "text/javascript");
        tag.setAttribute("src", filepath);

        tag.onload = () =>
        {
            resolve();
        };
        tag.onerror = () =>
        {
            reject();
        };

        loaderTag.parentNode.insertBefore(tag, loaderTag);
    });
};

/**
 * Starts loading file.
 */
document.loadStyle = function(filepath)
{
    let TYPE_ATTRIBUTE = 'namespace-core:css-loader';
    let loaderTag = document.querySelector('script[type="' + TYPE_ATTRIBUTE + '"]');

    if (!loaderTag)
    {
        // loader tag is missing in HTML document - it should always be present on the *.html file
        
        console.error('Script tag with type attribute of "' + TYPE_ATTRIBUTE + '" was not found in <head> tag!');
        return;
    }

    return new Promise((resolve, reject) => 
    {
        let tag = document.createElement("link");
        tag.setAttribute("rel", "stylesheet");
        tag.setAttribute("type", "text/css");
        tag.setAttribute("href", filepath);

        tag.onload = () =>
        {
            resolve();
        };
        tag.onerror = () =>
        {
            reject();
        };

        loaderTag.parentNode.insertBefore(tag, loaderTag);
    });
};