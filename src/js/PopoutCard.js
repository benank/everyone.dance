import React, {useState, useEffect} from 'react';
import '../styles/font.scss'
import "../styles/popout_card.scss"

import PlayerCard from "./PlayerCard"

export default class PopoutCard extends React.Component {

    constructor (props)
    {
        super(props);
    }
    
    updateCardTitle()
    {
        if (this.have_valid_player_data())
        {
            window.document.title = `everyone.dance - Popout Card (${this.get_player_data().name}${this.props.p2 == true ? " (2)" : ""})`;
        }
    }
    
    componentDidUpdate()
    {
        electron.send('update-popout-size', 
        {
            width: window.document.getElementById('popout-card').clientWidth,
            height: window.document.getElementById('popout-card').clientHeight
        })
        
        this.updateCardTitle();
    }

    get_player_data()
    {
        return this.props.game_room_data.players[this.props.id];
    }

    have_valid_player_data()
    {
        if (typeof this.props.game_room_data.players[this.props.id] == 'undefined') {return false;}

        if (!this.props.p2)
        {
            return typeof this.props.game_room_data.players[this.props.id].data["PlayerNumber_P1"] != 'undefined';
        }
        else
        {
            return typeof this.props.game_room_data.players[this.props.id].data["PlayerNumber_P2"] != 'undefined';
        }
    }

    getNamedIdWithP2(name, p2)
    {
        return `pc_${name}${p2 ? "_2" : ''}`.toLowerCase().replace(' ', '_').replace('-', '_').replace(/\W/g, '');
    }

    getLocalStorageCardCSSName(id)
    {
        return `custom_card_css_${id}`;
    }

    getCardCustomStyle()
    {
        let custom_style = localStorage.getItem(this.getLocalStorageCardCSSName(this.getNamedIdWithP2(this.get_player_data().name, this.props.p2)));
        if (custom_style == null) {custom_style = "";}
        return custom_style;
    }

    render () {
        return (
            <div id='popout-card'>
                {this.have_valid_player_data() && <PlayerCard 
                {...this.props} 
                options={this.props.game_room_data.options} 
                id={this.props.id} 
                player_data={this.get_player_data()} 
                p2={this.props.p2} 
                popout={true}
                getNamedIdWithP2={this.getNamedIdWithP2.bind(this)}
                custom_style={this.getCardCustomStyle()}/>}
            </div>
        )
    }
}