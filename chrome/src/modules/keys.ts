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

        fingerprint: { (): string };
        userIds: { (): Array<string> };
        getPrimaryUser: { (): string };
        armored: { (): string };
        openpgpKey: { (): openpgp.key.Key };

        constructor(armoredText: string) {
            if (!armoredText) {
                throw new KeyError('missing');
            }

            this.key = this.fromArmored(armoredText);

            // All of these must be bound to the object, so Rivets
            // can add its magic to them.

            this.fingerprint = function(): string {
                return this.key.primaryKey.getFingerprint();
            };
            this.userIds = function(): Array<string> {
                return this.key.getUserIds();
            };
            this.getPrimaryUser = function(): string {
                return this.userIds()[0];
            };
            this.armored = function(): string {
                return this.key.armor();
            };
            this.openpgpKey = function(): openpgp.key.Key {
                return this.key;
            }
        }

        fromArmored(armoredText: string): openpgp.key.Key {
            var result: openpgp.key.KeyResult;

            result = openpgp.key.readArmored(armoredText);

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
        constructor(armoredText: string) {
            super(armoredText);
            if (!this.key.isPublic()) {
                throw "key.not_public";
            }
        }
    }

    export class PrivateKey extends Key {
        private _isDecrypted: boolean;

        constructor(armoredText: string) {
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

    if ( typeof window == "undefined" ) {
        exports["Keys"] = Keys;
    }
}
