/// <reference path="../../typings/mocha/mocha.d.ts" />
/// <reference path="../../typings/assert/assert.d.ts" />
/// <reference path="../../src/modules.d.ts" />

var slp = new API.ShortLinkPrivacy();

describe("API :: ShortLinkPrivacy", () => {
    describe("saveMessage", () => {
        var result: Interfaces.Success<API.IdResponse>,
            message: Messages.ClearType = {
                body: "test",
                timeToLive: 86400
            };

        before((done) => {
            slp.saveMessage(message, (r) => {
                result = r;
                done();
            })
        });

        it("returns success", () => {
            assert.ok(result.success);
        })

        it("returns the id of the message in value", () => {
            assert.ok(typeof result.value.id == "string")
        })
    });


    describe("loadMessage", () => {
        var result: Interfaces.Success<Messages.ArmorType>,
            message: Messages.ArmorType,
            id: Messages.Id;

        describe("current message", () => {
            before((done) => {
                slp.saveMessage({ body: "test1", timeToLive: 86400 }, (r) => {
                    id = r.value.id;
                    slp.loadMessage( id, (r2) => {
                        result = r2;
                        message = r2.value;
                        done();
                    });
                })
            });

            it("returns success", () => {
                assert.ok(result.success);
            })

            it("returns the right message", () => {
                assert.equal(message.body, "test1")
            })
        })

        describe("expired message", () => {
            before((done) => {
                slp.saveMessage({ body: "test2", timeToLive: -1 }, (r) => {
                    id = r.value.id;
                    slp.loadMessage( id, (r2) => {
                        result = r2;
                        message = r2.value;
                        done();
                    });
                })
            });

            it("returns failure", () => {
                assert.ok(!result.success);
            })

        })
    })
})

