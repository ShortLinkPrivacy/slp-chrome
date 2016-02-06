
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

})
