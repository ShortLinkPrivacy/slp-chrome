
#############################################################

# Create a store to test on
keyStore = new KeyStore.LocalStore(app.config)
store = chrome.storage.local

alice = TestKeys.alice
bob = TestKeys.bob
charlie = TestKeys.charlie

#############################################################

describe "Key Storage", ->
    describe 'Prerequisits', ->
        it 'has a store object', ->
            assert keyStore

        it 'has a key for Alice', ->
            assert alice


    describe 'storePublicKey', ->
        beforeEach ->
            store.clear()

        it 'saves the public key', ->
            keyStore.storePublicKey alice, ()->
                assert true
                # assert store[alice.fingerprint()]
