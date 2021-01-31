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
        this.state = 
        {
            game_code: "AAAA",
            players: {}
        }

    }

    componentDidMount()
    {
        // Test code
        this.setState({players: {
            "fjoioif2j3oi3o": // Unique ID, never changes
            {
                name: "StepOnIt",
                song_info: { // Current song info, either in menu select or ingame
                    name: "Flowers",
                    artist: "HANA RAMAN",
                    pack: "Assorted",
                    difficulty: 10,
                    steps: 567
                },
                ingame: false, // If this player is currently in the gameplay screen in stepmania
                steps_info: { // All info about a player's current steps in a song
                    TapNoteScore_W1: 200,
                    TapNoteScore_W2: 30,
                    TapNoteScore_W3: 40,
                    TapNoteScore_W4: 10,
                    TapNoteScore_W5: 0,
                    TapNoteScore_Miss: 2,
                    TapNoteScore_HitMine: 0,
                    TapNoteScore_AvoidMine: 0,
                    HoldNoteScore_MissedHold: 0,
                    HoldNoteScore_Held: 0,
                    HoldNoteScore_LetGo: 0
                },
                progress: 0.7,
                score: 99.20,
                is_me: true, // If the player card is this player's card (used for name editing)
            },
            "fjoioif233j3oi3o": // Unique ID, never changes
            {
                name: "dimo",
                song_info: { // Current song info, either in menu select or ingame
                    name: "Flowers",
                    artist: "HANA RAMAN",
                    pack: "Assorted",
                    difficulty: 10,
                    steps: 567
                },
                ingame: false, // If this player is currently in the gameplay screen in stepmania
                steps_info: { // All info about a player's current steps in a song
                    TapNoteScore_W1: 200,
                    TapNoteScore_W2: 30,
                    TapNoteScore_W3: 40,
                    TapNoteScore_W4: 10,
                    TapNoteScore_W5: 0,
                    TapNoteScore_Miss: 2,
                    TapNoteScore_HitMine: 0,
                    TapNoteScore_AvoidMine: 0,
                    HoldNoteScore_MissedHold: 0,
                    HoldNoteScore_Held: 0,
                    HoldNoteScore_LetGo: 0
                },
                progress: 0.7,
                score: 99.20,
                is_me: false, // If the player card is this player's card (used for name editing)
            }
        }})
    }

    render () {
        return (
            <div className="gameroom-main-container">
                <div className="content">
                    <div className="navbar">
                        <div className="navbar-left-container">
                            <img src={back_arrow_icon} className="navitem leave" onClick={() => this.props.setAppState(APP_STATE.MAIN_MENU)}></img>
                        </div>
                        <div className="navbar-right-container">
                            <img src={info_icon} className="navitem info"></img>
                            <img src={popout_icon} className="navitem popout"></img>
                        </div>
                    </div>
                    <div className="title-container" onClick={() => electron.clipboard.writeText(this.state.game_code)}>
                        Game Code: <span className="code-bold">{this.state.game_code}</span>
                    </div>
                    <div className="cards-container-outer">
                        <div className="cards-container">
                            {Object.keys(this.state.players).map((key) => 
                            {
                                return <PlayerCard key={key} player_data={this.state.players[key]}></PlayerCard>
                            })}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}