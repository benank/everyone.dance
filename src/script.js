$(document).ready(function () {

    const IS_ELECTRON = typeof require != 'undefined';

    // Electron-only code
    if (IS_ELECTRON)
    {
        const remote = require('electron').remote;

        $('div.close-button').on('click', (e) => 
        {
            window = remote.getCurrentWindow();
            window.close();
        })
    }
    else
    {
        // Browser only code
        $('div.close-button').remove();
    }
})