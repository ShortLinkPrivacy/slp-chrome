class Config
    
    constructor: (opts = {})->

        result =

            # Default number of bits for new keys
            defaultBits: 2048

            # Name of localStorage key containing the key ring
            keyringTag: 'keyring'

        for prop of opts
            if opts.hasOwnPropety prop
                result[prop] = opts[prop]

        return result


window.Config = Config
