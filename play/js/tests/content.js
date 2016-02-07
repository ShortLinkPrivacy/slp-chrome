
describe("Simple paragraph", () => {
  it("Converts to text", () => {
    expect(document.getElementById('p1').innerText).to.equal("test");
  })
  it("Creates a magic element", () => {
    expect(document.getElementById('p1').innerHTML).to.match(/\<span/i);
  })
})

describe("Link with other text", () => {
  it("Preserves the text to the right", () => {
    expect(document.getElementById('p2').innerText).to.equal('test two');
  })

  it("Preserves the text to the left", () => {
    expect(document.getElementById('p3').innerText).to.equal('one test');
  })

  it("Preserves the text on both sides", () => {
    expect(document.getElementById('p4').innerText).to.equal('one test two');
  })
})

describe("Multiple links in the same element", () => {
  it("Decodes links next to one another", () => {
    expect(document.getElementById('p5').innerText).to.equal('test test');
  })
  it("Decodes links separated by a symbol", () => {
    expect(document.getElementById('p6').innerText).to.equal('test|test');
  })
})

describe("Connected text", () => {
  it("Preserves the text to the left", () => {
    expect(document.getElementById('c1').innerText).to.equal('fronttest');
  })
  it("Preserves the text to the right", () => {
    expect(document.getElementById('c2').innerText).to.equal('testzzz');
  })
})

describe("404", () => {
  it("Shows an error", () => {
    expect(document.getElementById('e1').innerText).to.equal('Can not decrypt');
  })
  it("Shows an error with connected text", () => {
    expect(document.getElementById('e2').innerText).to.equal('Can not decryptzzz');
  })
})

describe("Links", () => {
  it("Decodes regular links", () => {
    expect(document.getElementById('l1').innerText).to.equal('test');
  })
  it("Removes the href from the A tags", () => {
    expect(document.getElementById('l1').innerHTML).to.not.match(/href/i);
  })
  it("Decodes shortened links", () => {
    expect(document.getElementById('l2').innerText).to.equal('test');
  })
  it("Decodes distroyed links", () => {
    expect(document.getElementById('l3').innerText).to.equal('test');
  })
  it("Decodes links in data-expanded-url", () => {
    expect(document.getElementById('l4').innerText).to.equal('test');
  })
  it("Decodes links back to back", () => {
    expect(document.getElementById('l5').innerText).to.equal('testtest');
  })
  it("Decodes link and text back to back", () => {
    expect(document.getElementById('l6').innerText).to.equal('testtwo');
  })
})

describe("Editable links", () => {
  it("Does not decode level 1", () => {
    expect(document.getElementById('el1').innerText).to.match(/slp\.li/);
  })
  it("Preserves the A tag at level 1", () => {
    expect(document.getElementById('el1').innerHTML).to.match(/\<a/i);
  })
})

describe("Public keys", () => {
  it("Adds the public key class", () => {
    expect(document.getElementById('pk1').innerHTML).to.match(/_pk/i);
  })
})
