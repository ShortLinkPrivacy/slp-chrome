express = require 'express'
bodyParser = require 'body-parser'
mongo = require 'mongoskin'
config = require 'config'

# -----------------------------------------
# Global variables
# -----------------------------------------

db = mongo.db(config.get 'mongo.url')
db.bind('items')
ObjectId = mongo.ObjectID

# Web application
app = express()

# Required, so tests can have access to the db
app.db = db
app.ObjectId = ObjectId

# -----------------------------------------
# Express middleware
# -----------------------------------------
app.use(bodyParser.json())

# -----------------------------------------
# Routes
# -----------------------------------------

app.get '/x/:id', (req, res)->
    
    id = req.params.id
    objId = null

    # Must be an ObjectId
    try
        objId = new ObjectId id
    catch e
        return res.sendStatus 404
    
    # Not json? Return a text with a link to install the extension
    # TODO: Send a full HTML with links here
    unless req.get('Accept') == "application/json"
        res.statusCode = 200
        res.send "Please download and install this Chrome plugin to read this message"
        return

    # Find the id in items
    db.items.findOne { _id: objId }, (err, result)->
        if err?
            res.sendStatus 500      # TODO: log error
        else if result?
            res.statusCode = 200
            res.json result
        else
            res.sendStatus 404


app.post '/x', (req, res)->
    payload = req.body

    unless payload?.keys? or payload?.messages?
        res.statusCode = 400
        res.json { error: "Payload missing" }
        return

    # TODO: find a way to limit POSTs to internal data only, so
    # idiots don't begin using this service as a free anonymous
    # key-value items
    
    db.items.insertOne payload, (err, result)->
        if err?
            res.statusCode = 500
            res.json { error: err }
        else
            res.statusCode = 201
            res.json { id: result.insertedId }


# Bootstrap
if require.main == module
    port = config.get('express.port')
    app.listen port, ->
        console.log "The server is running at port #{port}"

module.exports = app
