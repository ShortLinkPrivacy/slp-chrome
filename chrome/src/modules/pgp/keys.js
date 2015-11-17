var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="../../typings/openpgp.d.ts" />
var PGP;
(function (PGP) {
    var Key = (function () {
        function Key(armoredText) {
            var result = openpgp.key.readArmored(armoredText);
            var key;
            if (result.err && result.err.length) {
                throw "key.missing";
            }
            if (result.keys && !result.keys.length) {
                throw "key.missing";
            }
            this.key = result.keys[0];
        }
        Key.prototype.fingerprint = function () {
            return this.key.primaryKey.getFingerprint();
        };
        Key.prototype.userIds = function () {
            return this.key.getUserIds();
        };
        Key.prototype.getPrimaryUser = function () {
            return this.userIds()[0];
        };
        Key.prototype.armored = function () {
            return this.key.armor();
        };
        return Key;
    })();
    var PublicKey = (function (_super) {
        __extends(PublicKey, _super);
        function PublicKey(armoredText) {
            _super.call(this, armoredText);
            if (!this.key.isPublic()) {
                throw "key.not_public";
            }
        }
        return PublicKey;
    })(Key);
    PGP.PublicKey = PublicKey;
    var PrivateKey = (function (_super) {
        __extends(PrivateKey, _super);
        function PrivateKey(armoredText) {
            _super.call(this, armoredText);
            if (!this.key.isPrivate()) {
                throw "key.not_private";
            }
        }
        return PrivateKey;
    })(Key);
    PGP.PrivateKey = PrivateKey;
})(PGP || (PGP = {}));
