Chrome = require("../lib/chrome.js").Chrome
storage = new Chrome()
assert = require "assert"

describe "Chrome fake localStorage", ->
    describe "Set", ->
        it 'saves a single key', ->
            bar = { foo: 1 }
            storage.set bar, ->
                assert storage.data().foo is 1

        it 'saves multiple keys', ->
            bar = { moo: 2, baz: 3, taz: 4, laz: 5 }
            storage.set bar, ->
                assert storage.data().foo is 1
                assert storage.data().moo is 2
                assert storage.data().baz is 3
                assert storage.data().taz is 4
                assert storage.data().laz is 5

    describe 'Get', ->
        it 'gets an item by a single string', ->
            storage.get 'foo', (r)->
                assert r.foo is 1

        it 'gets items by array', ->
            storage.get ['moo', 'baz'], (r)->
                assert r.moo is 2
                assert r.baz is 3

        it 'gets items by object', ->
            storage.get { baz: 1, laz: 1 }, (r)->
                assert r.baz is 3
                assert r.laz is 5

    describe "Remove", ->
        it 'deletes a single key by string', ->
            storage.remove 'foo', ->
                assert typeof storage.data().foo is "undefined"

        it 'deletes keys by array', ->
            storage.remove ['moo', 'baz'], ->
                assert typeof storage.data().moo is "undefined"
                assert typeof storage.data().baz is "undefined"

        it 'deletes key by object', ->
            storage.remove { taz: 1, laz: 1 }, ->
                assert typeof storage.data().taz is "undefined"
                assert typeof storage.data().laz is "undefined"
