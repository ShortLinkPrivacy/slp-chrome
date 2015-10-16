express = require 'express'
bodyParser = require 'body-parser'
MongoClient = require('mongodb').MongoClient
ObjectId = require('mongodb').ObjectID

# -----------------------------------------
# Contants
# -----------------------------------------
port = 5000
mongoUrl = 'mongodb://localhost:27017/test'

# -----------------------------------------
# Global variables
# -----------------------------------------

# MongoDB database handle
mongo = null
storage = null

app = express()
app.use(bodyParser.json())

app.get '/x/:id', (req, res)->
    id = req.params.id
    objId = new ObjectId id
    storage.findOne { _id: objId }, (err, result)->
        if err?
            res.statusCode = 500
            res.json { error: err }
        else
            res.statusCode = 200
            res.json result

app.post '/x', (req, res)->
    payload = req.body

    if not payload
        res.statusCode = 400
        res.json { error: "Payload missing" }
        return

    # TODO: find a way to limit POSTs to internal data only, so
    # idiots don't begin using this service as a free anonymous
    # key-value storage.
    
    storage.insertOne payload, (err, result)->
        if err?
            res.statusCode = 500
            res.json { error: err }
        else
            res.statusCode = 201
            res.json { id: result.insertedId }

# Bootstrap
app.listen port, ->
    MongoClient.connect mongoUrl, (err, db)->
        mongo = db
        storage = db.collection 'Items'
        console.log "Server listening on port #{port} ..."
