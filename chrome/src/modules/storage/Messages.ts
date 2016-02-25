/// <reference path="../../../typings/chrome/chrome.d.ts" />
/// <reference path="../interfaces.ts" />

module MessageStore {

    // Structure returned after saving a message
    export type IdResponse = {
        id: Messages.Id;
    }

    // Success callback with value type message id
    export type IdCallback = Interfaces.SuccessCallback<IdResponse>;

    // Success callback with value type armored object
    export type ArmoredCallback = Interfaces.SuccessCallback<Messages.Armored>;

    // Anyone implementing settings should implements this
    export interface Interface {

        save(armor: Messages.ArmorType, callback: IdCallback): void;
        load(id: Messages.Id, callback: ArmoredCallback): void;

        // Get the URL from an id
        getURL(id: Messages.Id): string;

        // Returns a string for the regex that matches the url. Why string?
        // Because we'll end up passing it to content via a message and RegExp
        // is an object (i.e. it'll get lost in the message)
        getReStr(): string;
    }

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

}

