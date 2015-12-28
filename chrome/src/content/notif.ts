
module Notif {
    enum BoxType { Info, Success, Warning, Error };
    function box(boxType: BoxType, message: string, timeout?: number): void {
        var popup: HTMLElement;

        if ( typeof timeout == "undefined" ) timeout = 15000;

        popup = document.createElement('div');
        popup.style.width = "100%";
        popup.style.height = "50px";
        popup.style.position = "absolute";
        popup.style.top = "0px";
        popup.style.left = "0px";
        popup.style.textAlign = "center";
        popup.style.lineHeight = "50px";
        popup.style.fontWeight = "bold";
        popup.style.cursor = "pointer";

        if ( boxType == BoxType.Info ) {
            popup.style.backgroundColor = "#BDE5F8";
            popup.style.color = "#00529B";
        } else if ( boxType == BoxType.Success ) {
            popup.style.backgroundColor = "#DFF2BF";
            popup.style.color = "#4F8A10";
        } else if ( boxType == BoxType.Warning ) {
            popup.style.backgroundColor = "#FEEFB3";
            popup.style.color = "#9F6000";
        } else if ( boxType = BoxType.Error ) {
            popup.style.backgroundColor = "#FFBABA";
            popup.style.color = "#D8000C";
        }

        popup.innerHTML = message;
        popup.addEventListener('click', (e) => {
            e.stopPropagation();
            popup.remove();
        });

        if ( timeout > 0 ) {
            setTimeout(() => { popup.remove() }, timeout);
        }

        document.body.appendChild(popup);
    }

    export function info (message: string, timeout?: number): void {
        box(BoxType.Info, message, timeout);
    }

    export function success(message: string, timeout?: number): void {
        box(BoxType.Success, message, timeout);
    }

    export function warning(message: string, timeout?: number): void {
        box(BoxType.Warning, message, timeout);
    }

    export function error(message: string, timeout?: number): void {
        box(BoxType.Error, message, timeout);
    }


}
