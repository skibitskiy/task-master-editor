// CommonJS Webpack config to avoid ESM __dirname issues
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('node:path');

/** @type {import('webpack').Configuration} */
const mainConfig = {
  mode: process.env.NODE_ENV === 'development' ? 'development' : 'production',
  target: 'electron-main',
  entry: {
    entry: path.resolve(__dirname, 'src/entry.ts'),
    security: path.resolve(__dirname, 'src/security.ts'),
    fsAtomic: path.resolve(__dirname, 'src/fsAtomic.ts'),
    main: path.resolve(__dirname, 'src/main.ts'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].cjs',
    libraryTarget: 'commonjs2',
    clean: false,
  },
  resolve: {
    extensions: ['.ts', '.js'],
    extensionAlias: { '.js': ['.ts', '.js'] },
    alias: {
      '@app/shared': path.resolve(__dirname, '../shared/dist'),
    },
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
    'better-sqlite3': 'commonjs2 better-sqlite3',
  },
  devtool: 'source-map',
  node: { __dirname: false, __filename: false },
};

/** @type {import('webpack').Configuration} */
const preloadConfig = {
  mode: process.env.NODE_ENV === 'development' ? 'development' : 'production',
  target: 'electron-preload',
  entry: {
    preload: path.resolve(__dirname, 'src/preload.ts'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].cjs',
    library: {
      type: 'commonjs2',
    },
    clean: false,
    module: false,
    chunkFormat: 'commonjs',
  },
  externalsType: 'commonjs',
  resolve: {
    extensions: ['.ts', '.js'],
    extensionAlias: { '.js': ['.ts', '.js'] },
    alias: {
      '@app/shared': path.resolve(__dirname, '../shared/dist/index.js'),
    },
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
    'better-sqlite3': 'commonjs2 better-sqlite3',
  },
  devtool: 'source-map',
  node: { __dirname: false, __filename: false },
};

module.exports = [mainConfig, preloadConfig];
