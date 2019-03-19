var UPLOAD = 
{
    /**
     * Main initialize function.
     */
    init: function()
    {
        document.querySelector('#upload-button-container .button').onclick = UPLOAD.onUploadButtonClick;

        document.getElementById('upload-file-input').onchange = UPLOAD.onFileUploadChange;
    },

    /**
     * Upload file button was clicked.
     * @param {MouseEvent} event 
     */
    onUploadButtonClick: function(event)
    {
        document.getElementById('upload-file-input').click();
    },

    onFileUploadChange: function(event)
    {
        console.log(event);

        document.getElementById("scene-upload-form").submit();
    }
};