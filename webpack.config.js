const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")

module.exports = {
    // Other rules...
    mode: "development",
    plugins: [
        new NodePolyfillPlugin()
    ]
}