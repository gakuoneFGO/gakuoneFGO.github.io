const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const JsonMinimizerPlugin = require("json-minimizer-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const { ProvidePlugin } = require("webpack");

module.exports = {
    entry: "./src/index.tsx",
    output: {
        path: path.join(__dirname, "build"),
        filename: "[fullhash].js",
        clean: true
    },
    mode: process.env.NODE_ENV || "development",
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    devServer: { static: path.join(__dirname, "src") },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: ["ts-loader"],
            },
            {
                test: /\.(css|scss)$/,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.(jpg|jpeg|png|gif|mp3|svg)$/,
                use: ["file-loader"],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, "src", "index.html"),
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
        `...`,
        new JsonMinimizerPlugin(),
      ],
    },
    externals: {
        "react": "React",
        "react-dom": "ReactDOM",
    },
    experiments: {
        topLevelAwait: true
    },
};