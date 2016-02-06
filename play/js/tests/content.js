
describe("Simple paragraph", () => {
  it("Converts to text", () => {
    expect(document.getElementById('p1').innerText).to.equal("test");
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
