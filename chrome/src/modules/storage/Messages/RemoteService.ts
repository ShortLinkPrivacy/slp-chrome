/// <reference path="../../../../typings/chrome/chrome.d.ts" />
/// <reference path="../../../../typings/openpgp/openpgp.d.ts" />
/// <reference path="../../interfaces.ts" />
/// <reference path="../Messages.ts" />

module MessageStore {

    export class RemoteService implements Interface {
        private static url: string = 'http://slp.li';
        private static path: string = '/x';

        save(armor: Messages.ArmorType, callback: IdCallback): void {
            // Add generic values to armor
            armor.extVersion = chrome.runtime.getManifest()["version"];
            httpPost(RemoteService.url + RemoteService.path, armor, callback);
        }

        load(id: Messages.Id, callback: ArmoredCallback): void {
            httpGet(this.getURL(id), {}, callback);
        }

        getURL(id: string): string {
            return RemoteService.url + RemoteService.path + '/' + id;
        }

        getReStr(): string {
            return RemoteService.url + RemoteService.path + "/([0-9,a-f]+)";
        }
    }
}

