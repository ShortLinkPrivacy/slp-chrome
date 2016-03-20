declare function escape(s: string): string;

module API {

    // Structure returned after saving a message
    export type IdResponse = {
        id: Messages.Id;
    }

    export type IdCallback = Interfaces.SuccessCallback<IdResponse>;

    // Success callback with value type armored object
    export type ArmorCallback = Interfaces.SuccessCallback<Messages.ArmorType>;

    // Return value types for http functions' callbacks
    export type AnySuccess = Interfaces.SuccessCallback<any>;

    export function http(method: string, url: string, args: any, callback: AnySuccess): void {
        var r = new XMLHttpRequest(),
            json: any,
            okStatus: number;

        // POST should return 201 on success and GET should return 200
        okStatus = method == 'POST' ? 201 : 200;

        r.open(method, url, true);
        r.onreadystatechange = function() {
            if (r.readyState == 4) {
                if (r.status != okStatus) {
                    var error: string;
                    if ( r.status == 404 || r.status == 410 ) {
                        error = "Expired private message"
                    } else {
                        try {
                            json = JSON.parse(r.responseText)
                        } catch (err) {
                            json = { error: "Server error" };
                        }
                        error = json.error;
                    }
                    callback({ success: false, error: error });
                    return;
                }

                try {
                    json = JSON.parse(r.responseText);
                } catch (e) {
                    callback({ success: false, error: "JSON parse error" });
                    return;
                }

                callback({ success: true, value: json });
            }
        }

        r.onerror = function(r) {
            callback({ success: false, error: "Bad server response" })
        }

        r.setRequestHeader('Content-Type', 'application/json');
        r.send(JSON.stringify(args));
    }

    export function httpPost(url: string, args: any, callback: AnySuccess): void {
        http('POST', url, args, callback);
    }

    export function httpGet(url: string, args: any, callback: AnySuccess): void {
        http('GET', url, args, callback);
    }

    //-------------------------------------------------------------------------------

    export class ShortLinkPrivacy {
        static url = 'http://slp.li';

        // Items
        static itemPath = ShortLinkPrivacy.url + '/x';
        static itemRegExp = ShortLinkPrivacy.itemPath + "/([0-9,a-f]+)";

        // Save an item and return a IdResponse success structure
        saveItem(item: Messages.ArmorType, callback: IdCallback): void {
            // Add generic values to armor
            item.extVersion = chrome.runtime.getManifest()["version"];
            httpPost(ShortLinkPrivacy.itemPath, item, callback);
        }

        // Load an item (by its ID) into an Armored class
        loadItem(id: Messages.Id, callback: ArmorCallback): void {
            httpGet(this.getItemUrl(id), {}, callback);
        }

        getItemUrl(id: string): string {
            return ShortLinkPrivacy.itemPath + '/' + id;
        }

    }

    //-------------------------------------------------------------------------------

    export class Keybase implements KeySource.RemoteStore {
        baseUrl = "https://keybase.io/_/api/1.0";

        search(what: string, callback: Interfaces.ResultCallback<Keys.PublicKeyArray>): void {
            var keys: Keys.PublicKeyArray,
                usernames: Array<string>,
                fingerprints: Keys.FingerprintArray;

            if (what.length < 3) {
                callback([]);
                return;
            }

            httpGet(this.baseUrl + "/user/autocomplete.json?q=" + escape(what), {}, (result) => {
                if (!result.success) {
                    callback([]);
                    return;
                }

                try {
                    usernames = result.value.completions.map((i) => {
                        return i.components.username.val;
                    })
                } catch (e) {
                    callback([]);
                    return;
                }

                httpGet(this.baseUrl + "/user/lookup.json?usernames=" + escape(usernames.join(",")), {}, (result) => {
                    if (!result.success) {
                        callback([]);
                        return;
                    }

                    try {
                        keys = result.value.them.map((i) => {
                            return new Keys.PublicKey(i.public_keys.primary.bundle);
                        })
                    } catch(e) {
                        callback([]);
                        return;
                    }

                    callback(keys);
                })
            });

        }
    }

}
