// CommonJS Webpack config to avoid ESM __dirname issues
const path = require('node:path');

/** @type {import('webpack').Configuration} */
const mainConfig = {
  mode: 'production',
  target: 'electron-main',
  entry: {
    entry: path.resolve(__dirname, 'src/entry.ts'),
  },
  output: {
    path: path.resolve(__dirname, 'dist-bundle'),
    filename: '[name].cjs',
    libraryTarget: 'commonjs2',
    clean: false,
  },
  resolve: {
    extensions: ['.ts', '.js'],
    extensionAlias: { '.js': ['.ts', '.js'] },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [{ loader: 'ts-loader', options: { transpileOnly: true } }],
        exclude: /node_modules/,
      },
    ],
  },
  externals: {
    electron: 'commonjs2 electron',
    'electron-log/main.js': 'commonjs2 electron-log/main.js',
  },
  devtool: 'source-map',
  node: { __dirname: false, __filename: false },
};

/** @type {import('webpack').Configuration} */
const preloadConfig = {
  mode: 'production',
  target: 'electron-preload',
  entry: {
    preload: path.resolve(__dirname, 'src/preload.ts'),
  },
  output: {
    path: path.resolve(__dirname, 'dist-bundle'),
    filename: '[name].cjs',
    libraryTarget: 'commonjs2',
    clean: false,
  },
  resolve: {
    extensions: ['.ts', '.js'],
    extensionAlias: { '.js': ['.ts', '.js'] },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [{ loader: 'ts-loader', options: { transpileOnly: true } }],
        exclude: /node_modules/,
      },
    ],
  },
  externals: {
    electron: 'commonjs2 electron',
    'electron-log/main.js': 'commonjs2 electron-log/main.js',
  },
  devtool: 'source-map',
  node: { __dirname: false, __filename: false },
};

module.exports = [mainConfig, preloadConfig];
