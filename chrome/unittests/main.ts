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

var tab: chrome.tabs.Tab;

var message: Messages.UrlType;

bg.privateKey = TestKeys.secret;
bg.privateKey.decrypt("asdfasdfasdf");

describe("Main", ()=> {


    describe("Simple message", () => {
        tab = null;
        message = null;

        before((done) => {
            makeMessage({ body: "test" }, "/content_message/index.html", done);
        })

        saneLink();
    })

    describe("Public key", () => {
        message = null;
        tab = null;

        before((done) => {
            bg.encryptPublicKey((res) => {
                message = res.value;
                var json = { url: message.body };
                chrome.tabs.create({url: baseUrl + "/content_keys/index.html?" + escape(JSON.stringify(json))}, (t) => {
                    tab = t;
                    done();
                })
            });
        })

        saneLink();
    })


    describe("Expired messages", () => {
        var message2: Messages.UrlType,
            json: { url0: string; url1: string };

        tab = null;
        message = null;

        before((done) => {
            bg.encryptMessage( { body: "test", timeToLive: 1 }, [alice.key], (res) => {
                message2 = res.value;
                bg.encryptMessage( { body: "test", timeToLive: -1 }, [alice.key], (res) => {
                    message = res.value;
                    json = { url0: message.body, url1: message2.body };
                    chrome.tabs.create({ url: baseUrl + "/content_expire/index.html?" + escape(JSON.stringify(json)) }, (t) => {
                        tab = t;
                        done();
                    })
                });
            })
        })

        saneLink();

    })

})


//---------------------------------------------------------------------------------------

function makeMessage(msg: Messages.ClearType, url: string, done: any): void {
    bg.encryptMessage(msg, [alice.key], (res) => {
        assert.ok(res.success);
        message = res.value;
        var json = { url: message.body };
        chrome.tabs.create({ url: baseUrl + "/" + url + "?" + escape(JSON.stringify(json)) }, (t) => {
            tab = t;
            done();
        })
    });
}

function saneLink() {
    it("opens a tab with tests", () => {
        assert.ok(tab);
    });

    it("creates an encrypted message", () => {
        assert.ok(message);
    })

    it("returns an SLP url in the message", () => {
        assert.ok(message.body.match(/slp/));
    })
}
