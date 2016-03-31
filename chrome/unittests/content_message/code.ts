/// <reference path="../../typings/tsd.d.ts" />

var hasRun = false;

function str(id: string): string {
    return document.getElementById(id).innerText.replace(/(\t|\n)/, ' ').trim();
}

describe("Simple paragraph", () => {
  it("Converts to text", () => {
    assert.equal(str('p1'), "test");
  })
  it("Creates a magic element", () => {
    assert.ok(document.getElementById('p1').innerHTML.match(/\<span/i));
  })
})

describe("Link with other text", () => {
  it("Preserves the text to the right", () => {
    assert.equal(str('p2'), 'test two');
  })

  it("Preserves the text to the left", () => {
    assert.equal(str('p3'), 'one test');
  })

  it("Preserves the text on both sides", () => {
    assert.equal(str('p4'), 'one test two');
  })
})

describe("Multiple links in the same element", () => {
  it("Decodes links next to one another", () => {
    assert.equal(str('p5'), 'test test');
  })
  it("Decodes links separated by a symbol", () => {
    assert.equal(str('p6'), 'test|test');
  })
})

describe("Connected text", () => {
  it("Preserves the text to the left", () => {
    assert.equal(str('c1'), 'fronttest');
  })
  it("Preserves the text to the right", () => {
    assert.equal(str('c2'), 'testzzz');
  })
})

describe("404", () => {
  it("Shows an error", () => {
    assert.equal(str('e1'), 'Expired private message');
  })
  it("Shows an error with connected text", () => {
    assert.equal(str('e2'), 'Expired private messagezzz');
  })
})

describe("Links", () => {
  it("Decodes regular links", () => {
    assert.equal(str('l1'), 'test');
  })
  it("Removes the href from the A tags", () => {
    assert.ok(!document.getElementById('l1').innerHTML.match(/href/i));
  })
  it("Decodes shortened links", () => {
    assert.equal(str('l2'), 'test');
  })
  it("Decodes distroyed links", () => {
    assert.equal(str('l3'), 'test');
  })
  it("Decodes links in data-expanded-url", () => {
    assert.equal(str('l4'), 'test');
  })
  it("Decodes links back to back", () => {
    assert.equal(str('l5'), 'testtest');
  })
  it("Decodes link and text back to back", () => {
    assert.equal(str('l6'), 'testtwo');
  })
})

describe("Editable links", () => {
  it("Does not decode level 1", () => {
    assert.ok(document.getElementById('el1').innerText.match(/slp/));
  })
  it("Preserves the A tag at level 1", () => {
    assert.ok(document.getElementById('el1').innerHTML.match(/\<a/i));
  })
})
