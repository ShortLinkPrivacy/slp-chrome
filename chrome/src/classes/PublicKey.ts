/// <reference path="../../typings/openpgp/openpgp.d.ts" />
module PGP {
    export class PublicKey {
        armor: string;
        key: openpgp.key.Key;
        constructor(armor: string) {
            this.armor = armor;
            var result = openpgp.key.readArmored(armor);  

            if (result.err && result.err.length || result.keys && result.keys.length == 0) {
                this.key = result.keys[0];
                if (!this.key.isPublic()) {
                    throw "key.not_public";
                }
            }
        }

        fingerprint(): string {
            return this.key.primaryKey.fingerprint;
        }

        expirationTime(): Date {
            return this.key.getExpirationTime();
        }
    }
}
