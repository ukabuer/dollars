var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: './views/index.js',
    output: {
        path: __dirname + '/public/js',
        filename: 'bundle.js',
        publicPath: '/js/'
    },
    module: {
        loaders: [
            {
                test: /.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
            },
            {
                test: /.vue$/,
                loader: 'vue-loader',
                exclude: /node_modules/,
            }
        ]
    }
};

if (process.env.NODE_ENV == 'production') {
    module.exports.plugins = (module.exports.plugins || []).concat([
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"production"'
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        })
    ])
}