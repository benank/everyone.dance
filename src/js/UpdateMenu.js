import React, {useState, useEffect} from 'react';
import '../styles/font.scss'
import "../styles/update_menu.scss"
import CountUp from 'react-countup';

import { APP_STATE } from './constants/app_state'


export default class UpdateMenu extends React.Component {

    constructor (props)
    {
        super(props);
        this.state = 
        {
            old_progress: 0,
            progress: 0,
            speed: 1
        }
    }

    componentDidMount()
    {
        electron.on("update progress", (progress) => 
        {
            this.setState({old_progress: this.state.progress, progress: progress, speed: 1})
        })

        electron.on("update progress slow", (args) => 
        {
            this.setState({old_progress: this.state.progress, progress: args.progress, speed: args.speed})
        })
    }

    cancel_update()
    {
        electron.send("stop update");
        this.props.setAppState(APP_STATE.MAIN_MENU);
    }

    render () {
        return (
            <>
                <div className="title-container">
                    <div className="title">Updating...</div>
                    <div className="buttons-container">
                        <div className="version">{this.props.current_version}</div> to <div className="version">{this.props.latest_version}</div>
                        <div className="loader-progress-background">
                            <div className="loader-progress-text"><CountUp useEasing={false} start={this.state.old_progress * 100} end={this.state.progress * 100} duration={this.state.speed}/>%</div>
                            <div className="loader-progress-inside" style={{width: `${this.state.progress * 100}%`, transition: `${this.state.speed}s linear width`}}></div>
                        </div>
                        <div className="button cancel" onClick={() => this.cancel_update()}>Cancel</div>
                    </div>
                </div>
            </>
        )
    }
}