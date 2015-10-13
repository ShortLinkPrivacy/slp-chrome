express = require 'express'
bodyParser = require 'body-parser'

port = 5000
storage = []

app = express()
app.use(bodyParser.json())

app.get '/x/:id', (req, res)->
    id = req.params.id
    res.json storage[id]

app.post '/x', (req, res)->
    payload = req.body

    if not payload
        res.statusCode = 400
        res.json { error: "Payload missing" }
        return

    # TODO: find a way to limit POSTs to internal data only, so
    # idiots don't begin using this service as a free anonymous
    # key-value storage.
    
    storage.push(payload)
    res.json { id: storage.length }

# Bootstrap
app.listen port, ->
    console.log "Server listening on port #{port} ..."
