import React, {useState, useEffect} from 'react';
import '../styles/font.scss'
import "../styles/main_menu.scss"

import forward_arrow_icon from '../icons/arrow_forward-24px.svg'
import { APP_STATE } from './constants/app_state'


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
        if (!socket.connected) {return;}

        this.props.socket.emit("enter game code", {game_code: this.state.game_code_input_value, name: this.get_localplayer_name()});
        this.state.game_code_input_value = "";
    }

    input_code_field_changed(event)
    {
        const input = event.target.value.toUpperCase().replace(/[^A-Z]/g,'');
        this.setState({game_code_input_value: input});
    }

    click_create_game_room()
    {
        if (!this.props.socket.connected) {return;}

        this.props.socket.emit("create game room", this.get_localplayer_name());

        // this.props.setAppState(APP_STATE.GAME_ROOM)
    }

    get_localplayer_name()
    {
        return localStorage.getItem("player_name") || `Player ${Math.ceil(Math.random() * 1000)}`;
    }

    render () {
        return (
            <>
                <div className="title-container">
                    <div className="title">everyone.dance</div>
                    <div className="buttons-container">
                        {!this.state.game_code_open && <div className="button join" onClick={() => this.click_join_game()}>Join a Game</div>}
                        {this.state.game_code_open && <div className="gamecode-container">
                            <input 
                                className="gamecode" 
                                type="text" 
                                pattern="[^A-Z]+" 
                                maxLength="4" 
                                placeholder="Game Code" 
                                value={this.state.game_code_input_value}
                                onChange={(event) => this.input_code_field_changed(event)}></input>
                            <img src={forward_arrow_icon} className="submit-gamecode-button"></img>
                        </div>}
                        <div className="button create" onClick={() => this.click_create_game_room()}>Create a Game</div>
                        {typeof electron != 'undefined' ? 
                            <div className="button install" onClick={() => this.props.setAppState(APP_STATE.INSTALL_VIEW)}>Install</div> :
                            <div className="button download disabled">Download</div>}
                    </div>
                </div>
            </>
        )
    }
}