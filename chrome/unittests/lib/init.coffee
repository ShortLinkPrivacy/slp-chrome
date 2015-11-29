mocha.setup 'bdd'
window.assert = (expr, msg)->
    if !expr then throw new Error(msg or 'failed')
