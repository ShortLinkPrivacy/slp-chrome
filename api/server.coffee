http = require 'http'
_url = require 'url'
storage = require './storage'

saveMessage = (_, req, res)->
    JSON.stringify { type: 'set_message'}

saveKey = (_, req, res)->
    JSON.stringify { type: 'set_key'}

getMessage = (m, req, res)->
    JSON.stringify {id: m[1], type: 'get_message'}

getKey = (m, req, res)->
    JSON.stringify {id: m[1], type: 'get_key'}

routes = [
    "POST", "/m",         saveMessage,
    "POST", "/k",         saveKey,
    "GET",  /\/m\/(.+)$/, getMessage,
    "GET",  /\/k\/(.+)$/, getKey
]

allMatch = (a, b)->
    if typeof b == "string" then a == b else b.exec(a)

server = http.createServer (req, res)->
    content = null
    url = _url.parse(req.url, true)

    pos = 0
    while pos < routes.length
        method = routes[pos + 0]
        path   = routes[pos + 1]
        action = routes[pos + 2]
        match  = null

        if req.method == method and match = allMatch(url.pathname, path)
            content = action(match, url, res)
            break

        pos += 3

    if content
        res.statusCode = 200
        res.setHeader "Content-Type", "application/json"
    else
        res.statusCode = 404
        res.setHeader "Content-Type", "text/plain"
        content = "File not found\n"

    res.setHeader "Content-Length", content?.length or 0
    res.end content

server.listen 5000
