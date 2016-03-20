class MagicUrl {
    static reStr = "https?://slp.li/(\d)/([0-9,a-f]+)";
    static re = new RegExp(MagicUrl.reStr);
    static reG = new RegExp(MagicUrl.reStr, "i");

    path: string;
    id: string;

    constructor(url: text) {
        var m = url.match(MagicUrl.re);
        if ( !m ) throw "no_match";
        
        this.path = m[1];
        this.id = m[2];
    }

    isMessage(): boolean {
        return this.path == "m";
    }

    isKey(): boolean {
        return this.path == "k";
    }
}
