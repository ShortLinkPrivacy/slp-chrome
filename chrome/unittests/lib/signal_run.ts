/// <reference path="../../typings/mocha/mocha.d.ts" />

var hasRun = false;
window.addEventListener("message", (e) => {
  if ( e.data == "slp_done_decoding" && !hasRun ) {
    mocha.run();
    hasRun = true;
  }
})
