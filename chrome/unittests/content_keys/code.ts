/// <reference path="../../typings/mocha/mocha.d.ts" />
/// <reference path="../../typings/assert/assert.d.ts" />

var hasRun = false;

describe("Public keys", () => {
  it("Adds the public key class", () => {
    assert.ok(document.getElementById('pk1').innerHTML.match(/_pk/i));
  })
})
