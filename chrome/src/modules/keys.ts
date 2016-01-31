/// <reference path="../../typings/openpgp/openpgp.d.ts" />

declare var exports: { [index: string]: any };

module Keys {

    export class KeyError extends Error {
        code: string;
        data: any;

        constructor(code: string, data?: any) {
            super();
            this.code = 'key.' + code;
            this.data = data;
        }
    }

    export class Key {
        key: openpgp.key.Key;

        fingerprint: { (): Interfaces.Fingerprint };
        userIds: { (): Array<Interfaces.UserID> };
        getPrimaryUser: { (): Interfaces.UserID };
        armored: { (): Interfaces.Armor };
        openpgpKey: { (): openpgp.key.Key };

        constructor(armoredText: Interfaces.Armor) {
            if (!armoredText) {
                throw new KeyError('missing');
            }

            this.key = this.fromArmored(armoredText);

            // All of these must be bound to the object, so Rivets
            // can add its magic to them.

            this.fingerprint = function(): Interfaces.Armor {
                return this.key.primaryKey.getFingerprint();
            };
            this.userIds = function(): Array<Interfaces.UserID> {
                return this.key.getUserIds();
            };
            this.getPrimaryUser = function(): Interfaces.UserID {
                return this.userIds()[0];
            };
            this.armored = function(): Interfaces.Armor {
                return this.key.armor();
            };
            this.openpgpKey = function(): openpgp.key.Key {
                return this.key;
            }
        }

        fromArmored(armoredText: Interfaces.Armor): openpgp.key.Key {
            var result: openpgp.key.KeyResult;

            result = openpgp.key.readArmored(<string>armoredText);

            if (result.err && result.err.length) {
                throw new KeyError('error', result.err);
            }

            if (result.keys && !result.keys.length) {
                throw new KeyError('error', 'unknown');
            }

            return result.keys[0];
        }

    }

    export class PublicKey extends Key {
        constructor(armoredText: Interfaces.Armor) {
            super(armoredText);
            if (!this.key.isPublic()) {
                throw "key.not_public";
            }
        }
    }

    export class PrivateKey extends Key {
        private _isDecrypted: boolean;

        constructor(armoredText: Interfaces.Armor) {
            super(armoredText);
            if (!this.key.isPrivate()) {
                throw "key.not_private";
            }
            this._isDecrypted = false;
        }

        toPublic(): Key {
            return new PublicKey(this.key.toPublic().armor());
        }

        decrypt(password: string): boolean {
            return this._isDecrypted = this.key.decrypt(password);
        }

        lock(): void {
            this.key = this.fromArmored(this.armored());
            this._isDecrypted = false;
        }

        isDecrypted(): boolean {
            return this._isDecrypted;
        }
    }

    // Rivets bindings requre an abstraction layer to properly
    // bind and display complex structures. We use this one
    // in a couple of places where we need to display a list of
    // keys.
    export class KeyItem {
        key: Key;
        getPrimaryUser: { (): string };
        fingerprint: { (): Interfaces.Fingerprint };

        constructor(k: Key) {
            this.key = k;
            this.getPrimaryUser = function() {
                return this.key.getPrimaryUser();
            }
            this.fingerprint = function() {
                return this.key.fingerprint();
            }
        }
    }

    if ( typeof window == "undefined" ) {
        exports["Keys"] = Keys;
    }
}
