module Util {
    function isOSX(): boolean {
        return window.navigator.platform.match(/mac/i) != null;
    }

    function isFacebook(): boolean {
        return window.location.host.match(/facebook\.com$/) != null;
    }

    function isHangouts(): boolean {
        return window.location.host.match(/hangouts\.google\.com$/) != null;
    }
}
