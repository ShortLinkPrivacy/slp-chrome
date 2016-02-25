/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/assert/assert.d.ts" />
/// <reference path="../typings/chrome/chrome.d.ts" />
/// <reference path="../src/modules.d.ts" />
/// <reference path="lib/testkeys.ts" />

var bg: Interfaces.BackgroundPage = <Interfaces.BackgroundPage>chrome.extension.getBackgroundPage();
var secret = TestKeys.secret;
bg.privateKey = secret;

describe("Background Page", () => {
    var msg: Messages.ClearType = { body: "test1" },
        result: Interfaces.Success & { value?: string };

    describe("encryptMessage", () => {
        before((done) => {
            bg.encryptMessage(msg, [TestKeys.alice.key], (r) => {
                result = r;
                console.log(r);
                done();
            })
        })

        it("returns success", () => {
            assert.ok(result.success);
        })

        it("returns the url in value", () => {
            assert.ok(result.value.match(/slp/))
        })
    });


    describe("encryptPublicKey", () => {
        before((done) => {
            bg.encryptPublicKey((r) => {
                result = r;
                done();
            });
        })

        it("results success", () => {
            assert.ok(result.success)
        })

        it("returns the url of the pub key", () => {
            assert.ok(result.value.match(/slp/))
        })
    })

});
