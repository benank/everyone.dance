-- do not collect inits beyond the initial frame & do not collect nested init's
ED.__collect_inits = false

-- execute the inits in the order we received them
for index, init_function_data in ipairs(ED.__init_list) do
    local init_function = init_function_data[2]

    init_function()
    -- inits created inside of the init_function (nested inits) will immediately come into existance as instances
end

---------
-- Execute the postLoads
---------

for index, init_function_data in ipairs(ED.__init_list) do
    local instance = init_function_data[1]

    if instance.__postLoad then
        instance.__postLoad()
    end
end

-- Finished initializing classes

ED.__init_list = nil