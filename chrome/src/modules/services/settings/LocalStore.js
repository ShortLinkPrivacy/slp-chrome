/// <reference path="../../../../typings/chrome/chrome.d.ts" />
/// <reference path="../definitions.ts" />
/// <reference path="../../interfaces.ts" />
/// <reference path="../../pgp/keys.ts" />
var Services;
(function (Services) {
    var LocalStore = (function () {
        function LocalStore(config) {
            this.config = config.settings.localStore;
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
