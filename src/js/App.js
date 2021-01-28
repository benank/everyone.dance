import React, {useState, useEffect} from 'react';
import { io } from "socket.io-client";
import "../styles/style.scss"

import loading_icon from '../icons/autorenew-24px.svg'
import close_icon from '../icons/close-24px.svg'
import forward_arrow_icon from '../icons/arrow_forward-24px.svg'

const ENDPOINT = "https://everyone.dance:2053"

/*
import rectangle from 'images/rectangle.svg';

const App = () => <img src={rectangle} alt="" />;

*/

export default class App extends React.Component {

    constructor (props)
    {
        super(props);
        this.state = 
        {
            connected: false,
            game_code_open: false,
            game_code_input_value: ""
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

        if (typeof electron == 'undefined')
        {

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
                <div className="background"></div>
                {typeof electron != 'undefined' && <img src={close_icon} className="close-button" onClick={() => electron.closeWindow()}></img>}
                {!this.state.connected && <img src={loading_icon} className='connecting-icon'></img>}
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
                        <div className="button create">Create a Game</div>
                        {typeof electron != 'undefined' ? 
                            <div className="button install disabled">Install</div> :
                            <div className="button download disabled">Download</div>}
                    </div>
                </div>
            </>
        )
    }
}