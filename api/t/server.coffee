request = require 'supertest'
app     = require '../server.js'
assert  = require 'assert'

# Cleanup
app.db.items.remove({})

r = request(app)

#########################################################

describe 'Missing route', ->

    paths = [
        '/'
        '/random'
        '/x'
        '/x/random'
    ]

    paths.forEach (path)->
        it "#{path} goes to 404", (done)->
            r.get(path).expect(404, done)


#########################################################

describe 'Add item', ->
    p = null

    beforeEach (done)->
        p = r.post("/x").set('Accept', 'application/json')
        done()

    describe 'POST /x', ->

        #----------------------------------------------
        it 'returns 400 if content is missing', (done)->
            p.expect(400, done)

        #----------------------------------------------
        it 'returns 400 if there are no keys or messages', (done)->
            p.send({ blah: 1 }).expect(400, done)

        #----------------------------------------------
        it 'returns 201 if there are keys', (done)->
            p.send({ keys: [1, 2, 3] })
                .end (err, res)->
                    assert.equal(res.status, 201, "201 OK")
                    assert.ok(res.body.id, "id present")
                    done()

        #----------------------------------------------
        it 'returns 201 if there are messages', (done)->
            p.send({ messages: { fingerprint: 123 } })
                .end (err, res)->
                    assert.equal(res.status, 201, "201 OK")
                    assert.ok(res.body.id, "id present")
                    done()

#########################################################

describe 'Retrieve items', ->
    p = null
    result = null

    beforeEach (done)->
        p = r.post("/x")
            .set('Accept', 'application/json')
            .send({ keys: [1,2,3] })
            .end (err, res)->
                result = res.body
                done()

    describe "GET /x/:id", ->
        it "returns 404 if id not found", (done)->
            r.get("/x/562075c6850ddb4a24c9b005")
                .set('Accept', 'application/json')
                .expect(404, done)

        it "returns 200 if id is found", (done)->
            r.get("/x/#{result.id}")
                .set('Accept', 'application/json')
                .expect(200, done)

        it "returns the json stored", (done)->
            r.get("/x/#{result.id}")
                .set('Accept', 'application/json')
                .end (err, res)->
                    assert.deepEqual(res.body.keys, [1,2,3])
                    done()

        it "save proper data in the DB", (done)->
            r.get("/x/#{result.id}")
                .set('Accept', 'application/json')
                .end (err, res)->
                    app.db.items.findOne { _id: app.ObjectId(result.id) }, (e, r)->
                        assert.deepEqual(r.keys, [1,2,3])
                        done()
