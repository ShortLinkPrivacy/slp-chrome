
#############################################################

bg = chrome.extension.getBackgroundPage()
pks = bg.store.privateKey
secret = TestKeys.secret

#############################################################

describe "PrivateKeyStore :: LocalStore", ->
    before (done)->
        pks.store.clear()
        done()

    #--------------------------------------------------------
    describe 'Prerequisites', ->

        it 'has a private key', ->
            expect(secret).to.be.a Keys.PrivateKey


    #--------------------------------------------------------
    describe 'set', ->
        beforeEach (done)->
            pks.store.clear()
            done()

        it 'saves a private key armored text', (done)->
            pks.set secret.armored(), ->
                expect(true).to.be.ok()
                done()

        it 'saves a private key object', (done)->
            pks.set secret, ->
                expect(true).to.be.ok()
                done()

        it 'throws when the armored text is corrupted', (done)->
            fn = -> pks.set "alabama"
            expect(fn).to.throwException (e)->
                done()

        it 'throws when the armored text is missing', (done)->
            fn = -> pks.set ""
            expect(fn).to.throwException (e)->
                done()

    #--------------------------------------------------------
    describe 'get', ->
        key = null

        beforeEach (done)->
            pks.store.clear ->
                pks.set secret, ->
                    pks.get (k)->
                        key = k
                        done()

        it 'retrieves a correct key', ->
            expect(key.armored()).to.be secret.armored()

        it 'if the key is missing, returns undefined', (done)->
            pks.store.clear ->
                pks.get (k)->
                    expect(k).to.be(undefined)
                    done()

    #--------------------------------------------------------
    describe 'remove', ->
        beforeEach (done)->
            pks.store.clear ->
                pks.set secret, ->
                    done()

        it 'deletes the key', (done)->
            pks.remove ->
                pks.get (k)->
                    expect(k).to.be(undefined)
                    done()


