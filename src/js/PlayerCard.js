import React from 'react';
import "../styles/player_card.scss"

import "../styles/navitem.scss"

import { CardIcon, ICON_TYPE } from "./CardIcon"

const notescore_names = 
{
    "TapNoteScore_W1": "Marvelous",
    "TapNoteScore_W2": "Perfect",
    "TapNoteScore_W3": "Great",
    "TapNoteScore_W4": "Good",
    "TapNoteScore_W5": "Good",
    "TapNoteScore_Miss": "Miss",
    "HoldNoteScore_Held": "OK",
    "HoldNoteScore_LetGo": "NG"
}

export default class PlayerCard extends React.Component {

    constructor (props)
    {
        super(props);
        this.state = 
        {
            player_data: props.player_data,
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

    // componentDidUpdate(props)
    // {
    //     this.setState({player_data: props.player_data});
    // }

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

    getJudgementMap()
    {
        const judgement_map = {}

        Object.keys(this.state.player_data.steps_info).forEach((judgement_name) => 
        {
            const nice_judgement_name = notescore_names[judgement_name];
            if (typeof nice_judgement_name != 'undefined')
            {
                if (typeof judgement_map[nice_judgement_name] == 'undefined')
                {
                    judgement_map[nice_judgement_name] = 0
                }

                judgement_map[nice_judgement_name] += this.state.player_data.steps_info[judgement_name]
            }
        })

        return judgement_map
    }

    renderJudgements()
    {
        const judgement_map = this.getJudgementMap();
        
        return Object.keys(judgement_map).map((key) => 
        {
            return (
                <div className="step-score-container" key={key}>
                    <div className="step-score-title">{key}</div>
                    <div className="step-score">{judgement_map[key] || "--"}</div>
                </div>
            )
        })
    }

    render () {
        return (
            <div className="player-card-container" key={this.state.id} style={{backgroundImage: this.state.background_color}}>
                <div className="top-bar">
                    <div className="player-name">{this.state.player_data.name}</div>
                    <div className="nav-items">
                        <CardIcon icon_type={ICON_TYPE.ROTATE_PORTRAIT} callback={() => this.pressRotateButton()}></CardIcon>
                        <CardIcon icon_type={this.state.visible ? ICON_TYPE.VISIBLE : ICON_TYPE.HIDDEN} callback={() => this.pressVisibilityButton()}></CardIcon>
                        {!this.state.player_data.is_me ? 
                            <CardIcon icon_type={ICON_TYPE.GOTO} callback={() => this.pressGotoButton()}></CardIcon> : 
                            <CardIcon icon_type={ICON_TYPE.EDIT} callback={() => this.pressEditButton()}></CardIcon>}
                    </div>
                </div>
                <div className="content">
                    <div className="song-info">
                        <div className="info song-name"><CardIcon icon_type={ICON_TYPE.MUSIC}/>{this.state.player_data.song_info.name || "--"}</div>
                        <div className="info song-artist"><CardIcon icon_type={ICON_TYPE.ARTIST}/>{this.state.player_data.song_info.artist || "--"}</div>
                        <div className="info song-charter"><CardIcon icon_type={ICON_TYPE.CHARTER}/>{this.state.player_data.song_info.charter || "--"}</div>
                        <div className="info song-pack"><CardIcon icon_type={ICON_TYPE.FOLDER}/>{this.state.player_data.song_info.pack || "--"}</div>
                        <div className="info song-difficulty"><CardIcon icon_type={ICON_TYPE.LEVEL}/>{this.state.player_data.song_info.difficulty_name || "--"} {this.state.player_data.song_info.difficulty || "--"} ({this.state.player_data.song_info.steps || "--"})</div>
                        {this.state.player_data.ingame && <div className="song-score">{this.state.player_data.score}%</div>}
                    </div>
                    {this.state.player_data.ingame && <div className="song-progress-bar">
                        <div className="song-progress-bar-fill" style={{width: `${this.state.player_data.progress * 100}%`}}></div>
                    </div>}
                    {this.state.player_data.ingame && <div className="step-scores-container">
                        {this.state.player_data.ingame && this.renderJudgements()}
                    </div>}
                </div>
            </div>
        )
    }
}