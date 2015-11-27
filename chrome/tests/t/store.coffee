Store = require("../lib/store.js").Store
Keys = require("../lib/store.js").Keys
Chrome = require('../local/chrome.js').Chrome
localStorage = new Chrome()
assert  = require 'assert'
fs = require "fs"

aliceArmor = fs.readFileSync("keys/alice.pub", "utf8")
bobArmor = fs.readFileSync("keys/bob.pub", "utf8")
charlieArmor = fs.readFileSync("keys/charlie.pub", "utf8")

describe "Key files", ->
    it "loaded", ->
        assert aliceArmor
        assert bobArmor
        assert charlieArmor


describe "Store module", ->
    it "loaded", ->
        assert Store
        assert Keys

