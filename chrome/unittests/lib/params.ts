declare function unescape(s: string): string;

function params() {
    var s = location.search.replace(/^\?/, ""),
        json = JSON.parse(unescape(s)),
        els = document.getElementsByClassName("test"),
        re = /\{(\w+)\}/g,
        i: number;

    for ( i = 0; i < els.length; i++ ) {
        els[i].innerHTML = els[i].innerHTML.replace(re, (v) => {
            var k = v.replace(/(\{|\})/g, "");
            return json[k];
        });
    }
}

params();
