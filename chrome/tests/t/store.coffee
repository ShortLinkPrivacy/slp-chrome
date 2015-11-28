#############################################################

GLOBAL.openpgp = require("openpgp")

KeyStore  = require("../compiled/keystore.js").KeyStore
Keys      = require("../compiled/keystore.js").Keys
Chrome    = require('../lib/chrome.js').Chrome

assert  = require 'assert'
fs      = require "fs"

#############################################################

localStorage = new Chrome()

# Create a store to test on
keyStore = new KeyStore.LocalStore
    keyStore:
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

#############################################################

describe "Key Storage", ->
    describe 'Prerequisits', ->
        it 'has a store object', ->
            assert keyStore

        it 'has a key for Alice', ->
            assert alice.armored()

        it 'has a key for Bob', ->
            assert bob.armored()

        it 'has a key for Charlie', ->
            assert charlie.armored()

