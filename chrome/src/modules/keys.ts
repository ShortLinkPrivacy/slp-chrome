/// <reference path="../../typings/openpgp/openpgp.d.ts" />

declare var exports: { [index: string]: any };

module Keys {

    export type UserId = string;
    export type Fingerprint = string;
    export type Armor = string;
    export type UserIdArray = Array<UserId>;
    export type FingerprintArray = Array<Fingerprint>;
    export type ArmorArray = Array<Armor>;

    export class Key {
        key: openpgp.key.Key;

        fingerprint: { (): Fingerprint };
        userIds: { (): UserIdArray };
        getPrimaryUser: { (): UserId };
        armored: { (): Armor };
        openpgpKey: { (): openpgp.key.Key };

        constructor(armoredText: Armor) {
            if (!armoredText) {
                throw new Error('The key armored text is required');
            }

            this.key = this.fromArmored(armoredText);

            // All of these must be bound to the object, so Rivets
            // can add its magic to them.

            this.fingerprint = function(): Fingerprint {
                return this.key.primaryKey.getFingerprint();
            };
            this.userIds = function(): UserIdArray {
                return this.key.getUserIds();
            };
            this.getPrimaryUser = function(): UserId {
                return this.userIds()[0];
            };
            this.armored = function(): Armor {
                return this.key.armor();
            };
            this.openpgpKey = function(): openpgp.key.Key {
                return this.key;
            }
        }

        fromArmored(armoredText: Armor): openpgp.key.Key {
            var result: openpgp.key.KeyResult;

            result = openpgp.key.readArmored(<string>armoredText);

            if (result.err && result.err.length) {
                throw new Error('This does not look like a valid key');
            }

            if (result.keys && !result.keys.length) {
                throw new Error('This does not look like a valid key');
            }

            return result.keys[0];
        }

        // Some keys may have several userIds and only one of them is primary.
        // When we search for a userId, we will find the key fingerprint, but
        // then we need to know what we searched for, so we can display the
        // matching userId.  Example: Stefan G. has a key with the following
        // userIds: stefanguen@gmail.com, sge@ifnx.com.  We search for ifnx, we
        // select Stefan. We want to see sge@ifnx.com in the selection box.
        getMatchingUserId(searchTerm: string): UserId {
            var i: number,
                userIds = this.userIds();

            for (i = 0; i < userIds.length; i++) {
                var re = new RegExp(searchTerm.replace(/\\/g, ""), 'i');
                if ( userIds[i].search(re) >= 0 ) return userIds[i];
            }

            return this.getPrimaryUser();
        }

    }

    export class PublicKey extends Key {
        constructor(armoredText: Armor) {
            super(armoredText);
            if (!this.key.isPublic()) {
                throw "key.not_public";
            }
        }
    }

    export class PrivateKey extends Key {
        private _isDecrypted: boolean;

        constructor(armoredText: Armor) {
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
        getPrimaryUser: { (): UserId };
        fingerprint: { (): Fingerprint };

        // The constructor will optionally take a searched term, which will
        // be used to initialize the name to show for that key.
        constructor(k: Key, searchedTerm?: string) {
            this.key = k;
            this.getPrimaryUser = function() {
                return searchedTerm
                    ? this.key.getMatchingUserId(searchedTerm)
                    : this.key.getPrimaryUser();
            }
            this.fingerprint = function() {
                return this.key.fingerprint();
            }
        }
    }

    export type KeyItemList = Array<KeyItem>;

    if ( typeof window == "undefined" ) {
        exports["Keys"] = Keys;
    }
}
