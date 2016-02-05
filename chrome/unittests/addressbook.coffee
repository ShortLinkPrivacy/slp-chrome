
#############################################################

config = new Config()
addressBook = new AddressBookStore.IndexedDB(config)

alice = TestKeys.alice
bob = TestKeys.bob
charlie = TestKeys.charlie

#############################################################

describe "Key Storage :: LocalStore", ->
    before (done)->
        addressBook.deleteAll ->
            done()

    #--------------------------------------------------------
    describe 'storePublicKey', ->
        it 'stores the key in storage', (done)->
            addressBook.save alice, ()->
                expect(true).to.be.ok()
                done()

    #--------------------------------------------------------
    describe 'loadPublicKey', ->
        key = null

        before (done)->
            addressBook.save alice, ->
                addressBook.load [alice.fingerprint()], (arr)->
                    key = arr[0]
                    done()

        it 'loads the right public key', ->
            expect(key.fingerprint()).to.be(alice.fingerprint())

    #--------------------------------------------------------
    describe 'searchPublicKey', ->
        before (done)->
            addressBook.save alice, ->
                addressBook.save bob, ->
                    addressBook.save charlie, ->
                        done()

        it 'finds all by domain', (done)->
            addressBook.search 'ifnx', (result)->
                expect(result).to.have.length 3
                done()

        it 'filters by name', (done)->
            addressBook.search 'alice', (result)->
                expect(result).to.have.length 1
                done()

