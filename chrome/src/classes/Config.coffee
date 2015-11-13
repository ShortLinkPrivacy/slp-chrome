class Config

    constructor: (opts = {})->

        result =

            # Chrome store to use
            store: chrome.storage.local

            # Own key
            keyName: 'privateKey'

            # Directory of stored public keys
            directoryKey: 'directory'

            # Default number of bits for new keys
            defaultBits: 2048


        for prop of opts
            if opts.hasOwnPropety prop
                result[prop] = opts[prop]

        return result


window.Config = Config
