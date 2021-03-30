import React, {useState, useEffect} from 'react';
import '../styles/font.scss'
import "../styles/toggle_component.scss"

export default class ToggleComponent extends React.Component {

    constructor (props)
    {
        super(props);
    }

    getDotColor()
    {
        return this.props.active ? '#00BC13' : '#a3a3a379';
    }

    getDotXPosition()
    {
        return this.props.active ? '50%' : '0%';
    }

    render () {
        return (
            <div style={this.props.host_id != this.props.my_id ? {cursor: 'not-allowed'} : {}} className='toggle-component' onClick={() => this.props.clickToggle()}>
                <div style={{
                    backgroundColor: this.getDotColor(),
                    left: this.getDotXPosition()
                }} className='dot'></div>
            </div>
        )
    }
}