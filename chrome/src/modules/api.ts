
module API {

    // Structure returned after saving a message
    export type IdResponse = {
        id: Messages.Id;
    }

    export type IdCallback = Interfaces.SuccessCallback<IdResponse>;

    // Success callback with value type armored object
    export type ArmoredCallback = Interfaces.SuccessCallback<Messages.ArmorType>;

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
                    callback({ success: false, error: r.responseText || "No response from server" });
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
        loadItem(id: Messages.Id, callback: ArmoredCallback): void {
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
}
