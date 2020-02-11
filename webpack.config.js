const autoprefixer = require('autoprefixer');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');



module.exports = {
  entry: './',
  output: {
    path: `${__dirname}/dist`,
    filename: '[name].js',
    library: 'dataview',
    libraryTarget: 'umd'
  },
  externals: {
    react: {
      commonjs: 'react',
      commonjs2: 'react',
      amd: 'react',
      root: 'React'
    },
    'react-dom': {
      commonjs: 'react-dom',
      commonjs2: 'react-dom',
      amd: 'react-dom',
      root: 'ReactDOM'
    },
    mobx: {
      commonjs: 'mobx',
      commonjs2: 'mobx',
      amd: 'mobx',
      root: 'mobx'
    },
    'mobx-react': {
      commonjs: 'mobx-react',
      commonjs2: 'mobx-react',
      amd: 'mobx-react',
      root: 'MobxReact'
    },
    'element-react': {
      commonjs: 'element-react',
      commonjs2: 'element-react',
      amd: 'element-react',
      root: 'element'
    }
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'eslint-loader'
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.css$|\.less$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => [autoprefixer]
            }
          },
          'less-loader'
        ]
      }
    ]
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.js', '.jsx']
  },
  target: 'web',
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        sourceMap: true,
        uglifyOptions: {
          ecma: 8,
          warnings: false,
          comments: false
        }
      })
    ]
  },
  plugins: [
    new CleanWebpackPlugin('./dist', {
      verbose: true
    })
  ]
};
