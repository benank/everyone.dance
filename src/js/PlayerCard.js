import React from 'react';
import "../styles/player_card.scss"
import CountUp from 'react-countup';

import "../styles/navitem.scss"

import { CardIcon, ICON_TYPE } from "./CardIcon"

const notescore_names = 
[
    "Marvelous",
    "Perfect",
    "Great",
    "Good",
    "Miss",
    "OK",
    "NG"
]

export default class PlayerCard extends React.Component {

    constructor (props)
    {
        super(props);
        this.state = 
        {
            player_data: props.player_data,
            old_player_data: props.player_data,
            p2: props.p2 == true,
            id: props.id,
            /*
                player_data is a map that includes:

                name: "Default",
                song_info: { // Current song info, either in menu select or ingame
                    name: "Flowers",
                    artist: "HANA RAMAN",
                    pack: "Assorted",
                    charter: "Konami",
                    difficulty: 10,
                    steps: 567
                },
                ingame: false, // If this player is currently in the gameplay or scores screen in stepmania
                steps_info: { // All info about a player's current steps in a song
                    TapNoteScore_W1: 0,
                    TapNoteScore_W2: 0,
                    TapNoteScore_W3: 0,
                    TapNoteScore_W4: 0,
                    TapNoteScore_W5: 0,
                    TapNoteScore_Miss: 0,
                    TapNoteScore_HitMine: 0,
                    TapNoteScore_AvoidMine: 0,
                    HoldNoteScore_MissedHold: 0,
                    HoldNoteScore_Held: 0,
                    HoldNoteScore_LetGo: 0
                },
                progress = 0.7, // Current song progress betwen 0 and 1
                score: 99.20,
                is_me: true, // If the player card is this player's card (used for name editing)
                spectate: false // If the player joined through web view and is spectating

            */

            portrait: false, // If the player card is portrait mode in streamer view
            visible: true, // If the player card is visible in streamer view
            dark_theme: false, // If this card has dark background colors and thus requires white text instead of black
            background_color: props.player_data.background_color
        }
    }

    componentDidUpdate()
    {
        // Apparently react doesn't like updating complex objects without either changing key or doing this
        // I opted for doing this
        if (!Object.is(this.props.player_data, this.state.player_data))
        {
            this.setState({player_data: this.props.player_data, old_player_data: this.state.player_data})
        }
    }

    getRandomBackgroundColor()
    {
        const hue = Math.random();
        const saturation = 0.6 + Math.random() * 0.4
        const lightness = 0.7 + Math.random() * 0.2
        const hue_complement = hue + Math.random() * 0.3
        const saturation_complement = 0.5 + Math.random() * 0.5
        const lightness_complement = 0.7 + Math.random() * 0.2
        return `linear-gradient(-45deg, 
                    hsl(${hue * 360}, ${saturation * 100}%, ${lightness * 100}%) 0%, 
                    hsl(${hue_complement * 360}, ${saturation_complement * 100}%, ${lightness_complement * 100}%) 100%)`
    }

    pressGotoButton()
    {

    }

    pressEditButton()
    {

    }

    pressRotateButton()
    {
        
    }

    pressVisibilityButton()
    {
        
    }

    get_player_data()
    {
        return this.state.player_data.data[this.state.p2 ? "PlayerNumber_P2" : "PlayerNumber_P1"]
    }

    get_old_player_data()
    {
        return this.state.old_player_data.data[this.state.p2 ? "PlayerNumber_P2" : "PlayerNumber_P1"]
    }

    renderJudgements()
    {
        const judgement_map = this.get_player_data().steps_info;
        
        return notescore_names.map((key) => 
        {
            return (
                <div className="step-score-container" key={key}>
                    <div className="step-score-title">{key}</div>
                    <div className="step-score"><CountUp 
                        start={parseInt(this.get_old_player_data().steps_info[key])} 
                        duration={1.2} 
                        useEasing={false} 
                        end={parseInt(this.get_player_data().steps_info[key])}/></div>
                </div>
            )
        })
    }

    render () {
        return (
            <div className="player-card-container" key={this.state.id} style={{backgroundImage: this.state.background_color}}>
                <div className="top-bar">
                    <div className="player-name">{this.state.player_data.name}{this.state.p2 && " (2)"}</div>
                    {/* <div className="nav-items">
                        <CardIcon icon_type={ICON_TYPE.ROTATE_PORTRAIT} callback={() => this.pressRotateButton()}></CardIcon>
                        <CardIcon icon_type={this.state.visible ? ICON_TYPE.VISIBLE : ICON_TYPE.HIDDEN} callback={() => this.pressVisibilityButton()}></CardIcon>
                        {!this.state.player_data.is_me ? 
                            <CardIcon icon_type={ICON_TYPE.GOTO} callback={() => this.pressGotoButton()}></CardIcon> : 
                            <CardIcon icon_type={ICON_TYPE.EDIT} callback={() => this.pressEditButton()}></CardIcon>}
                    </div> */}
                </div>
                <div className="content">
                    <div className="song-info">
                        <div className="info song-name"><CardIcon icon_type={ICON_TYPE.MUSIC}/>{this.get_player_data().song_info.name || "--"}</div>
                        <div className="info song-artist"><CardIcon icon_type={ICON_TYPE.ARTIST}/>{this.get_player_data().song_info.artist || "--"}</div>
                        <div className="info song-charter"><CardIcon icon_type={ICON_TYPE.CHARTER}/>{this.get_player_data().song_info.charter || "--"}</div>
                        <div className="info song-pack"><CardIcon icon_type={ICON_TYPE.FOLDER}/>{this.get_player_data().song_info.pack || "--"}</div>
                        <div className="info song-difficulty"><CardIcon icon_type={ICON_TYPE.LEVEL}/>{this.get_player_data().song_info.difficulty_name || "--"} {this.get_player_data().song_info.difficulty || "--"} ({this.get_player_data().song_info.steps || "--"})</div>
                        {this.get_player_data().ingame == "true" && <div className="song-score">{parseFloat(this.get_old_player_data().score).toFixed(2)}%</div>}
                    </div>
                    {this.get_player_data().ingame == "true" && <div className="song-progress-bar">
                        <div className="song-progress-bar-fill" style={{width: `${this.get_player_data().progress * 100}%`}}></div>
                    </div>}
                    {this.get_player_data().ingame == "true" && <div className="step-scores-container">
                        {this.get_player_data().ingame && this.renderJudgements()}
                    </div>}
                </div>
            </div>
        )
    }
}