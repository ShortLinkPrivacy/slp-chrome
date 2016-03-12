/// <reference path="../../typings/mocha/mocha.d.ts" />
/// <reference path="../../typings/assert/assert.d.ts" />

var hasRun = false;

describe("Expired Messages", () => {
  it("Shows expired message", () => {
    assert.ok(document.getElementById('m1').innerText.match(/expired/i));
  })
})

describe("Message to expire in 1 second", () => {

    it("shows the clear text in the beginning", () => {
        assert.equal(document.getElementById('m2').innerText, "test");
    });

    it("expires in 1 second", (done) => {
        setTimeout(() => {
            assert.ok(document.getElementById('m2').innerText.match(/expired/i));
            done();
        }, 1200);
    })
})
