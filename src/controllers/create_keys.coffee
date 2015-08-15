window.app.controller 'CreateKeysController', [ '$scope', 'config', 'keyring', ($scope, config, keyring)->
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

        if keyring.findByIdOrEmail($scope.form.email, $scope.form.name)
            $scope.error = "A key with this name or email already exists"
            return

        $scope.spinner = on
        options =
            numBits: $scope.form.bits
            userId: "#{$scope.form.name} <#{$scope.form.email}>"
            passphrase: $scope.form.passphrase

        openpgp.generateKeyPair(options)
        .then (keypair)->
            $scope.$apply ->
                $scope.spinner = off
                $scope.keypair = keypair
                storage.saveOwnKey keypair
        .catch (error)->
            console.log error
]

