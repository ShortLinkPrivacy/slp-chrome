
#############################################################

settings = new Settings.LocalStore(app.config)

#############################################################

describe "Settings :: LocalStore", ->
    before (done)->
        settings.config.store.clear()
        done()

    #--------------------------------------------------------
    describe 'Prerequisites', ->
        it 'has a settings object', ->
            expect(settings).to.be.a Settings.LocalStore


    #--------------------------------------------------------
    describe 'storePrivateKey', ->
