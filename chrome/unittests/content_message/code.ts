/// <reference path="../../typings/mocha/mocha.d.ts" />
/// <reference path="../../typings/assert/assert.d.ts" />

var hasRun = false;

describe("Simple paragraph", () => {
  it("Converts to text", () => {
    assert.equal(document.getElementById('p1').innerText, "test");
  })
  it("Creates a magic element", () => {
    assert.ok(document.getElementById('p1').innerHTML.match(/\<span/i));
  })
})

describe("Link with other text", () => {
  it("Preserves the text to the right", () => {
    assert.equal(document.getElementById('p2').innerText, 'test two');
  })

  it("Preserves the text to the left", () => {
    assert.equal(document.getElementById('p3').innerText, 'one test');
  })

  it("Preserves the text on both sides", () => {
    assert.equal(document.getElementById('p4').innerText, 'one test two');
  })
})

describe("Multiple links in the same element", () => {
  it("Decodes links next to one another", () => {
    assert.equal(document.getElementById('p5').innerText, 'test test');
  })
  it("Decodes links separated by a symbol", () => {
    assert.equal(document.getElementById('p6').innerText, 'test|test');
  })
})

describe("Connected text", () => {
  it("Preserves the text to the left", () => {
    assert.equal(document.getElementById('c1').innerText, 'fronttest');
  })
  it("Preserves the text to the right", () => {
    assert.equal(document.getElementById('c2').innerText, 'testzzz');
  })
})

describe("404", () => {
  it("Shows an error", () => {
    assert.equal(document.getElementById('e1').innerText, 'Expired private message');
  })
  it("Shows an error with connected text", () => {
    assert.equal(document.getElementById('e2').innerText, 'Expired private messagezzz');
  })
})

describe("Links", () => {
  it("Decodes regular links", () => {
    assert.equal(document.getElementById('l1').innerText, 'test');
  })
  it("Removes the href from the A tags", () => {
    assert.ok(!document.getElementById('l1').innerHTML.match(/href/i));
  })
  it("Decodes shortened links", () => {
    assert.equal(document.getElementById('l2').innerText, 'test');
  })
  it("Decodes distroyed links", () => {
    assert.equal(document.getElementById('l3').innerText, 'test');
  })
  it("Decodes links in data-expanded-url", () => {
    assert.equal(document.getElementById('l4').innerText, 'test');
  })
  it("Decodes links back to back", () => {
    assert.equal(document.getElementById('l5').innerText, 'testtest');
  })
  it("Decodes link and text back to back", () => {
    assert.equal(document.getElementById('l6').innerText, 'testtwo');
  })
})

describe("Editable links", () => {
  it("Does not decode level 1", () => {
    assert.ok(document.getElementById('el1').innerText.match(/slp\.li/));
  })
  it("Preserves the A tag at level 1", () => {
    assert.ok(document.getElementById('el1').innerHTML.match(/\<a/i));
  })
})

window.addEventListener("message", (e) => {
  if ( e.data == "slp_done_decoding" && !hasRun ) {
    mocha.run();
    hasRun = true;
  }
})


