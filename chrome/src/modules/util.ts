module Util {
    export function isOSX(): boolean {
        return window.navigator.platform.match(/mac/i) != null;
    }

    export function isFacebook(): boolean {
        return window.location.host.match(/facebook\.com$/) != null;
    }

    export function isHangouts(): boolean {
        return window.location.host.match(/hangouts\.google\.com$/) != null;
    }
}
