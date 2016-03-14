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
                        error = "Message server error"
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
        url = 'http://slp.li';

        // Items
        itemPath = this.url + '/x';
        itemRegExp = this.itemPath + "/([0-9,a-f]+)";

        // Captures
        capturePath = this.url + '/c';

        // Save an item and return a IdResponse success structure
        saveItem(item: Messages.ArmorType, callback: IdCallback): void {
            // Add generic values to armor
            item.extVersion = chrome.runtime.getManifest()["version"];
            httpPost(this.itemPath, item, callback);
        }

        // Load an item (by its ID) into an Armored class
        loadItem(id: Messages.Id, callback: ArmorCallback): void {
            httpGet(this.getItemUrl(id), {}, callback);
        }

        getItemUrl(id: string): string {
            return this.itemPath + '/' + id;
        }

        // Save captures (fire and forget)
        saveCapture(capture: any): void {
            httpPost(this.capturePath, capture, () => {});
        }

    }

    //-------------------------------------------------------------------------------

    export class Keybase implements KeySource.RemoteStore {
        lookupUrl = "https://keybase.io/_/api/1.0/user/lookup.json";

        search(what: string, callback: Interfaces.ResultCallback<Keys.PublicKeyArray>): void {
            var keys: Keys.PublicKeyArray = [];

            if (what.length < 3) {
                callback([]);
                return;
            }

            httpGet(this.lookupUrl + "?usernames=" + escape(what), {}, (result) => {
                var i: number,
                    stat: { code: number },
                    them: any;

                if ( !result.success ) { callback([]); return; }

                stat = result.value["status"];
                if ( stat.code != 0 ) { callback([]); return; }

                them = result.value.them;
                if (!them || !them.length) { callback([]); return; }

                for (i = 0; i < them.length; i++) {
                    var v: any;

                    if ( !(v = them[i]) ) continue;
                    if ( !(v = v.public_keys) ) continue;
                    if ( !(v = v.primary) ) continue;
                    if ( !(v = v.bundle) ) continue;

                    keys.push(new Keys.PublicKey(v));
                }

                callback(keys);
            });
        }
    }

}
