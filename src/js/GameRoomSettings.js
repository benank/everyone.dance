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
    }

    input_max_players_field_changed(event)
    {
        this.props.setPlayerLimit(parseInt(event.target.value));
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
                                clickToggle={() => this.props.click_toggle("show_game_code")}
                                active={this.props.options["show_game_code"]}></ToggleComponent>
                            </div>
                            <div className='option'>
                                <div className='text'>Allow Spectators</div>
                                <ToggleComponent 
                                clickToggle={() => this.props.click_toggle("allow_spectators")}
                                active={this.props.options["allow_spectators"]}></ToggleComponent>
                            </div>
                            <div className='option'>
                                <div className='text'>Allow Players</div>
                                <ToggleComponent 
                                clickToggle={() => this.props.click_toggle("allow_players")}
                                active={this.props.options["allow_players"]}></ToggleComponent>
                            </div>
                            <div className='option'>
                                <div className='text'>Player Limit</div>
                                <div className='input-container'>
                                    <ToggleComponent 
                                    clickToggle={() => this.props.click_toggle("player_limit")}
                                    active={this.props.options["player_limit"] > -1}></ToggleComponent>
                                    {this.props.options["player_limit"] > -1 && <input 
                                    className="player-limit" 
                                    type="number" 
                                    pattern="[^0-9]+" 
                                    maxLength="2" 
                                    placeholder="2" 
                                    value={this.props.options["player_limit"]}
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
                            [player and spectator list here]
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}