/// <reference path="../../../typings/chrome/chrome.d.ts" />
/// <reference path="../Interfaces.ts" />
/// <reference path="../PublicKey.ts" />
/// <reference path="../Settings.ts" />
var Services;
(function (Services) {
    var LocalStore = (function () {
        function LocalStore(config) {
            this.config = config;
        }
        LocalStore.prototype.storePrivateKey = function (key, callback) {
            var setter = {};
            setter[this.config.privateKey] = key.armored();
            this.config.store.set(setter, function () {
                this.checkRuntimeError();
                callback();
            });
        };
        LocalStore.prototype.loadPrivateKey = function (callback) {
            this.config.store.get(this.config.privateKey, function (result) {
                callback(result[this.config.privateKey]);
            });
        };
        return LocalStore;
    })();
    Services.LocalStore = LocalStore;
})(Services || (Services = {}));
