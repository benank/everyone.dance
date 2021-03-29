import React, {useState, useEffect} from 'react';
import '../styles/font.scss'
import "../styles/game_room_settings.scss"
import close_icon from "../icons/close-24px.svg"
import ToggleComponent from './ToggleComponent';
import {SYNC_MODE} from "./constants/SyncMode"

import host_filled_icon from "../icons/host_filled.svg"
import host_unfilled_icon from "../icons/host_unfilled.svg"
import kick_icon from "../icons/kick.svg"
import not_player_icon from "../icons/not_player.svg"
import player_icon from "../icons/player.svg"
import webview_icon from "../icons/webview.svg"

export default class GameRoomSettings extends React.Component {

    constructor (props)
    {
        super(props);
    }

    input_max_players_field_changed(event)
    {
        this.props.setPlayerLimit(parseInt(event.target.value));
    }

    on_select_sync_mode(event)
    {
        this.props.setSyncMode(parseInt(event.target.value));
    }

    get_num_players()
    {
        return Object.values(this.props.players).filter((player) => !player.spectate).length;
    }

    get_num_spectators()
    {
        return Object.values(this.props.players).filter((player) => player.spectate).length;
    }

    get_players_list()
    {
        const users_list_elements = [];

        // First add host
        users_list_elements.push(this.player_to_element(this.props.players[this.props.host_id]));

        // Next add this player (if not host)
        if (this.props.my_id != this.props.host_id)
        {
            users_list_elements.push(this.player_to_element(this.props.players[this.props.my_id]));
        }

        // Now add all players
        const only_players = Object.values(this.props.players).filter((player) => 
            !player.spectate && player.id != this.props.my_id && player.id != this.props.host_id);
        only_players.forEach((player) =>
        {
            users_list_elements.push(this.player_to_element(player));
        })


        // Finally, add all spectators
        const only_spectators = Object.values(this.props.players).filter((player) => 
            player.spectate && player.id != this.props.my_id && player.id != this.props.host_id);
        only_spectators.forEach((player) =>
        {
            users_list_elements.push(this.player_to_element(player));
        })

        return users_list_elements;
    }

    player_to_element(player)
    {
        return typeof player != 'undefined' && (
        <div key={`user_entry_${player.id}`} className='user-entry'>
            {player.id == this.props.host_id && <img src={host_filled_icon} className="navitem normal-mouse"></img>}
            <div className='user-name'>{player.name}</div>
            <div className='float-left'>
                {player.id != this.props.host_id && this.am_i_host() && <img src={host_unfilled_icon} onClick={() => this.make_player_host(player)} className="navitem"></img>}
                {!player.web_view && (!player.spectate ? 
                    <img src={player_icon} onClick={() => this.toggle_player_spectator(player)} className="navitem"></img> :
                    <img src={not_player_icon} onClick={() => this.toggle_player_spectator(player)} className="navitem"></img>)}
                {player.web_view && <img src={webview_icon} className="navitem normal-mouse float-left"></img>}
                {!player.is_me && this.am_i_host() && <img src={kick_icon} onClick={() => this.kick_player(player)} className="navitem"></img>}
            </div>
        </div>)
    }

    make_player_host(player)
    {
        if (!this.am_i_host()) {return;}

        this.props.socket.emit("make host", player.id);
    }

    toggle_player_spectator(player)
    {
        if (player.web_view) {return;} // Web view users can't play

        // Trying to change the status of someone else when not host
        if (player.id != this.props.my_id && !this.am_i_host()) {return;}
        
        this.props.socket.emit("change player status", player.id);
    }

    kick_player(player)
    {
        if (!this.am_i_host()) {return;}
        if (this.props.my_id == player.id) {return;}

        this.props.socket.emit("kick player", player.id);
    }

    am_i_host()
    {
        return this.props.host_id == this.props.my_id;
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
                                {...this.props}
                                active={this.props.options["show_game_code"]}></ToggleComponent>
                            </div>
                            <div className='option'>
                                <div className='text'>Allow Spectators</div>
                                <ToggleComponent 
                                clickToggle={() => this.props.click_toggle("allow_spectators")}
                                {...this.props}
                                active={this.props.options["allow_spectators"]}></ToggleComponent>
                            </div>
                            <div className='option'>
                                <div className='text'>Allow Players</div>
                                <ToggleComponent 
                                clickToggle={() => this.props.click_toggle("allow_players")}
                                {...this.props}
                                active={this.props.options["allow_players"]}></ToggleComponent>
                            </div>
                            <div className='option'>
                                <div className='text'>ITG Mode</div>
                                <ToggleComponent 
                                clickToggle={() => this.props.click_toggle("itg_mode")}
                                {...this.props}
                                active={this.props.options["itg_mode"]}></ToggleComponent>
                            </div>
                            <div className='option'>
                                <div className='text'>Player Limit</div>
                                <div className='input-container'>
                                    <ToggleComponent 
                                    clickToggle={() => this.props.click_toggle("player_limit")}
                                    {...this.props}
                                    active={this.props.options["player_limit"] > -1}></ToggleComponent>
                                    {this.props.options["player_limit"] > -1 && <input 
                                    className="player-limit" 
                                    type="number" 
                                    pattern="[^0-9]+" 
                                    maxLength="2" 
                                    placeholder="2" 
                                    disabled={!this.am_i_host()}
                                    style={!this.am_i_host() ? {cursor: 'not-allowed'} : {}}
                                    value={this.props.options["player_limit"]}
                                    onChange={(event) => this.input_max_players_field_changed(event)}></input>}
                                </div>
                            </div>
                            <div className='option'>
                                <div className='text'>Sync Mode</div>
                                <select 
                                disabled={!this.am_i_host()} 
                                style={!this.am_i_host() ? {userSelect: 'none', cursor: 'not-allowed'} : {}} 
                                onChange={(e) => this.on_select_sync_mode(e)}
                                className='dropdown' 
                                name="sync_mode" 
                                value={this.props.options["sync_mode"]}
                                id="sync_mode">
                                    <option value={SYNC_MODE.Realtime}>Realtime</option>
                                    <option value={SYNC_MODE.SongTime}>Song Time</option>
                                </select>
                            </div>
                        </div>
                        <div className='container'>
                            <div className='players-title'>{this.get_num_players()} Players</div>
                            <div className='players-subtitle'>{this.get_num_spectators()} Spectators</div>
                            <div className='players-container'>
                                <div className='players-content'>
                                    {this.get_players_list()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}