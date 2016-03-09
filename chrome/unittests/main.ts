/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/assert/assert.d.ts" />
/// <reference path="../typings/chrome/chrome.d.ts" />
/// <reference path="../src/modules.d.ts" />
/// <reference path="lib/testkeys.ts" />


declare function escape(i: string): string;

var baseUrl = "http://localhost:8000/unittests";

var bg: Interfaces.BackgroundPage = <Interfaces.BackgroundPage>chrome.extension.getBackgroundPage();

var alice = TestKeys.alice,
    bob = TestKeys.bob,
    charlie = TestKeys.charlie,
    stefan = TestKeys.stefan,
    secret = TestKeys.secret;

bg.privateKey = TestKeys.secret;
bg.privateKey.decrypt("asdfasdfasdf");

describe("Content and Background", ()=> {

    describe("Simple message", () => {
        var tab: chrome.tabs.Tab,
            m: Messages.UrlType;

        var message = { body: "test" };

        before((done) => {
            bg.encryptMessage(message,[alice.key], (res) => {
                m = res.value;
                var json = { url: m.body };
                chrome.tabs.create({url: baseUrl + "/content_message/index.html?" + escape(JSON.stringify(json))}, (t) => {
                    tab = t;
                    done();
                })
            });
        })

        it("opens a tab with tests", () => {
            assert.ok(tab);
        });

        it("creates an encrypted message", () => {
            assert.ok(m);
        })

        it("returns an SLP url in the message", () => {
            assert.ok(m.body.match(/slp\.li/));
        })
    })

    describe("Public key", () => {
        var tab: chrome.tabs.Tab,
            p: Messages.UrlType;

        var message = { body: "test" };

        before((done) => {
            bg.encryptPublicKey((res) => {
                p = res.value;
                var json = { url: p.body };
                chrome.tabs.create({url: baseUrl + "/content_keys/index.html?" + escape(JSON.stringify(json))}, (t) => {
                    tab = t;
                    done();
                })
            });
        })

        it("opens a tab with tests", () => {
            assert.ok(tab);
        });

        it("creates an encrypted message with a public key", () => {
            assert.ok(p);
        })

        it("returns an SLP url in the message", () => {
            assert.ok(p.body.match(/slp\.li/));
        })
    })

})

