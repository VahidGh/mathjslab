import path from 'path';
import webpack from 'webpack';

const config: webpack.Configuration = {
    entry: './src/index.ts',
    module: {
        rules: [
            {
                test: /\.[tj]s$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            configFile: 'tsconfig.build.json',
                        },
                    },
                ],
                exclude: [/node_modules/, /.*\.spec\.[tj]s/],
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            parser: path.resolve(__dirname, 'src/'),
        },
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'mathjslab.js',
        library: 'mathjslab',
        libraryTarget: 'umd',
        clean: true,
    },
};

export default config;
