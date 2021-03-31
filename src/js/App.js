import React, {useState, useEffect} from 'react';
import * as io from "socket.io-client";
import "../styles/app.scss"

import loading_icon from '../icons/autorenew-24px.svg'
import close_icon from '../icons/close-24px.svg'

import { APP_STATE } from './constants/app_state'

import '../styles/font.scss'

import MainMenu from './MainMenu'
import GameRoom from './GameRoom'
import InstallMenu from './InstallMenu'
import UpdateMenu from './UpdateMenu'

import PopoutCard from "./PopoutCard"

import { ENDPOINT } from "./constants/endpoint"
import {VERSION} from "./constants/version"
import {isWebVersion} from "./constants/isWebVersion";

const DAY_STATE = 
{
    Morning: 1,
    Day: 2,
    Evening: 3,
    Night: 4
}

const background_color_classes = 
{
    [DAY_STATE.Morning]: `morning`,
    [DAY_STATE.Day]: `day`,
    [DAY_STATE.Evening]: `evening`,
    [DAY_STATE.Night]: `night`
}

export default class App extends React.Component {

    constructor (props)
    {
        super(props);
        this.state = 
        {
            connected: false,
            app_state: APP_STATE.MAIN_MENU,
            game_room_data: {},
            update_ready: false,
            current_version: "",
            latest_version: "",
            notification: null,
            day_state: DAY_STATE.Day,
            popout_id: "",
            popout_p2: false
        }
    }

    componentDidMount()
    {
        if (!isWebVersion)
        {
            setTimeout(() => {
                fetch("https://raw.githubusercontent.com/benank/everyone.dance/main/package.json").then((response) => 
                {
                    if (response.ok) {
                        response.json().then((json) => 
                        {
                            if (json.version > VERSION)
                            {
                                this.setState({
                                    latest_version: json.version,
                                    update_ready: true
                                })

                                this.createNotification({
                                    bg_color: '#1539c6', 
                                    text_color: 'white',
                                    text: `New version available: ${json.version}! Click Update below to download.`
                                });
                            }
                        })
                    }
                })
            }, 1000);
        }

        this.socket = io(ENDPOINT);

        this.socket.on("connect", () => 
        {
            this.setState({connected: true});
            if (localStorage.getItem("player_name"))
            {
                this.socket.emit("set name", localStorage.getItem("player_name"));
            }
            this.socket.emit("set version", VERSION);
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

        this.socket.on("notification", (data) => 
        {
            this.createNotification(data);
        })
        
        // No auto updates for now
        // if (!isWebVersion)
        // {
        //     electron.on("update ready", (args) => 
        //     {
        //         this.setState({update_ready: true, current_version: args.current_version, latest_version: args.latest_version})
        //     })

        //     electron.send("ready")
        // }
        if (!isWebVersion)
        {
            electron.on('update-popout-info', (args) => 
            {
                this.setState({
                    app_state: APP_STATE.POPOUT_VIEW,
                    game_room_data: args.game_room_data,
                    popout_id: args.id,
                    popout_p2: args.p2
                })
            })

            electron.on('game-data', (args) => 
            {
                console.log('receive game data')
                const game_room_data_copy = JSON.parse(JSON.stringify(this.state.game_room_data));
                game_room_data_copy.players = args.players;
                game_room_data_copy.options = args.options;

                this.setState({
                    game_room_data: game_room_data_copy
                })
            })

            electron.send('window-ready');
        }

        this.updateBackgroundColor();
    }

    createNotification(data)
    {
        if (typeof this.state.notification_timeout != 'undefined')
        {
            clearTimeout(this.state.notification_timeout);
        }

        this.setState({notification: data, notification_timeout: setTimeout(() => {
            this.setState({notification: null})
        }, 5000)});
    }

    // Change background color based on time of day ... because I can
    updateBackgroundColor()
    {
        const time = (new Date()).getHours();

        if (time >= 5 && time < 10)
        {
            // Morning
            if (this.state.day_state != DAY_STATE.Morning)
            {
                this.setState({
                    day_state: DAY_STATE.Morning
                })
            }
        }
        else if (time >= 17 && time < 20)
        {
            // Evening
            if (this.state.day_state != DAY_STATE.Evening)
            {
                this.setState({
                    day_state: DAY_STATE.Evening
                })
            }
        }
        else if (time >= 20 || time <= 5)
        {
            // Night
            if (this.state.day_state != DAY_STATE.Night)
            {
                this.setState({
                    day_state: DAY_STATE.Night
                })
            }
        }
        else
        {
            // Day
            if (this.state.day_state != DAY_STATE.Day)
            {
                this.setState({
                    day_state: DAY_STATE.Day
                })
            }
        }
    }

    setAppState(state)
    {
        this.setState({app_state: state})
    }

    render () {
        return (
            <>
                {this.state.app_state != APP_STATE.POPOUT_VIEW && <div className={`background ${background_color_classes[this.state.day_state]}`}></div>}
                {((!isWebVersion && electron.isDev && this.state.app_state != APP_STATE.POPOUT_VIEW) || this.state.app_state == APP_STATE.INSTALL_VIEW) && <div className='dev-version'>{VERSION}</div>}
                {/* {!isWebVersion && <img src={close_icon} className="close-button" onClick={() => electron.closeWindow()}></img>} */}
                {!this.state.connected && <img src={loading_icon} className='connecting-icon'></img>}
                {this.state.app_state == APP_STATE.MAIN_MENU && <MainMenu update_ready={this.state.update_ready} latest_version={this.state.latest_version} update_ready={this.state.update_ready} socket={this.socket} setAppState={(state) => this.setAppState(state)}></MainMenu>}
                {this.state.app_state == APP_STATE.GAME_ROOM && <GameRoom game_room_data={this.state.game_room_data} socket={this.socket} setAppState={(state) => this.setAppState(state)}></GameRoom>}
                {this.state.app_state == APP_STATE.INSTALL_VIEW && <InstallMenu setAppState={(state) => this.setAppState(state)}></InstallMenu>}
                {/* {this.state.app_state == APP_STATE.UPDATE_VIEW && <UpdateMenu 
                    update_ready={this.state.update_ready} 
                    current_version={this.state.current_version}
                    latest_version={this.state.latest_version}
                    setAppState={(state) => this.setAppState(state)}></UpdateMenu>} */}
                {this.state.app_state == APP_STATE.POPOUT_VIEW && <PopoutCard p2={this.state.popout_p2} id={this.state.popout_id} game_room_data={this.state.game_room_data}></PopoutCard>}
                {this.state.notification != null && 
                    <div 
                    style={{
                        backgroundColor: this.state.notification.bg_color,
                        color: this.state.notification.text_color
                    }}
                    className='notification'>{this.state.notification.text}</div>}
            </>
        )
    }
}