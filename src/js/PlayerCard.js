import React from 'react';
import "../styles/player_card.scss"
import CountUp from 'react-countup';

import "../styles/navitem.scss"
import {isWebVersion} from "./constants/isWebVersion";

import { CardIcon, ICON_TYPE } from "./CardIcon"

const notescore_names = 
{
    ["DDR"]:
    {
        ["W1"]:  "Marvelous",
        ["W2"]:  "Perfect",
        ["W3"]:  "Great",
        ["W4+W5"]:  "Good",
        ["Miss"]:  "Miss",
        ["OK"]:  "OK",
        ["NG"]:  "NG"
    },
    ["ITG"]:
    {
        ["W1"]:  "Fantastic",
        ["W2"]:  "Excellent",
        ["W3"]:  "Great",
        ["W4"]:  "Decent",
        ["W5"]:  "Way Off",
        ["Miss"]:  "Miss",
        ["OK"]:  "OK",
        ["NG"]:  "NG"
    },
    ["ITG (Strict)"]:
    {
        ["W1"]:  "Fantastic",
        ["W2"]:  "Excellent",
        ["W3"]:  "Great",
        ["W4"]:  "Decent",
        ["W5"]:  "Way Off",
        ["Miss"]:  "Miss",
        ["OK"]:  "OK",
        ["NG"]:  "NG"
    },
    ["Pump"]:
    {
        ["W1"]:  "Superb",
        ["W2"]:  "Perfect",
        ["W3"]:  "Great",
        ["W4"]:  "Good",
        ["W5"]:  "Bad",
        ["Miss"]:  "Miss"
    }
}

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
            background_color: props.player_data.background_color,
            editing: false,
            name_input: props.player_data.name
        }
    }

    componentDidUpdate()
    {
        // Apparently react doesn't like updating complex objects without either changing key or doing this
        // I opted for doing this
        if (!Object.is(this.props.player_data, this.state.player_data))
        {
            this.setState({
                player_data: this.props.player_data, 
                old_player_data: this.state.player_data
            })
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
        if (!electron.fs.existsSync(this.props.path)) {return;}
        const file_path = this.props.path + ".goto"

        let song_dir = this.get_player_data().song_info.song_dir;
        song_dir = song_dir.substring(song_dir.substring(1, song_dir.length).indexOf("/") + 1, song_dir.length);

        const data_to_write = `${song_dir}\n${this.get_player_data().song_info.name}`;
        electron.fs.writeFileSync(file_path, data_to_write);
    }

    pressEditButton()
    {
        this.setState({editing: true})
    }

    stop_editing()
    {
        this.setState({editing: false});
        this.props.socket.emit("set name", localStorage.getItem("player_name").trim())
    }

    input_code_field_changed(event)
    {
        const input = event.target.value;
        localStorage.setItem("player_name", input);
        this.setState({name_input: input});
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
        
        let _notescore_names = notescore_names[this.props.options["game_mode"]];

        return Object.keys(_notescore_names).map((key) => 
        {
            const judgement_name = _notescore_names[key];
            let steps = 0;
            if (key.includes("+"))
            {
                const split = key.split("+");
                steps += parseInt(this.get_player_data().steps_info[split[0]]);
                steps += parseInt(this.get_player_data().steps_info[split[1]]);
            }
            else
            {
                steps = parseInt(this.get_player_data().steps_info[key]);
            }

            return (
                <div className="step-score-container" key={key}>
                    <div className="step-score-title">{judgement_name}</div>
                    <div className="step-score"><CountUp 
                        start={steps} 
                        duration={1.2} 
                        useEasing={false} 
                        end={steps}/></div>
                </div>
            )
        })
    }

    get_player_score()
    {
        let score = parseFloat(this.get_old_player_data().score);
        if (isNaN(score))
        {
            score = 0;
        }
        return score.toFixed(2);
    }

    pressPopoutButton()
    {
        electron.send('popout-player', 
        {
            id: this.props.id, 
            p2: this.state.p2, 
            name: this.state.player_data.name,
            game_room_data: this.props.game_room_data
        });
    }

    getIdWithP2()
    {
        return `${this.props.id}${this.state.p2 ? '_2' : ''}`;
    }

    pressCustomCSSButton()
    {
        this.props.toggleCSSMenuOpen(this.props.getNamedIdWithP2(this.state.player_data.name, this.state.p2));
    }

    isPopoutAndNotIngame()
    {
        return !this.is_ingame() && this.props.popout;
    }
    
    getStepsTypeFromData()
    {
        const steps_type = this.get_player_data().song_info.steps_type;
        
        // Legacy support
        if (typeof steps_type == 'undefined')
        {
            return this.get_player_data().song_info.difficulty_name || "--";
        }
        
        const types = 
        [
            "Single", "Double", "Couple", "Solo", "Threepanel", "Routine", "Halfdouble", "Real", "Versus",
            "Five", "Nine", "Cabinet", "Human", "Quadarm", "Insect", "Arachnid"
        ]
        
        for (let i = 0; i < types.length; i++)
        {
            if (steps_type.includes(types[i]))
            {
                return types[i];
            }
        }
        
        return "Unknown"
    }
    
    is_ingame()
    {
        return this.get_player_data().ingame == "true" || this.props.options["force_ingame_layout"]
    }

    render () {
        return (
            <div className={`player-card-container ${this.props.popout ? 'popout' : ''}`} id={this.props.getNamedIdWithP2(this.state.player_data.name, this.state.p2)} key={this.getIdWithP2()}>
                {/* Must apply background color as style like below so custom css can modify it without issue */}
                <style>{`div.player-card-container div.player-card-background {background-image: ${this.state.background_color}}`}</style>
                <style>{this.props.custom_style}</style>
                <div className='player-card-background'></div>
                <div className="top-bar">
                    {(this.props.options["rank_players"]) && (
                        (typeof this.get_player_data().rank != 'undefined' && this.is_ingame()) ? 
                            <div className={`player-rank rank${this.get_player_data().rank}`}>{this.get_player_data().rank}</div> :
                            <div className={`player-rank`}>?</div>
                        )}
                    {!this.state.editing ? 
                        <div className="player-name">{this.state.player_data.name}{this.state.p2 && " (2)"}</div> :
                        <input 
                        className="player-name name-input" 
                        type="text" 
                        maxLength="20" 
                        placeholder={this.state.player_data.name} 
                        value={this.state.name_input}
                        onChange={(event) => this.input_code_field_changed(event)}></input>}
                    {!this.props.popout && <div className="nav-items">
                        {!this.state.player_data.is_me ? 
                            (!isWebVersion && <CardIcon icon_type={ICON_TYPE.GOTO} callback={() => this.pressGotoButton()}></CardIcon>) : 
                            <CardIcon icon_type={ICON_TYPE.EDIT} callback={() => this.pressEditButton()}></CardIcon> }
                        <CardIcon icon_type={ICON_TYPE.CUSTOM_CSS} callback={() => this.pressCustomCSSButton()}></CardIcon>
                        {!isWebVersion && <CardIcon icon_type={ICON_TYPE.POPOUT} callback={() => this.pressPopoutButton()}></CardIcon>}
                    </div>}
                </div>
                {this.state.editing && <div className="stop-editing-container" onClick={() => this.stop_editing()}></div>}
                <div className="content">
                    <div className="song-info">
                        <div className="info song-name"><CardIcon icon_type={ICON_TYPE.MUSIC}/>{this.get_player_data().song_info.name || "--"}</div>
                        <div className="info song-artist"><CardIcon icon_type={ICON_TYPE.ARTIST}/>{this.get_player_data().song_info.artist || "--"}</div>
                        <div className="info song-charter"><CardIcon icon_type={ICON_TYPE.CHARTER}/>{this.get_player_data().song_info.charter || "--"}</div>
                        <div className="info song-pack"><CardIcon icon_type={ICON_TYPE.FOLDER}/>{this.get_player_data().song_info.pack || "--"}</div>
                        <div className="info song-difficulty"><CardIcon icon_type={ICON_TYPE.LEVEL}/>{this.getStepsTypeFromData()} {this.get_player_data().song_info.difficulty || "--"} ({this.get_player_data().song_info.steps || "--"})</div>
                        {this.is_ingame() && <div className="song-score">{this.get_player_score()}%</div>}
                    </div>
                    {(this.is_ingame() || this.props.popout) && <div className="song-progress-bar" style={{opacity: `${this.isPopoutAndNotIngame() ? '0' : '1'}`}}>
                        <div className="song-progress-bar-fill" style={{width: `${this.get_player_data().progress * 100}%`}}></div>
                    </div>}
                    {(this.is_ingame() || this.props.popout) && <div className="step-scores-container" style={{opacity: `${this.isPopoutAndNotIngame() ? '0' : '1'}`}}>
                        {this.renderJudgements()}
                    </div>}
                </div>
            </div>
        )
    }
}