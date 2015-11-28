
#############################################################

store  = window.fakeLocal

# Create a store to test on
keyStore = new KeyStore.LocalStore(app.config)

alice = TestKeys.alice
bob = TestKeys.bob
charlie = TestKeys.charlie

console.log store
console.log app.storage

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
                # assert store[alice.fingerprint()]
