import path from 'path';
import webpack from 'webpack';

const config: webpack.Configuration = {
    entry: './src/lib.ts',
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
    },
    output: {
        path: path.resolve(__dirname, 'lib'),
        filename: 'mathjslab.js',
        library: {
            name: 'mathjslab',
            type: 'umd',
        },
        clean: true,
    },
};

export default config;
