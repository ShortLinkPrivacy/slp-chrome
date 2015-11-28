Store  = require("../compiled/store.js").Store
Keys   = require("../compiled/store.js").Keys
Chrome = require('../lib/chrome.js').Chrome

assert  = require 'assert'
fs      = require "fs"

localStorage = new Chrome()

# Create a store to test on
store = new Store.LocalStore
    storage:
        localStore:
            store: localStorage
            directory: 'directory'
            message: 'message'

# Read three armored texts of public keys
aliceArmor   = fs.readFileSync("keys/alice.pub", "utf8")
bobArmor     = fs.readFileSync("keys/bob.pub", "utf8")
charlieArmor = fs.readFileSync("keys/charlie.pub", "utf8")

# Create three public keys
alice   = new Keys.PublicKey(aliceArmor)
bob     = new Keys.PublicKey(bobArmor)
charlie = new Keys.PublicKey(charlieArmor)


describe 'Prerequisits', ->
    it 'has a store object', ->
        assert( store )

    it 'has a key for Alice', ->
        assert( alice instanceof Key.PublicKey )

