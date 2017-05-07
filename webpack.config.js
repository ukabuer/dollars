var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: './src/views/index.js',
    output: {
        path: __dirname + '/public/js',
        filename: 'bundle.js',
        publicPath: '/js/'
    },
    module: {
        rules: [
            {
                test: /.js$/,
                loader: 'babel-loader?cacheDirectory',
                exclude: /node_modules/,
                options: {
                    presets: ['es2015', 'stage-3'],
                }
            },
            {
                test: /.vue$/,
                loader: 'vue-loader',
                exclude: /node_modules/,
                options: {
                    preserveWhitespace: false,
                    loaders: {
                        js: {
                            loader: 'babel-loader',
                            options: {
                                presets: ['es2015', 'stage-3'],
                            }
                        }
                    }
                }
            }
        ]
    },
    resolve: {
        modules: [path.resolve(__dirname, 'node_modules')],
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
            beautify: false,
            comments: false,
            compress: {
                warnings: false,
                drop_console: true,
                collapse_vars: true,
                reduce_vars: true,
            }
        })
    ])
}