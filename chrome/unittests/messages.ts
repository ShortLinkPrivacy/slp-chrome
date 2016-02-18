/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/assert/assert.d.ts" />
/// <reference path="../typings/moment/moment.d.ts" />
/// <reference path="../src/modules.d.ts" />

var config = new Config();
var store = new MessageStore.RemoteService(config);

var today = moment(),
    tomorrow = today.add('days', 1),
    yesterday = today.subtract('days', 1);


describe("save", () => {
    var result: Interfaces.Success & { value?: Messages.Id },
        message: Messages.ClearType = {
            body: "test",
            expiration: tomorrow.toDate()
        };

    before((done) => {
        store.save(message, (r) => {
            result = r;
            done();
        })
    });

    it("returns success", () => {
        assert.ok(result.success);
    })
})
