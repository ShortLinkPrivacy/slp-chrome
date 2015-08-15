app = angular.module 'Settings', []

# ----------------------------------------
# Config factory
# ----------------------------------------
.factory 'config', ->
    new window.Config()

# ----------------------------------------
# Keyring factory
# ----------------------------------------
.factory 'keyring', ['config', (config)->
    new window.KeyRing(config)
]

window.app = app
