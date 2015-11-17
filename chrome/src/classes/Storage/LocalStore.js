/// <reference path="../../../typings/chrome/chrome.d.ts" />
/// <reference path="../Interfaces.ts" />
/// <reference path="../PublicKey.ts" />
/// <reference path="../Services.ts" />
var Services;
(function (Services) {
    var LocalStore = (function () {
        function LocalStore(config) {
            this.directory = {};
            this.messages = {};
            this.config = config;
        }
        LocalStore.prototype.checkRuntimeError = function (error) {
            if (typeof chrome.runtime != "undefined" && chrome.runtime.lastError) {
                throw chrome.runtime.lastError;
            }
        };
        LocalStore.prototype.saveDirectory = function (callback) {
            var setter = {};
            setter[this.config.directory] = this.directory;
            this.config.store.set(setter, function () {
                this.checkRuntimeError();
                callback();
            });
        };
        LocalStore.prototype.initialize = function (callback) {
            var store = this.config.store;
            var mk = this.config.messages;
            var dk = this.config.directory;
            // Load the directory with publick keys and messages
            store.get([mk, dk], function (result) {
                if (typeof result[dk] != "undefined") {
                    this.directory = result[dk];
                }
                if (typeof result[mk] != "undefined") {
                    this.messages = result[mk];
                }
                callback();
            });
        };
        LocalStore.prototype.storePublicKey = function (key, callback) {
            if (this.directory[key.fingerprint()])
                return;
            this.directory[key.fingerprint()] = key;
            this.saveDirectory(callback);
        };
        LocalStore.prototype.loadPublicKey = function (fingerprint, callback) {
            var key = this.directory[fingerprint];
            callback(key);
        };
        LocalStore.prototype.searchPublicKey = function (userId, callback) {
            var result = [];
            var re = new RegExp(userId);
            for (var fingerprint in this.directory) {
                var key = this.directory[fingerprint];
                var userIds = key.userIds();
                userIds.forEach(function (id) {
                    if (id.match(re)) {
                        result.push(key);
                    }
                });
            }
            callback(result);
        };
        LocalStore.prototype.storeMessage = function (armored, callback) {
        };
        LocalStore.prototype.loadMessage = function (id, callback) {
        };
        return LocalStore;
    })();
})(Services || (Services = {}));
