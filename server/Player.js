module.exports = class Player
{
    constructor(client)
    {
        this.client = client;
        this.background_color = this.getRandomBackgroundColor();
        this.name = `Player ${Math.ceil(Math.random() * 1000)}`;
        this.song_info = {};
        this.steps_info = 
        {
            TapNoteScore_W1: 0,
            TapNoteScore_W2: 0,
            TapNoteScore_W3: 0,
            TapNoteScore_W4: 0,
            TapNoteScore_W5: 0,
            TapNoteScore_Miss: 0,
            HoldNoteScore_Held: 0,
            HoldNoteScore_LetGo: 0
        },
        this.progress = 0;
        this.score = 0;
        this.ingame = false;
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

    /**
     * Returns all synced data for a player or a specific field only, if specified
     * @param {*} field 
     */
    getSyncData(field)
    {
        const sync_data = {
            id: this.client.id,
            name: this.name,
            background_color: this.background_color,
            song_info: this.song_info,
            steps_info: this.steps_info,
            progress: this.progress,
            score: this.score,
            ingame: this.ingame
        }

        return typeof field == 'undefined' ? sync_data : {[field]: sync_data[field]}
    }

    /**
     * Returns only data that should be synced while ingame, such as step judgements and progress
     */
    getIngameSyncData()
    {
        return {
            steps_info: this.steps_info,
            progress: this.progress,
            score: this.score
        }
    }

}