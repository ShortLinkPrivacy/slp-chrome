class Config
    
    constructor: (opts = {})->

        result =

            # Own key
            keyName: 'privateKey'

            # Default number of bits for new keys
            defaultBits: 2048


        for prop of opts
            if opts.hasOwnPropety prop
                result[prop] = opts[prop]

        return result


window.Config = Config
