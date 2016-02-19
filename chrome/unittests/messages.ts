/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/assert/assert.d.ts" />
/// <reference path="../typings/expect/expect.d.ts" />
/// <reference path="../typings/moment/moment.d.ts" />
/// <reference path="../src/modules.d.ts" />

var config = new Config();
var store = new MessageStore.RemoteService(config);

var today = moment(),
    tomorrow = moment().add(1, 'days'),
    yesterday = moment().subtract(1, 'days');

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
                expiration: tomorrow.toDate()
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
                saveMessage({ body: "test1", expiration: tomorrow.toDate() }, (r) => {
                    id = r.value;
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
                saveMessage({ body: "test2", expiration: yesterday.toDate() }, (r) => {
                    id = r.value;
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

