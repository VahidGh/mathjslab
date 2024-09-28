/**
 * webpack.config.ts: Webpack configuration factory.
 */

import path from 'node:path';
import webpack from 'webpack';

export default (env: any, argv: any): webpack.Configuration => {
    console.warn('webpack.config.ts: Building production bundle.');
    console.log('Environment variables:');
    console.table(env);
    return {
        mode: argv.mode,
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
                    exclude: [/node_modules/, /lib/, /res/, /script/, /.*\.spec\.[tj]s/],
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
};
