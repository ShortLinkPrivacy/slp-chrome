/// <reference path="../../../typings/chrome/chrome.d.ts" />
/// <reference path="../../../typings/openpgp/openpgp.d.ts" />
/// <reference path="../message-store.ts" />
/// <reference path="../interfaces.ts" />

module MessageStore {

    export class RemoteService implements Interface {
        url: string;
        path: string;
        regexp: RegExp;

        constructor(config: any) {
            this.url = config.url;
            this.path = config.path;
            this.regexp = new RegExp(this.url + this.path + "/\\w+", "gm");
        }

        save(armor: string, callback: MessageIdCallback): void {
            var r: XMLHttpRequest,
                json: MessageIdStruct;

            r = new XMLHttpRequest();
            r.open('POST', this.url + this.path, true);
            r.onreadystatechange = function() {
                if (r.readyState == 4) {
                    json = JSON.parse(r.responseText);   
                    if (r.status != 201 || json.error) {
                        callback({
                            success: false,
                            error: json.error || r.responseText
                        });
                        return;
                    }
                    callback({
                        success: true,
                        id: json.id
                    });
                }
            }
            r.setRequestHeader('Content-Type', 'application/json');
            r.send(JSON.stringify({armor: armor}));
        }

        load(id: string, callback: MessageArmoredCallback): void {
            var r: XMLHttpRequest,
                json: MessageArmoredStruct;

            r = new XMLHttpRequest();
            r.open('GET', this.getURL(id), true);
            r.onreadystatechange = function() {
                if (r.readyState != 4) {
                    if (r.status != 200) {
                        callback({
                            success: false,
                            error: r.responseText
                        });
                        return;
                    }
                    json = JSON.parse(r.responseText);   
                    callback({
                        success: true,
                        armor: json.armor
                    });
                }
            }
            r.setRequestHeader('Content-Type', 'application/json');
            r.send();
        }

        getURL(id: string): string {
            return this.url + this.path + '/' + id;
        }
    }
}

