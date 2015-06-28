app = angular.module 'Settings', []
.factory 'config', ->
    defaultBits: 2048

window.app = app
