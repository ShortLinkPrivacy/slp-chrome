var hasRun = false;
window.addEventListener("message", (e) => {
  if ( e.data == "slp_done_decoding" && !hasRun ) {
    mocha.run();
    hasRun = true;
  }
})
