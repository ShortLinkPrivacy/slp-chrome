Chrome = require("./chrome.js").Chrome

class TestConfig
    keyStore:
        localStore:
            store: new Chrome()
            directory: 'directory'

exports.TestConfig = TestConfig
