import React, {useState, useEffect} from 'react';
import styles from "../styles/game_room.scss"

import PlayerCard from "./PlayerCard"
import "../styles/navitem.scss"
import { APP_STATE } from './constants/app_state'

import back_arrow_icon from "../icons/back_arrow.svg"
import popout_icon from "../icons/popout.svg"
import info_icon from "../icons/info.svg"
import SMInstallation from './SMEnvironment';

// Raw SM import data from txt file
let sm_data = ""
let sm_check_interval;
const SM_CHECK_INTERVAL_TIME = 250;
let SM_FILE_PATH = "/StepMania 5/Save/everyone.dance.txt"
let NOT_APPDATA = false

export default class GameRoom extends React.Component {

    constructor (props)
    {
        super(props);
        this.state = 
        {
            game_code: props.game_room_data.game_code,
            players: props.game_room_data.players,
            full_file_path: "" // Full file path to everyone.dance.txt
        }
    }

    componentDidMount()
    {
        // Player joined
        this.props.socket.on("add player", (data) => 
        {
            const players_copy = JSON.parse(JSON.stringify(this.state.players));

            players_copy[data.id] = data;
            this.setState({players: players_copy});
        })

        // Player left
        this.props.socket.on("remove player", (id) => 
        {
            const players_copy = JSON.parse(JSON.stringify(this.state.players));

            const is_me = players_copy[id] && players_copy[id].is_me;

            delete players_copy[id];
            this.setState({players: players_copy});

            if (is_me)
            {
                this.props.setAppState(APP_STATE.MAIN_MENU);
            }
        })

        this.props.socket.on("sync player data", (args) => 
        {
            if (this.state.players[args.id])
            {
                const players_copy = JSON.parse(JSON.stringify(this.state.players));
                players_copy[args.id].data = args.data;

                this.setState({players: players_copy});
            }
        })

        this.props.socket.on("change player name", (data) => 
        {
            const players_copy = JSON.parse(JSON.stringify(this.state.players));

            if (players_copy[data.id])
            {
                players_copy[data.id].name = data.name;
                this.setState({players: players_copy});
            }
        })

        if (typeof electron != 'undefined')
        {
            sm_check_interval = setInterval(() => {
                this.check_for_sm_updates();
            }, SM_CHECK_INTERVAL_TIME);

            const dir = localStorage.getItem("stepmania_dir");

            const sm_install = new SMInstallation(dir);
            NOT_APPDATA = sm_install.is_portable;
            SM_FILE_PATH = sm_install.score_file;
            console.log(`NOT_APPDATA: ${NOT_APPDATA}`)
            console.log(`SM_FILE_PATH: ${SM_FILE_PATH}`)
        }

    }

    check_for_sm_updates()
    {
        const file_path = SM_FILE_PATH;
        if (this.state.full_file_path != file_path)
        {
            this.setState({full_file_path: file_path})
        }

        console.log(`file path: ${file_path}`)

        // File does not exist
        if (!electron.fs.existsSync(file_path)) {return;}

        console.log("exists, reading")

        const file = electron.fs.readFileSync(file_path, 'utf8').toString();

        // No changes to file
        if (file == sm_data) {return;}

        sm_data = file;
        const lines = file.split("\n");

        let player = "";

        const data = {}

        for (let i = 0; i < lines.length; i++)
        {
            const line = lines[i].trim();

            // Empty line
            if (line.length == 0) {continue;}

            if (line.includes("PlayerNumber"))
            {
                player = line;
                data[player] = {}
                continue;
            }

            const split = line.split(":")

            // Depth of data for this line
            const depth = split.length == 2 ? 1 : 2; // Maximum depth of 2

            if (depth == 1)
            {
                const data_after_separator = line.replace(split[0] + ":", "");
                data[player][split[0]] = data_after_separator;
            }
            else if (depth == 2)
            {
                const data_after_two_separators = line.replace(split[0] + ":" + split[1] + ":", "");

                if (!data[player][split[0]])
                {
                    data[player][split[0]] = {}
                }

                data[player][split[0]][split[1]] = data_after_two_separators;
            }

        }

        this.props.socket.emit("sync data", data)
    }

    componentWillUnmount()
    {
        if (typeof sm_check_interval != 'undefined')
        {
            clearInterval(sm_check_interval);
        }
    }

    leave_game_room()
    {
        this.props.socket.emit("leave game room")
        this.props.setAppState(APP_STATE.MAIN_MENU)
    }

    render () {
        return (
            <div className="gameroom-main-container">
                <div className="content">
                    <div className="navbar">
                        <div className="navbar-left-container">
                            <img src={back_arrow_icon} className="navitem leave" onClick={() => this.leave_game_room()}></img>
                        </div>
                        {/* <div className="navbar-right-container">
                            <img src={info_icon} className="navitem info"></img>
                            <img src={popout_icon} className="navitem popout"></img>
                        </div> */}
                    </div>
                    <div className="title-container" onClick={() => typeof electron != 'undefined' ?
                        electron.clipboard.writeText(this.state.game_code) : 
                        navigator.clipboard.writeText(this.state.game_code)}>
                        Game Code: <span className="code-bold">{this.state.game_code}</span>
                    </div>
                    <div className="cards-container-outer">
                        <div className="cards-container">
                            {Object.keys(this.state.players).map((key) => 
                            {
                                const player = this.state.players[key];
                                if (player.spectate) {return;}

                                return <PlayerCard {...this.props} key={key} player_data={player} p2={false} update={true} path={this.state.full_file_path}/>
                            })}
                            {Object.keys(this.state.players).map((key) => 
                            {
                                const player = this.state.players[key];
                                if (player.spectate) {return;}

                                return player.data["PlayerNumber_P2"] != undefined &&
                                        <PlayerCard {...this.props} key={key + "2"} player_data={player} p2={true} path={this.state.full_file_path}/>
                            })}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
