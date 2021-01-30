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
        
        // if (game_code.length != 4) {return;}
        // if (!socket.connected) {return;}

    }

    input_code_field_changed(event)
    {
        const input = event.target.value.toUpperCase().replace(/[^A-Z]/g,'');
        this.setState({game_code_input_value: input});
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
                        <div className="button create" onClick={() => this.props.setAppState(APP_STATE.GAME_ROOM)}>Create a Game</div>
                        {typeof electron != 'undefined' ? 
                            <div className="button install disabled">Install</div> :
                            <div className="button download disabled">Download</div>}
                    </div>
                </div>
            </>
        )
    }
}