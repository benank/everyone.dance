import React, {useState, useEffect} from 'react';
import '../styles/font.scss'
import "../styles/popout_card.scss"

import PlayerCard from "./PlayerCard"

export default class PopoutCard extends React.Component {

    constructor (props)
    {
        super(props);
    }

    componentDidUpdate()
    {
        console.log(this.props.id)
        electron.send('update-popout-size', 
        {
            width: window.document.getElementById('popout-card').clientWidth,
            height: window.document.getElementById('popout-card').clientHeight
        })
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

    render () {
        return (
            <div id='popout-card'>
                {this.have_valid_player_data() && <PlayerCard 
                {...this.props} 
                options={this.props.game_room_data.options} 
                id={this.props.id} player_data={this.get_player_data()} p2={this.props.p2} popout={true}/>}
            </div>
        )
    }
}