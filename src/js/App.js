import React, {useState, useEffect} from 'react';
import { io } from "socket.io-client";
import "../styles/app.scss"

import loading_icon from '../icons/autorenew-24px.svg'
import close_icon from '../icons/close-24px.svg'

import { APP_STATE } from './constants/app_state'

import MainMenu from './MainMenu'

const ENDPOINT = "https://everyone.dance:2053"

export default class App extends React.Component {

    constructor (props)
    {
        super(props);
        this.state = 
        {
            connected: false,
            app_state: APP_STATE.MAIN_MENU
        }
    }

    componentDidMount()
    {
        this.socket = io(ENDPOINT);

        this.socket.on("connect", () => 
        {
            this.setState({connected: true});
        })

        this.socket.on("disconnect", () => 
        {
            this.setState({connected: false});
        })
    }

    render () {
        return (
            <>
                <div className="background"></div>
                {typeof electron != 'undefined' && <img src={close_icon} className="close-button" onClick={() => electron.closeWindow()}></img>}
                {!this.state.connected && <img src={loading_icon} className='connecting-icon'></img>}
                {this.state.app_state == APP_STATE.MAIN_MENU && <MainMenu></MainMenu>}
            </>
        )
    }
}