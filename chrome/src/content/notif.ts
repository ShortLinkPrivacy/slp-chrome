
module Notif {
    function box(message: string, timeout?: number): void {
        var popup: HTMLElement;

        if ( typeof timeout == "undefined" ) timeout = 15000;

        popup = document.createElement('div');
        popup.style.width = "100%";
        popup.style.height = "50px";
        popup.style.backgroundColor = "#AB1C1C";
        popup.style.color = "#fff";
        popup.style.position = "absolute";
        popup.style.top = "0px";
        popup.style.left = "0px";
        popup.style.textAlign = "center";
        popup.style.lineHeight = "50px";
        popup.style.fontWeight = "bold";
        popup.style.cursor = "pointer";

        popup.innerHTML = message;
        popup.addEventListener('click', (e) => {
            e.stopPropagation();
            popup.remove();
        });

        if ( typeof timeout != "undefined" && timeout > 0 ) {
            setTimeout(() => { popup.remove() }, timeout);
        }

        document.body.appendChild(popup);
    }
}
