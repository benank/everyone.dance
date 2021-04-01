import React, {useState, useEffect} from 'react';
import '../styles/font.scss'
import "../styles/game_room_custom_css.scss"
import close_icon from "../icons/close-24px.svg"
import ToggleComponent from './ToggleComponent';

export default class GameRoomCustomCSS extends React.Component {

    constructor (props)
    {
        super(props);
        this.state = 
        {
            global_value: this.props.custom_style,
            card_value: this.props.card_custom_style
        }
    }

    click_save_apply()
    {
        this.props.globalStyleUpdated(this.state.global_value);
        this.props.cardStyleUpdated(this.state.card_value);

        this.props.toggleCSSMenuOpen();
    }

    render () {
        return (
            <div className='game-room-custom-css'>
                <div className='content'>
                    <div className='close-button'>
                        <img src={close_icon} onClick={() => this.props.toggleCSSMenuOpen()} className="navitem settings"></img>
                    </div>
                    <div className='title-container'>
                        Custom CSS
                    </div>
                    <div className='settings-content'>
                        <div className='container'>
                            <div className='container-title'>Card CSS <div className='code'>#{this.props.custom_css_id}</div></div>
                            <div className='code-container'>
                                <textarea id='card-css-textarea'
                                spellCheck={false}
                                value={this.state.card_value}
                                onChange={(e) => this.setState({card_value: e.target.value})}
                                wrap={'hard'}></textarea>
                            </div>
                        </div>
                        <div className='container'>
                            <div className='container-title'>Global CSS</div>
                            <div className='code-container'>
                                <textarea id='global-css-textarea'
                                spellCheck={false}
                                value={this.state.global_value}
                                onChange={(e) => this.setState({global_value: e.target.value})}
                                wrap={'hard'}></textarea>
                            </div>
                        </div>
                    </div>
                    <div className='center'>
                        <div className='button save' onClick={() => this.click_save_apply()}>Save and Apply</div>
                    </div>
                </div>
            </div>
        )
    }
}