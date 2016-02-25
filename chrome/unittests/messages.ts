/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/assert/assert.d.ts" />
/// <reference path="../src/modules.d.ts" />

var store = new MessageStore.RemoteService();

function saveMessage(msg: Messages.ClearType, callback: MessageStore.IdCallback) {
    console.log("Saving: ", msg);
    store.save(msg, (result) => {
        callback(result);
    });
}

describe("Messages :: RemoteService", () => {
    describe("save", () => {
        var result: Interfaces.Success & { value?: Messages.Id },
            message: Messages.ClearType = {
                body: "test",
                timeToLive: 86400
            };

        before((done) => {
            saveMessage(message, (r) => {
                result = r;
                done();
            })
        });

        it("returns success", () => {
            assert.ok(result.success);
        })

        it("returns the id of the message in value", () => {
            assert.ok(typeof result.value == "string")
        })
    });


    describe("load", () => {
        var result: Interfaces.Success & { value?: Messages.Armored },
            message: Messages.Armored,
            id: Messages.Id;

        describe("current message", () => {
            before((done) => {
                saveMessage({ body: "test1", timeToLive: 86400 }, (r) => {
                    id = r.value.id;
                    store.load( id, (r2) => {
                        result = r2;
                        message = r2.value;
                        done();
                    });
                })
            });

            it("returns success", () => {
                assert.ok(result.success);
            })

            it("returns the right object in value", () => {
                assert.ok(message instanceof Messages.Armored)
            })

            it("returns the right message", () => {
                assert.equal(message.body(), "test1")
            })
        })

        describe("expired message", () => {
            before((done) => {
                saveMessage({ body: "test2", timeToLive: -1 }, (r) => {
                    id = r.value.id;
                    store.load( id, (r2) => {
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

