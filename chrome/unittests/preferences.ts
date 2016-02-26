/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/assert/assert.d.ts" />
/// <reference path="../typings/chrome/chrome.d.ts" />
/// <reference path="../src/modules.d.ts" />
/// <reference path="lib/testkeys.ts" />

describe("Preferences", () => {
    Preferences.label = 'prefs_test';
    var prefs;

    before((done) => {
        prefs = new Preferences(() => {
            done()
        })
    })

    it("initialized preferences", () => {
        assert.ok(prefs)
    })

    it("has a store attribute", () => {
        assert.ok(prefs.store)
    })

    it("does not overwrite the inherited store attribute", () => {
        assert.ok(prefs.store.get)
    })

    it("can set attributes", (done) => {
        prefs.publicKeyUrl = 'abc';
        prefs.save((json) => {
            assert.equal(json.publicKeyUrl, prefs.publicKeyUrl);
            done();
        })
    })
});

