
#############################################################

# Create a store to test on
keyStore = new KeyStore.LocalStore(app.config)

alice = TestKeys.alice
bob = TestKeys.bob
charlie = TestKeys.charlie

#############################################################

describe "Key Storage :: LocalStore", ->
    before (done)->
        keyStore.config.store.clear()
        done()

    #--------------------------------------------------------
    describe 'Prerequisits', ->
        it 'has a store object', ->
            expect(keyStore).to.be.a KeyStore.LocalStore

        it 'has a key for Alice', ->
            expect(alice).to.be.a Keys.PublicKey

    #--------------------------------------------------------
    describe 'storePublicKey', ->
        it 'stores the key in storage', (done)->
            keyStore.storePublicKey alice, ()->
                expect(true).to.be.ok()
                done()

    #--------------------------------------------------------
    describe 'loadPublicKey', ->
        key = null

        before (done)->
            keyStore.storePublicKey alice, ->
                keyStore.loadPublicKey alice.fingerprint(), (k)->
                    key = k
                    done()

        it 'loads a PublicKey object', ->
            expect(key).to.be.a(Keys.PublicKey)

        it 'loads the right public key', ->
            expect(key.fingerprint()).to.be(alice.fingerprint())

    #--------------------------------------------------------
    describe 'searchPublicKey', ->
        before (done)->
            keyStore.storePublicKey alice, ->
                keyStore.storePublicKey bob, ->
                    keyStore.storePublicKey charlie, ->
                        done()

        it 'finds all by domain', (done)->
            keyStore.searchPublicKey 'ifnx', (result)->
                expect(result).to.have.length 3
                done()

        it 'filters by name', (done)->
            keyStore.searchPublicKey 'alice', (result)->
                expect(result).to.have.length 1
                done()

        it 'returns an array of PublicKeys', (done)->
            keyStore.searchPublicKey 'bob', (result)->
                expect(result[0]).to.be.a Keys.PublicKey
                done()

    #--------------------------------------------------------
    describe 'initialize', ->
        before (done)->
            keyStore.storePublicKey alice, ->
                keyStore.storePublicKey bob, ->
                    keyStore.storePublicKey charlie, ->
                        done()

        it 'loads the directory', (done)->
            ks = new KeyStore.LocalStore(app.config)
            ks.initialize ->
                ks.searchPublicKey 'ifnx', (result)->
                    expect(result).to.have.length 3
                    done()


    #--------------------------------------------------------
    describe 'deleteAllPublicKeys', ->
        it 'deletes all', (done)->
            keyStore.deleteAllPublicKeys ->
                keyStore.searchPublicKey 'ifnx', (result)->
                    expect(result).to.have.length 0
                    done()

