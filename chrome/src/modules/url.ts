class MagicURL {
    static domain = "https?://slp.li";
    static anyPath = "m|k";
    static messagePath = "m";
    static keyPath = "k";
    static id = "[0-9,a-f]+";

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

    static keyRegExp(flags) {
        return MagicURL.genericRe(MagicURL.keyPath, flags);
    }

    isMessage(): boolean {
        return this.path == MagicURL.messagePath;
    }

    isKey(): boolean {
        return this.path == MagicURL.keyPath;
    }
}
