const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")

module.exports = {
    // Other rules...
    mode: "production",
    plugins: [
        new NodePolyfillPlugin()
    ]
}