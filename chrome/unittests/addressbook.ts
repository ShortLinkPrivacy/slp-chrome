/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/assert/assert.d.ts" />
/// <reference path="../src/modules.d.ts" />
/// <reference path="lib/testkeys.ts" />

AddressBookStore.IndexedDB.dbName = "Test";

var addressBook = new AddressBookStore.IndexedDB();

var alice = TestKeys.alice,
    bob = TestKeys.bob,
    charlie = TestKeys.charlie,
    stefan = TestKeys.stefan;

describe("Key Storage :: LocalStore", function() {

    before(function(done) {
        addressBook.deleteAll(function() {
            addressBook.search('ifnx', function(result) {
                assert.equal(result.length, 0);
                done();
            });
        });
    });

    describe('save', function() {
        it('stores the key in storage', function(done) {
            addressBook.save(alice, function() {
                assert(true);
                done();
            });
        });
    });

    describe('load', function() {
        var key;
        before(function(done) {
            addressBook.save(alice, function() {
                addressBook.load([alice.fingerprint()], function(arr) {
                    key = arr[0];
                    done();
                });
            });
        });

        it('loads the right public key', function() {
            assert.equal(key.fingerprint(), alice.fingerprint());
        });

        it('does not load non-existing keys', (done) => {
            addressBook.load(["boza", "halva", alice.fingerprint()], (arr) => {
                assert.equal(arr.length, 1);
                done();
            })
        })

    });

    describe('search', function() {
        before(function(done) {
            addressBook.save(alice, function() {
                addressBook.save(bob, function() {
                    addressBook.save(charlie, function() {
                        addressBook.save(stefan, () => {
                            done();
                        });
                    });
                });
            });
        });

        it('finds all by domain', function(done) {
            addressBook.search('ifnx', function(result) {
                assert.equal(result.length, 4);
                done();
            });
        });

        it('filters by name', function(done) {
            addressBook.search('alice', function(result) {
                assert.equal(result.length, 1);
                done();
            });
        });

        it('finds other userIds', function(done) {
            addressBook.search('stefanguen', function(result) {
                assert.equal(result.length, 1);
                done();
            });
        });

    });
});
