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
            var result: openpgp.key.KeyResult;

            if (!armoredText) {
                throw new KeyError('missing');
            }

            result = openpgp.key.readArmored(armoredText);

            if (result.err && result.err.length) {
                throw new KeyError('error', result.err);
            }

            if (result.keys && !result.keys.length) {
                throw new KeyError('error', 'unknown');
            }

            this.key = result.keys[0];

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
        constructor(armoredText: string) {
            super(armoredText);
            if (!this.key.isPrivate()) {
                throw "key.not_private";
            }
        }

        toPublic(): Key {
            return new PublicKey(this.key.toPublic().armor());
        }
    }

    if ( typeof window == "undefined" ) {
        exports["Keys"] = Keys;
    }
}
