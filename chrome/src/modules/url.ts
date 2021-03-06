class MagicURL {
    //static domain = "https?://slp.li";
    static domain = "http://slp:5000";
    static anyPath = "m|k";
    static messagePath = "m";
    static keyPath = "k";
    static id = "[0-9,a-f]{24}";

    path: string;
    id: string;

    constructor(url: string) {
        var m = url.match(MagicURL.anyRegExp());
        if ( !m ) throw "no_match";
        
        this.path = m[1];
        this.id = m[2];
    }

    private static genericRe(path: string, flags?: string): RegExp {
        // Trap the path in ()s so it becomes a capture
        return new RegExp(MagicURL.domain + "/(" + path + ")/(" + MagicURL.id + ")", flags);
    }

    static anyRegExp(flags?: string): RegExp {
        return MagicURL.genericRe(MagicURL.anyPath, flags);
    }

    static messageRegExp(flags?: string): RegExp {
        return MagicURL.genericRe(MagicURL.messagePath, flags);
    }

    static keyRegExp(flags?: string): RegExp {
        return MagicURL.genericRe(MagicURL.keyPath, flags);
    }

    private static _url(path: string, id?: string): string {
        var url = MagicURL.domain + "/" + path;
        if ( id ) url += "/" + id;
        return url;
    }

    static messageUrl(id?: string): string {
        return MagicURL._url(MagicURL.messagePath, id);
    }

    static keyUrl(id?: string): string {
        return MagicURL._url(MagicURL.keyPath, id);
    }

    isMessage(): boolean {
        return this.path == MagicURL.messagePath;
    }

    isKey(): boolean {
        return this.path == MagicURL.keyPath;
    }
}
