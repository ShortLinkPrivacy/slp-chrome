/// <reference path="../typings/openpgp.d.ts" />

module Keys {
    class Key {
        key: openpgp.key.Key;

        constructor(armoredText: string) {
            var result = openpgp.key.readArmored(armoredText);
            var key: openpgp.key.Key;

            if (result.err && result.err.length) {
                throw "key.missing";
            }

            if (result.keys && !result.keys.length) {
                throw "key.missing";
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
}
