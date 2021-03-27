import React, {useState, useEffect} from 'react';
import '../styles/font.scss'
import "../styles/game_room_settings.scss"
import close_icon from "../icons/close-24px.svg"
import ToggleComponent from './ToggleComponent';
import {SYNC_MODE} from "./constants/SyncMode"

export default class GameRoomSettings extends React.Component {

    constructor (props)
    {
        super(props);
        this.state = 
        {
            options:
            {
                ["show_game_code"]: true,
                ["allow_spectators"]: true,
                ["allow_players"]: true,
                ["player_limit"]: -1,
                ["sync_mode"]: SYNC_MODE.Realtime
            }
        }
    }

    click_toggle(option)
    {
        if (typeof this.state.options[option] == 'undefined') {return;}

        const options_copy = JSON.parse(JSON.stringify(this.state.options));
        
        if (option != "player_limit")
        {
            options_copy[option] = !options_copy[option];
        }
        else if (option == "player_limit")
        {
            options_copy[option] = options_copy[option] == -1 ? 2 : -1;
        }

        this.setState({
            options: options_copy
        })
    }

    input_max_players_field_changed(event)
    {

    }

    render () {
        return (
            <div className='game-room-settings'>
                <div className='content'>
                    <div className='close-button'>
                        <img src={close_icon} onClick={() => this.props.toggleSettings()} className="navitem settings"></img>
                    </div>
                    <div className='title-container'>
                        Game Room Settings
                    </div>
                    <div className='settings-content'>
                        <div className='container'>
                            {/* Would be better as a mapping but I currently don't feel like doing that */}
                            <div className='option'>
                                <div className='text'>Show Game Code</div>
                                <ToggleComponent 
                                clickToggle={() => this.click_toggle("show_game_code")}
                                active={this.state.options["show_game_code"]}></ToggleComponent>
                            </div>
                            <div className='option'>
                                <div className='text'>Allow Spectators</div>
                                <ToggleComponent 
                                clickToggle={() => this.click_toggle("allow_spectators")}
                                active={this.state.options["allow_spectators"]}></ToggleComponent>
                            </div>
                            <div className='option'>
                                <div className='text'>Allow Players</div>
                                <ToggleComponent 
                                clickToggle={() => this.click_toggle("allow_players")}
                                active={this.state.options["allow_players"]}></ToggleComponent>
                            </div>
                            <div className='option'>
                                <div className='text'>Player Limit</div>
                                <div className='input-container'>
                                    <ToggleComponent 
                                    clickToggle={() => this.click_toggle("player_limit")}
                                    active={this.state.options["player_limit"] > -1}></ToggleComponent>
                                    {this.state.options["player_limit"] > -1 && <input 
                                    className="player-limit" 
                                    type="number" 
                                    pattern="[^0-9]+" 
                                    maxLength="2" 
                                    placeholder="2" 
                                    value={this.state["player_limit"]}
                                    onChange={(event) => this.input_max_players_field_changed(event)}></input>}
                                </div>
                            </div>
                            <div className='option'>
                                <div className='text'>Sync Mode</div>
                                <select className='dropdown' name="sync_mode" id="sync_mode">
                                    <option value={SYNC_MODE.Realtime}>Realtime</option>
                                    <option value={SYNC_MODE.SongTime}>Song Time</option>
                                </select>
                            </div>
                        </div>
                        <div className='container'>
                            asdfasdf
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}