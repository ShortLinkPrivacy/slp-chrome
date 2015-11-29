
#############################################################

ms = new MessageStore.LocalStore(app.config)

#############################################################

describe "MessageStore :: LocalStore", ->
    before (done)->
        ms.store.clear()
        done()

    describe 'save', ->
        it 'stores the message', (done)->
            ms.save 'alabama', (id)->
                expect(id).to.be.a "string"
                done()

    describe 'load', ->
        id = null

        before (done)->
            ms.save 'horatio', (i)->
                id = i
                done()

        it 'retrieves a message', (done)->
            ms.load id, (m)->
                expect(m).to.be 'horatio'
                done()

