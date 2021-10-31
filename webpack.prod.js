const { merge } = require('webpack-merge');
const base = require('./webpack.config.js');
const JsonMinimizerPlugin = require("json-minimizer-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const { ProvidePlugin } = require("webpack");
const path = require("path");

module.exports = merge(base, {
    mode: "production",
    output: {
        path: path.join(__dirname, "docs"),
        filename: "[fullhash].js",
        clean: true
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, "src", "index.html"),
            templateParameters: {
                cdn: `
                    <script crossorigin src="https://unpkg.com/react@17/umd/react.production.min.js"></script>
                    <script crossorigin src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js"></script>
                `,
            }
        }),
        new CopyPlugin({
            patterns: [
                {
                    context: path.resolve(__dirname, "src"),
                    from: "./*.json"
                },
                {
                    context: path.resolve(__dirname, "src"),
                    from: "./*.css"
                },
                {
                    context: path.resolve(__dirname, "src"),
                    from: "./images",
                    to: "images"
                },
            ]
        }),
        new ProvidePlugin({
            "React": "react",
            "ReactDOM": "react-dom",
        }),
    ],
    optimization: {
        minimize: true,
        minimizer: [
            "...",
            new JsonMinimizerPlugin(),
        ],
    },
    externals: {
        "react": "React",
        "react-dom": "ReactDOM",
    },
});