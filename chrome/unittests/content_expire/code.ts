/// <reference path="../../typings/mocha/mocha.d.ts" />
/// <reference path="../../typings/assert/assert.d.ts" />

var hasRun = false;

describe("Expired Messages", () => {
  it("Shows expired message", () => {
    assert.ok(document.getElementById('m1').innerHTML.match(/expired/i));
  })
})

window.addEventListener("message", (e) => {
  if ( e.data == "slp_done_decoding" && !hasRun ) {
    mocha.run();
    hasRun = true;
  }
})
