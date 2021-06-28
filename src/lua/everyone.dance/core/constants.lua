local constants = {}

constants.DEBUG_ON = true

constants.data_filename = "Save/everyone.dance.txt"
constants.data_timings_filename = "Save/everyone.dance.timings.txt"
constants.data_game_code_filename = "Save/everyone.dance.gamecode.txt"
constants.goto_filename = "Save/everyone.dance.txt.goto"

constants.timing_data_interval = 10

constants.itg_timing_prefs = 
{
    "TimingWindowAdd",
    "RegenComboAfterMiss",
    "MaxRegenComboAfterMiss",

    "TimingWindowSecondsW1",
    "TimingWindowSecondsW2",
    "TimingWindowSecondsW3",
    "TimingWindowSecondsW4",
    "TimingWindowSecondsW5",
    "TimingWindowSecondsHold",
    "TimingWindowSecondsMine",
    "TimingWindowSecondsRoll",

    "LifeDifficultyScale",
    "LifePercentChangeW1",
    "LifePercentChangeW2",
    "LifePercentChangeW3",
    "LifePercentChangeW4",
    "LifePercentChangeW5",
    "LifePercentChangeMiss",
    "LifePercentChangeLetGo",
    "LifePercentChangeHeld",
    "LifePercentChangeHitMine",
    "InitialValue",
    "HarshHotLifePenalty",
    
    "PercentScoreWeightW1",
    "PercentScoreWeightW2",
    "PercentScoreWeightW3",
    "PercentScoreWeightW4",
    "PercentScoreWeightW5",
    "PercentScoreWeightMiss",
    "PercentScoreWeightLetGo",
    "PercentScoreWeightHeld",
    "PercentScoreWeightHitMine"
}

return constants