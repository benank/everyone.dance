$(document).ready(function () {

    const socket = io("https://everyone.dance:2053");
    console.log(socket);

    const IS_ELECTRON = typeof require != 'undefined';

    $('input.gamecode').hide();
    $('div.submit-gamecode-button').hide();

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

    function ToggleGameCodeDisplay(enabled)
    {
        if (enabled)
        {
            $('div.button.join').hide();
            $('input.gamecode').show();
            $('div.submit-gamecode-button').show();
            $('input.gamecode').focus();
        }
        else
        {
            $('div.button.join').show();
            $('input.gamecode').hide();
            $('div.submit-gamecode-button').hide();
            $('input.gamecode').blur();
        }
    }

    // User clicks the join button
    $('div.button.join').on('click', (e) => 
    {
        ToggleGameCodeDisplay(true);
    })
    
    // User clicks the create button
    $('div.button.create').on('click', (e) => 
    {
        ToggleGameCodeDisplay(false);
    })
    
    // User clicks the install button
    $('div.button.install').on('click', (e) => 
    {
        ToggleGameCodeDisplay(false);
    })

    $('input.gamecode').on('input keyup blur', function(e)
    {
        const input = $(this);
        input.val(input.val().toUpperCase().replace(/[^A-Z]/g,'') );
    })

})