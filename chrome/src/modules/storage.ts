/// <reference path="../../typings/chrome/chrome.d.ts" />
/// <reference path="interfaces.ts" />

class LocalStorage {
    store: chrome.storage.StorageArea;

    constructor(store: chrome.storage.StorageArea) {
        this.store = store;
    }

    private checkRuntimeError(): void {
        if ( typeof chrome.runtime != "undefined" && chrome.runtime.lastError ) {
            throw new Error(<string>chrome.runtime.lastError);
        }
    }

    _get_single(name: string, callback: Interfaces.ResultCallback): void {
        this.store.get(name, (obj) => {
            this.checkRuntimeError();
            callback(obj[name]);
        })
    }

    _set_single(name: string, value: any, callback: Interfaces.Callback): void {
        var setter = {};
        setter[name] = value;
        this.store.set(setter, () => {
            this.checkRuntimeError();
            callback();
        })
    }

    _remove_single(name: string, callback: Interfaces.Callback): void {
        this.store.remove(name, () => {
            this.checkRuntimeError();
            callback();
        });
    }

    _get_many(getter: any, callback: Interfaces.ResultCallback): void {
        this.store.get(getter, (result) => {
            this.checkRuntimeError();
            callback(result);
        })
    }

    _set_many(setter: any, callback: Interfaces.Callback): void {
        this.store.set(setter, () => {
            this.checkRuntimeError();
            callback();
        })
    }

    _remove_many(remover: any, callback: Interfaces.Callback): void {
        this.store.remove( remover, () => {
            this.checkRuntimeError();
            callback();
        })
    }
}
