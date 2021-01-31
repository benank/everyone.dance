import React, {useState, useEffect} from 'react';
import * as io from "socket.io-client";
import "../styles/app.scss"

import loading_icon from '../icons/autorenew-24px.svg'
import close_icon from '../icons/close-24px.svg'

import { APP_STATE } from './constants/app_state'

import '../styles/font.scss'

import MainMenu from './MainMenu'
import GameRoom from './GameRoom'
import InstallMenu from './InstallMenu';

const ENDPOINT = "https://everyone.dance:2053"

export default class App extends React.Component {

    constructor (props)
    {
        super(props);
        this.state = 
        {
            connected: false,
            app_state: APP_STATE.MAIN_MENU,
            game_room_data: {}
        }
    }

    componentDidMount()
    {
        this.socket = io(ENDPOINT);

        this.socket.on("connect", () => 
        {
            this.setState({connected: true});
            if (localStorage.getItem("player_name"))
            {
                this.socket.emit("set name", localStorage.getItem("player_name"))
            }
        })

        this.socket.on("disconnect", () => 
        {
            this.setState({connected: false, app_state: APP_STATE.MAIN_MENU});
        })

        
        // Called when the server puts the player in a game room
        this.socket.on("enter game room", (data) => 
        {
            this.setState({app_state: APP_STATE.GAME_ROOM, game_room_data: data})
        })
        
    }

    setAppState(state)
    {
        this.setState({app_state: state})
    }

    render () {
        return (
            <>
                <div className="background"></div>
                {/* {typeof electron != 'undefined' && <img src={close_icon} className="close-button" onClick={() => electron.closeWindow()}></img>} */}
                {!this.state.connected && <img src={loading_icon} className='connecting-icon'></img>}
                {this.state.app_state == APP_STATE.MAIN_MENU && <MainMenu socket={this.socket} setAppState={(state) => this.setAppState(state)}></MainMenu>}
                {this.state.app_state == APP_STATE.GAME_ROOM && <GameRoom game_room_data={this.state.game_room_data} socket={this.socket} setAppState={(state) => this.setAppState(state)}></GameRoom>}
                {this.state.app_state == APP_STATE.INSTALL_VIEW && <InstallMenu setAppState={(state) => this.setAppState(state)}></InstallMenu>}
            </>
        )
    }
}