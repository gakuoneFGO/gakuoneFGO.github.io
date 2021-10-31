const { merge } = require('webpack-merge');
const base = require('./webpack.config.js');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

module.exports = merge(base, {
    mode: "development",
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, "src", "index.html"),
            templateParameters: { cdn: "" }
        }),
    ],
});