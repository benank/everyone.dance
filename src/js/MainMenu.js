import React, {useState, useEffect} from 'react';
import '../styles/font.scss'
import "../styles/main_menu.scss"

import forward_arrow_icon from '../icons/arrow_forward-24px.svg'
import { APP_STATE } from './constants/app_state'
import { VERSION } from "./constants/version"
import {isWebVersion} from "./constants/isWebVersion"


export default class MainMenu extends React.Component {

    constructor (props)
    {
        super(props);
        this.state = 
        {
            game_code_open: false,
            game_code_input_value: ""
        }
    }

    click_join_game()
    {
        this.setState({game_code_open: true})
    }

    click_submit_gamecode()
    {
        if (this.state.game_code_input_value.length != 4) {return;}
        if (!this.props.socket.connected) {return;}

        this.props.socket.emit("enter game code", {
            game_code: this.state.game_code_input_value, 
            isWebVersion: isWebVersion
        });
        this.state.game_code_input_value = "";
    }

    input_code_field_changed(event)
    {
        const input = event.target.value.toUpperCase().replace(/[^A-Z]/g,'');
        this.setState({game_code_input_value: input});
    }

    click_create_game_room()
    {
        if (!this.props.socket || !this.props.socket.connected) {return;}

        this.props.socket.emit("create game room");
    }

    click_update()
    {
        this.props.setAppState(APP_STATE.UPDATE_VIEW);
        electron.send("start update");
    }

    get_latest_version()
    {
        return typeof this.props.latest_version.length > 0 ? this.props.latest_version : VERSION;
    }

    click_help()
    {
        const link = `https://www.youtube.com/watch?v=aYH5NSDtg5M`;

        if (isWebVersion)
        {
            window.open(link, "_blank");
        }
        else
        {
            electron.shell.openExternal(link);
        }
    }

    click_download()
    {
        let filename = "";

        if (window.navigator.userAgent.indexOf("Windows") != -1) {filename = "everyone.dance-win32-x64.zip"}
        else if (window.navigator.userAgent.indexOf("Mac") != -1) {filename = "everyone.dance-macos-x64.zip"}
        else if (window.navigator.userAgent.indexOf("Linux") != -1) {filename = "everyone.dance-linux-x64.zip"}

        const link = `https://github.com/benank/everyone.dance/releases/download/${this.get_latest_version()}/${filename}`;

        if (isWebVersion)
        {
            window.open(link, "_blank");
        }
        else
        {
            electron.shell.openExternal(link);
            setTimeout(() => {
                electron.closeWindow();
            }, 500);
        }
    }

    render () {
        return (
            <>
                <div className="main-menu-title-container">
                    <div className="title">everyone.dance</div>
                    <div className="buttons-container">
                        {!this.state.game_code_open && <div className="button join" onClick={() => this.click_join_game()}>
                            {!isWebVersion ? "Join a Game" : "Spectate a Game"}
                        </div>}
                        {this.state.game_code_open && <div className="gamecode-container">
                            <input 
                                className="gamecode" 
                                type="text" 
                                pattern="[^A-Z]+" 
                                maxLength="4" 
                                placeholder="Game Code" 
                                value={this.state.game_code_input_value}
                                onChange={(event) => this.input_code_field_changed(event)}></input>
                            {this.state.game_code_input_value.length == 4 && <img src={forward_arrow_icon} className="submit-gamecode-button" onClick={() => this.click_submit_gamecode()}></img>}
                        </div>}
                        {!isWebVersion && <div className="button create" onClick={() => this.click_create_game_room()}>Create a Game</div>}
                        {/* {(!isWebVersion && this.props.update_ready) && <div className="button update" onClick={() => this.click_update()}>Update</div>} */}
                        {isWebVersion && 
                            <div className="button github" onClick={() => window.open("https://github.com/benank/everyone.dance", "_blank")}>GitHub</div>}
                        {!isWebVersion && <div className="button install" onClick={() => this.props.setAppState(APP_STATE.INSTALL_VIEW)}>Installation</div>}
                        {(isWebVersion || this.props.update_ready) && <div className="button download" onClick={() => this.click_download()}>{isWebVersion ? "Download" : "Update"}</div>}
                        {<div className="button help" onClick={() => this.click_help()}>Help</div>}
                    </div>
                </div>
            </>
        )
    }
}