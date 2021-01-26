$(document).ready(function () {

    const socket = io("https://everyone.dance:2053");

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

        $('div.button.download').remove();
    }
    else
    {
        // Browser only code
        $('div.close-button').remove();
        $('div.button.install').remove();
    }

    function ToggleGameCodeDisplay(enabled)
    {
        $(`input.gamecode`).val("");
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
    $('div.button.join').on('click', function(e)
    {
        ToggleGameCodeDisplay(true);
    })
    
    // User clicks the create button
    $('div.button.create').on('click', function(e)
    {
        ToggleGameCodeDisplay(false);
        if (!socket.connected) {return;}
    })
    
    // User clicks the install button
    $('div.button.install').on('click', function(e)
    {
        if ($(this).hasClass('disabled')) {return;}
        ToggleGameCodeDisplay(false);
    })

    // User clicks the download button
    $('div.button.download').on('click', function(e)
    {
        if ($(this).hasClass('disabled')) {return;}
        ToggleGameCodeDisplay(false);
    })

    $('input.gamecode').on('input keyup blur', function(e)
    {
        const input = $(this);
        input.val(input.val().toUpperCase().replace(/[^A-Z]/g,''));
    })

    // User clicks the arrow to submit gamecode button
    $('div.submit-gamecode-button').on('click', function(e)
    {
        const game_code = $(`input.gamecode`).val().toUpperCase().trim();

        if (game_code.length != 4) {return;}
        if (!socket.connected) {return;}

        // Try to enter game
        // TODO: block spammed requests

        ToggleGameCodeDisplay(false);
    })

    socket.on('connect', () => 
    {
        $('div.connecting-icon').fadeOut(200);
    })

    socket.on('disconnect', () => 
    {
        $('div.connecting-icon').fadeIn(200);
    })

})