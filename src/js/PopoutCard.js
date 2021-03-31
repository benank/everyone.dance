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

    render () {
        return (
            <div id='popout-card'>
                <PlayerCard 
                {...this.props} 
                options={this.props.game_room_data.options} 
                id={this.props.id} player_data={this.get_player_data()} p2={this.props.p2} popout={true}/>
            </div>
        )
    }
}