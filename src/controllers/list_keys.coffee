window.app.controller 'ListKeysController', [ '$scope', 'config', 'storage', ( $scope, config, storage )-> 
    $scope.selectedKey = ->
        storage.ownKeys
    
]
