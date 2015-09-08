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

# ----------------------------------------
# MainController
# ----------------------------------------
.controller 'MainController', [ '$scope', 'config', ($scope, config)->
    $scope.view = 'list'
    $scope.switch = (to)->
        $scope.view = to

    $scope.selectedKey = null
#    $scope.$watch "selectedKey", (o, n)->
#        "selectedKey changed to #{n}"
]

# ----------------------------------------
# ListKeysController
# ----------------------------------------
.controller 'ListKeysController', [ '$scope', 'keyring', ( $scope, keyring )->
    $scope.keyring = keyring
    $scope.selectedKey = if keyring.length() then keyring.at(0) else null
]

# ----------------------------------------
# KeyInfoController
# ----------------------------------------
.controller 'ViewKeysController', [ '$scope', 'keyring', ( $scope, keyring ) ->
    return unless $scope.selectedKey?
    $scope.showPublic = yes
    $scope.toggle = ->
        $scope.showPublic = not $scope.showPublic

    $scope.createdDate = new Date()
    $scope.createdDate.setTime($scope.selectedKey.created)
]

# ----------------------------------------
# CreateKeysController
# ----------------------------------------
.controller 'CreateKeysController', [ '$scope', 'config', 'keyring', ($scope, config, keyring)->
    $scope.form =
        bits: config.defaultBits
        name: null
        email: null
        passphrase: null
        confirm: null

    $scope.error = null
    $scope.spinner = null
    $scope.keypair = null

    $scope.generateKeys = ->
        $scope.error = null

        unless $scope.newKeysForm.$valid
            $scope.error = "Form error. Please see below for more information."
            return

        if $scope.form.passphrase != $scope.form.confirm
            $scope.error = "The passphrase and the passphrase confirmation do not match"
            return

        if keyring.find($scope.form.email)
            $scope.error = "A key with this email already exists"
            return

        $scope.spinner = on

        options =
            numBits: config.defaultBits
            userId: "#{$scope.form.name} <#{$scope.form.email}>"
            passphrase: $scope.passphrase

        openpgp.generateKeyPair(options)
        .then (keypair)=>
            $scope.spinner = off

            # Collect needed props in the key object
            $scope.selectedKey =
                userId: options.userId
                publicKeyArmored: keypair.publicKeyArmored
                privateKeyArmored: keypair.privateKeyArmored
                fingerprint: keypair.key.primaryKey.fingerprint
                created: keypair.key.primaryKey.created.getTime()
                algorithm: keypair.key.primaryKey.algorithm

            # .. and add it to the keyring
            keyring.add $scope.selectedKey

        .catch (error)=>
            $scope.spinner = off
            $scope.error = "Can not create a new key - #{error}"
]


window.app = app
