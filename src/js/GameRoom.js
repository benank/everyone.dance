import React, {useState, useEffect} from 'react';
import styles from "../styles/game_room.scss"

import PlayerCard from "./PlayerCard"
import "../styles/navitem.scss"
import { APP_STATE } from './constants/app_state'

import back_arrow_icon from "../icons/back_arrow.svg"
import popout_icon from "../icons/popout.svg"
import info_icon from "../icons/info.svg"

export default class GameRoom extends React.Component {

    constructor (props)
    {
        super(props);
        console.log(props);
        this.state = 
        {
            game_code: props.game_room_data.game_code,
            players: props.game_room_data.players
        }
    }

    componentDidMount()
    {
        // Player joined
        this.props.socket.on("add player", (data) => 
        {
            const players_copy = JSON.parse(JSON.stringify(this.state.players));

            players_copy[data.id] = data;
            this.setState({players: players_copy});
        })

        // Player left
        this.props.socket.on("remove player", (id) => 
        {
            const players_copy = JSON.parse(JSON.stringify(this.state.players));

            const is_me = players_copy[id] && players_copy[id].is_me;

            delete players_copy[id];
            this.setState({players: players_copy});

            if (is_me)
            {
                this.props.setAppState(APP_STATE.MAIN_MENU);
            }
        })

        this.props.socket.on("change player name", (data) => 
        {
            const players_copy = JSON.parse(JSON.stringify(this.state.players));

            if (players_copy[data.id])
            {
                players_copy[data.id].name = data.name;
                this.setState({players: players_copy});
            }
        })
    }

    leave_game_room()
    {
        this.props.socket.emit("leave game room")
        this.props.setAppState(APP_STATE.MAIN_MENU)
    }

    render () {
        return (
            <div className="gameroom-main-container">
                <div className="content">
                    <div className="navbar">
                        <div className="navbar-left-container">
                            <img src={back_arrow_icon} className="navitem leave" onClick={() => this.leave_game_room()}></img>
                        </div>
                        <div className="navbar-right-container">
                            <img src={info_icon} className="navitem info"></img>
                            <img src={popout_icon} className="navitem popout"></img>
                        </div>
                    </div>
                    <div className="title-container" onClick={() => typeof electron != 'undefined' ?
                        electron.clipboard.writeText(this.state.game_code) : 
                        navigator.clipboard.writeText(this.state.game_code)}>
                        Game Code: <span className="code-bold">{this.state.game_code}</span>
                    </div>
                    <div className="cards-container-outer">
                        <div className="cards-container">
                            {Object.keys(this.state.players).map((key) => 
                            {
                                return !this.state.players[key].spectate && <PlayerCard key={key} player_data={this.state.players[key]}></PlayerCard>
                            })}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}