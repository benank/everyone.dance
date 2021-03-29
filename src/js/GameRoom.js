import React, {useState, useEffect} from 'react';
import styles from "../styles/game_room.scss"

import PlayerCard from "./PlayerCard"
import "../styles/navitem.scss"
import { APP_STATE } from './constants/app_state'

import back_arrow_icon from "../icons/back_arrow.svg"
import popout_icon from "../icons/popout.svg"
import info_icon from "../icons/info.svg"
import settings_icon from "../icons/settings.svg"
import SMInstallation from './SMEnvironment';
import GameRoomSettings from "./GameRoomSettings"

import {isWebVersion} from "./constants/isWebVersion"
import {SYNC_MODE} from "./constants/SyncMode"

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
            host_id: props.game_room_data.host_id,
            // Our player is guaranteed to exist
            my_id: Object.values(props.game_room_data.players).filter((player) => player.is_me)[0].id,
            full_file_path: "", // Full file path to everyone.dance.txt
            settings_open: false,
            options: props.game_room_data.options
        }

        this.timed_sync_data = {};
        this.last_sync_time = 0;
    }

    /**
     * Returns whether or not this client is the host or not.
     */
    am_i_host()
    {
        return this.state.my_id == this.state.host_id;
    }

    get_host()
    {
        return this.state.players[this.state.host_id];
    }

    get_sync_mode()
    {
        return this.state.options["sync_mode"]
    }

    get_slowest_player()
    {
        let slowest_player;
        Object.values(this.state.players).forEach((player) => {
            if ((typeof slowest_player == 'undefined' || player.progress < slowest_player.progress) &&
                !player.spectate && !player.failed)
            {
                slowest_player = player;
            }
        });

        return slowest_player;
    }

    get_player_data(player)
    {
        return typeof player.data["PlayerNumber_P1"] != 'undefined' ? player.data["PlayerNumber_P1"] : player.data["PlayerNumber_P2"];
    }

    have_all_players_started()
    {
        return Object.values(this.state.players).filter((p) => !p.spectate && p.ingame).length 
            == Object.values(this.state.players).filter((p) => !p.spectate).length;
    }

    // Called when player data is synced from server, including scores
    sync_player_data(args)
    {
        if (typeof this.state.players[args.id] == 'undefined') {return;}

        if (this.get_sync_mode() == SYNC_MODE.Realtime)
        {
            const players_copy = JSON.parse(JSON.stringify(this.state.players));
            players_copy[args.id] = args;
            players_copy[args.id].is_me = args.id == this.state.my_id;

            this.setState({players: players_copy});
        }
        else if (this.get_sync_mode() == SYNC_MODE.SongTime)
        {
            const players_copy = JSON.parse(JSON.stringify(this.state.players));

            players_copy[args.id].spectate = args.spectate;
            players_copy[args.id].name = args.name;
            players_copy[args.id].is_me = args.id == this.state.my_id;

            players_copy[args.id].ingame = this.get_player_data(args).ingame == "true"
            players_copy[args.id].progress = this.get_player_data(args).progress
            players_copy[args.id].failed = this.get_player_data(args).failed == "true"

            if (!players_copy[args.id].ingame)
            {
                players_copy[args.id].data = args.data;
            }

            // Replace steps info with empty array temporarily and clear 
            const data_copy = JSON.parse(JSON.stringify(args.data));
            if (typeof data_copy["PlayerNumber_P1"] != 'undefined')
            {
                players_copy[args.id].data["PlayerNumber_P1"].song_info = data_copy["PlayerNumber_P1"].song_info;
            }

            if (typeof data_copy["PlayerNumber_P2"] != 'undefined')
            {
                players_copy[args.id].data["PlayerNumber_P2"].song_info = data_copy["PlayerNumber_P2"].song_info;
            }

            this.setState({players: players_copy});

            const progress = Math.floor(this.get_player_data(args).progress * 1000);

            if (typeof this.timed_sync_data[progress] == 'undefined')
            {
                this.timed_sync_data[progress] = {}
            }

            this.timed_sync_data[progress][args.id] = args;

            // If not all players have started, don't start syncing
            if (!this.have_all_players_started()) {return;}

            const slowest_player = this.get_slowest_player();
            if (typeof slowest_player == 'undefined') {return;}

            const slowest_progress = Math.floor(slowest_player.progress * 1000);

            const player_data = JSON.parse(JSON.stringify(this.state.players));

            for (let i = this.last_sync_time; i <= slowest_progress; i++)
            {
                if (typeof this.timed_sync_data[i] == 'undefined') {continue;}

                Object.values(this.timed_sync_data[i]).forEach((args) => {
                    if (typeof player_data[args.id] != 'undefined')
                    {
                        player_data[args.id].data = args.data;
                    }
                });

                delete this.timed_sync_data[i];
            }

            this.setState({
                players: player_data
            })
            this.last_sync_time = slowest_progress;
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
            this.sync_player_data(args);
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

        this.props.socket.on("update options", (options) => 
        {
            this.setState({
                options: options
            })
        })

        this.props.socket.on("new host", (id) => 
        {
            this.setState({
                host_id: id
            })
        })

        if (!isWebVersion)
        {
            sm_check_interval = setInterval(() => {
                this.check_for_sm_updates();
            }, SM_CHECK_INTERVAL_TIME);

            const dir = localStorage.getItem("stepmania_dir");

            const sm_install = new SMInstallation(dir);
            NOT_APPDATA = sm_install.is_portable;
            SM_FILE_PATH = sm_install.score_file;
        }
    }

    check_for_sm_updates()
    {
        const file_path = SM_FILE_PATH;
        if (this.state.full_file_path != file_path)
        {
            this.setState({full_file_path: file_path})
        }

        // File does not exist
        if (!electron.fs.existsSync(file_path)) {return;}

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

    toggle_settings()
    {
        this.setState({
            settings_open: !this.state.settings_open
        })
    }

    click_settings_toggle(option)
    {
        // Not host, so return
        if (!this.am_i_host()) {return;}

        if (typeof this.state.options[option] == 'undefined') {return;}

        const options_copy = JSON.parse(JSON.stringify(this.state.options));
        
        if (option != "player_limit")
        {
            options_copy[option] = !options_copy[option];
        }
        else if (option == "player_limit")
        {
            options_copy[option] = options_copy[option] == -1 ? 2 : -1;
        }

        this.setState({
            options: options_copy
        })

        this.props.socket.emit("update options", options_copy);
    }

    update_settings_max_players(amount)
    {
        // Not host, so return
        if (!this.am_i_host()) {return;}

        if (amount <= 0)
        {
            this.click_settings_toggle("player_limit");
            return;
        }

        const options_copy = JSON.parse(JSON.stringify(this.state.options));
        options_copy["player_limit"] = Math.max(1, Math.min(amount, 99));

        this.setState({
            options: options_copy
        })

        this.props.socket.emit("update options", options_copy);
    }

    update_settings_sync_mode(mode)
    {
        // Not host, so return
        if (!this.am_i_host()) {return;}

        const options_copy = JSON.parse(JSON.stringify(this.state.options));
        options_copy["sync_mode"] = mode;

        this.setState({
            options: options_copy
        })

        this.props.socket.emit("update options", options_copy);
    }

    render () {
        return (
            <div className="gameroom-main-container">
                <div className="content">
                    <div className="navbar">
                        <div className="navbar-left-container">
                            <img src={back_arrow_icon} className="navitem leave" onClick={() => this.leave_game_room()}></img>
                        </div>
                        <div className="navbar-right-container">
                            <img src={settings_icon} onClick={() => this.toggle_settings()} className="navitem settings"></img>
                            {/* <img src={info_icon} className="navitem info"></img>
                            <img src={popout_icon} className="navitem popout"></img> */}
                        </div>
                    </div>
                    {this.state.options["show_game_code"] && <div className="title-container" onClick={() => !isWebVersion ?
                        electron.clipboard.writeText(this.state.game_code) : 
                        navigator.clipboard.writeText(this.state.game_code)}>
                        Game Code: <span className="code-bold">{this.state.game_code}</span>
                    </div>}
                    <div className="cards-container-outer">
                        <div className="cards-container">
                            {Object.keys(this.state.players).map((key) => 
                            {
                                const player = this.state.players[key];
                                if (player.spectate) {return;}

                                return player.data["PlayerNumber_P1"] != undefined &&
                                    <PlayerCard {...this.props} options={this.state.options} key={key} player_data={player} p2={false} update={true} path={this.state.full_file_path}/>
                            })}
                            {Object.keys(this.state.players).map((key) => 
                            {
                                const player = this.state.players[key];
                                if (player.spectate) {return;}

                                return player.data["PlayerNumber_P2"] != undefined &&
                                        <PlayerCard {...this.props} options={this.state.options} key={key + "2"} player_data={player} p2={true} path={this.state.full_file_path}/>
                            })}
                        </div>
                    </div>
                </div>
                {this.state.settings_open && 
                    <GameRoomSettings 
                    options={this.state.options}
                    host_id={this.state.host_id}
                    my_id={this.state.my_id}
                    players={this.state.players}
                    toggleSettings={this.toggle_settings.bind(this)}
                    click_toggle={this.click_settings_toggle.bind(this)}
                    setPlayerLimit={this.update_settings_max_players.bind(this)}
                    setSyncMode={this.update_settings_sync_mode.bind(this)}
                    {...this.props}></GameRoomSettings>
                }
            </div>
        )
    }
}
