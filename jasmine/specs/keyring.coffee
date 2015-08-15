config = new window.Config
    keyringTag: 'keyring_test'

keyring = key = null

################################################################
# Key
################################################################
#
describe "A key", ->

    beforeAll ->
        key = new window.Key(config)

    it "can be created", (done)->

        key.create("tester", "tester@example.com", "alabama123")
           .then ()->
                expect(key.publicKeyArmored).toBeDefined()
                expect(key.privateKeyArmored).toBeDefined()
                done()

    it "has a title", ->
        expect(key.title).toBeDefined()

    it "turns into JSON", ->
        expect(key.toJSON().id).toBe("tester")

################################################################
# Keyring
################################################################
#
describe "A keyring", ->
    
    beforeAll ()->
        keyring = new window.KeyRing(config)
        keyring.purge()

    it "is empty in the begining", ->
        expect(keyring.length()).toBe(0)

    it "can add keys", ->
        keyring.add(key)
        expect(keyring.length()).toBe(1)

    it "can save", ->
        keyring.save()
        expect(localStorage.getItem(config.keyringTag)).toBeDefined()

    it "can load", ->
        kr = new window.KeyRing(config)
        expect(kr.length()).toBe(1)
        expect(kr.at(0).toJSON().id).toBe(key.toJSON().id)
