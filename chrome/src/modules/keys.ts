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

        constructor(armoredText: string) {
            if (!armoredText) {
                throw new KeyError('missing');
            }

            this.key = this.fromArmored(armoredText);
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

        fingerprint(): string {
            return this.key.primaryKey.getFingerprint();
        }

        userIds(): Array<string> {
            return this.key.getUserIds();
        }

        getPrimaryUser(): string {
            return this.userIds()[0];
        }

        armored(): string {
            return this.key.armor();
        }

        openpgpKey(): openpgp.key.Key {
            return this.key;
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
