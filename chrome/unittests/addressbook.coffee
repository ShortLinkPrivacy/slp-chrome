
#############################################################

AddressBookStore.IndexedDB.dbName = "Test"
addressBook = new AddressBookStore.IndexedDB()

alice = TestKeys.alice
bob = TestKeys.bob
charlie = TestKeys.charlie
stefan = TestKeys.stefan

#############################################################

describe "Key Storage :: LocalStore", ->
    before (done)->
        addressBook.deleteAll ->
            addressBook.search 'ifnx', (result)->
                expect(result).to.have.length 0
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
                        addressBook.save stefan, ->
                            done()

        it 'finds all by domain', (done)->
            addressBook.search 'ifnx', (result)->
                expect(result).to.have.length 4
                done()

        it 'filters by name', (done)->
            addressBook.search 'alice', (result)->
                expect(result).to.have.length 1
                done()

        it 'finds other userIds', (done)->
            addressBook.search 'stefanguen', (result)->
                expect(result).to.have.length 1
                done()
