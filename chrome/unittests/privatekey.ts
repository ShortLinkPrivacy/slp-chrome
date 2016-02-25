/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/assert/assert.d.ts" />
/// <reference path="../src/modules.d.ts" />

declare var TestKeys: {
    alice: Keys.PublicKey;
    bob: Keys.PublicKey;
    charlie: Keys.PublicKey;
    stefan: Keys.PublicKey;
    secret: Keys.PrivateKey;
}

var bg = <Interfaces.BackgroundPage>chrome.extension.getBackgroundPage();
var pks = bg.store.privateKey;
var secret = TestKeys.secret;

describe("PrivateKeyStore :: LocalStore", function() {
    before(function(done) {
        pks.remove(done);
    });

    describe('Prerequisites', function() {
        it('has a private key', function() {
            assert.ok(secret instanceof Keys.PrivateKey);
        });
    });

    describe('set', function() {
        beforeEach(function(done) {
            pks.remove(done);
        });

        it('saves a private key armored text', function(done) {
            pks.set(secret.armored(), function() {
                assert(true);
                done();
            });
        });

        it('saves a private key object', function(done) {
            pks.set(secret, function() {
                assert(true);
                done();
            });
        });

        it('throws when the armored text is corrupted', function(done) {
            var fn = function() { pks.set("alabama", () => {}) };
            assert.throws(fn, done);
        });

        it('throws when the armored text is missing', function(done) {
            var fn = function() { pks.set("", () => {}) };
            assert.throws(fn, done);
        });
    });

    describe('get', function() {
        var key;
        beforeEach(function(done) {
            pks.remove(function() {
                pks.set(secret, function() {
                    pks.get(function(k) {
                        key = k;
                        done();
                    });
                });
            });
        });

        it('retrieves a correct key', function() {
            assert.equal(key.armored(), secret.armored());
        });

        it('if the key is missing, returns undefined', function(done) {
            pks.remove(function() {
                pks.get(function(k) {
                    assert.equal(k, void 0);
                    done();
                });
            });
        });
    });

    describe('remove', function() {
        beforeEach(function(done) {
            pks.remove(function() {
                pks.set(secret, done);
            });
        });

        it('deletes the key', function(done) {
            pks.remove(function() {
                pks.get(function(k) {
                    assert(k, void 0);
                    done();
                });
            });
        });
    });
});
