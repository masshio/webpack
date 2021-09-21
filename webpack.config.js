var path = require('path')
var webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin') //提取css成单独文件
const CssMinimizerWebpackPlugin = require('css-minimizer-webpack-plugin') //压缩css
const EslintWebpackPlugin = require('eslint-webpack-plugin')

const { resolve } = require('path')
/*
    loader： 1.下载 2.使用
    plugin:  1.下载 2.引入 3.使用
*/

/*
    缓存：
        babel缓存
            cacheDirectory: true
        文件资源缓存
            hash：每次webpack创建时会生成一个唯一的hash值
                问题：因为js和css同时使用一个hash值
                      如果重新打包，会导致所有缓存失效。（可能我只改动一个文件）
            chunkhash：根据chunk生成的hash值。如果打包来源于同一个chunk，那么hash值就一样
                问题：js和css的hash值还是一样的
*/

// process.env.NODE_ENV = 'development'

module.exports = {
    entry : ['./src/main.js', './index.html'],
    output: {
        //输出路径
        path: path.resolve(__dirname,'dist'),
        //输出文件名
        filename:'js/bundle.[chunkhash:10].js',
        assetModuleFilename: 'images/[hash:10][ext]'
    },
    plugins:[
        new webpack.BannerPlugin('最终版权'),
        // 默认创建空的html文件，自动引入打包输出的所有资源（js/css)
        new HtmlWebpackPlugin({
            template: './index.html',
            // 压缩html代码
            minify: {
                collapseWhitespace: true,
                removeComments: true
            }
        }),
        new MiniCssExtractPlugin({
            filename: 'css/built.[chunkhash:10].css'
        }),
        /*
            语法检查： eslint-webpack-plugin eslint
            注意：只检查自己的代码，不检查第三方库
            检查规则在package.json中eslintConfig中设置
            airbnb -> eslint-config-airbnb-base eslint eslint-plugin-import
        */
        new EslintWebpackPlugin({
            fix: true
        })
    ],
    optimization: {
        minimizer: [
            new CssMinimizerWebpackPlugin(),
        ],
        minimize: true
    },
    module: {
        rules:[
            //详细的loader配置
            {
                // oneOf提升性能，不用oneOf每个loader都会过一遍
                oneOf: [
                    {
                        //匹配哪些文件
                        test: /\.css$/,
                        //使用哪些loader进行处理
                        // use数组中loader执行顺序，从右到左，从下到上依次执行
                        use: [
                            // 创建style标签，将js中的样式资源插入进去，添加到head中生效
                            // 'style-loader',
                            // 使用MiniCssExtractPlugin不需要创建style标签，它会自动生成link标签引入css文件
                            MiniCssExtractPlugin.loader,
                            // 将css文件变成commonjs模块加载js中，里面内容是样式字符串
                            'css-loader',
                            /*
                                css兼容性处理： postcss -> postcss-loader postcss-preset-env
                                帮postcss找到package.json中browserslist里面的配置，通过配置加载指定的css兼容性样式
                                默认使用的是生产环境，改mode不生效，需要改node环境变量
                                process.env.NODE_ENV = development
                                postcss-preset-env在postcss-config.js中引入
                            */
                            {
                                loader: 'postcss-loader',
                            }
                        ]
                    },
                    {
                        test: /\.less$/,
                        use: [
                            // 可提取成一个数组，就可以减少重复代码了
                            MiniCssExtractPlugin.loader,
                            'css-loader',
                            {
                                loader: 'postcss-loader',
                            },
                            'less-loader'
                        ]
                    },
                    // webpack5 已经不用url-loader和file-loader了，具体看文档 https://webpack.docschina.org/guides/asset-modules/
                    {
                        test: /\.(jpg|png|gif)$/,
                        type: 'asset/resource'
                        // loader: 'url-loader',
                        // options: {
                        //     // 关闭es6模块化
                        //     esModule: false,
                        //     limit: 10*1024,
                        //     name: '[hash:10].[ext]',
                        //     outputPath: 'imgs'
                        // },
                        // type: 'javascript/auto'
                    },
                    {
                        exclude: /\.(js|css|less|html|jpg|png|gif)$/,
                        type: 'asset/resource',
                        generator: {
                            filename: 'media/[hash][ext]'
                        }
                        // loader: 'file-loader',
                        // options: {
                        //     name: '[hash:10].[ext]',
                        //     outputPath: 'media'
                        // },
                        // type: 'javascript/auto'
                    },
                    {
                        test: /\.html$/,
                        // 只需要一个loader的时候可以这样写
                        // 处理html中的img
                        loader: 'html-loader',
                    },
                    /*
                        js兼容性处理：babel-loader
                            1.基本js兼容性处理： --> @babel/preset-env
                                问题：只能转换基本语法，如promise就不能转换
                            2.全部js兼容性处理 --> @babel/polyfill
                                问题：我只要解决部分兼容性问题，但是将所有兼容性打码引入，体积太大了
                            3.按需加载 --> core-js
                    */
                    {
                        test: /\.js$/,
                        exclude: /node_modules/,
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                [
                                    '@babel/preset-env',
                                    {
                                        // 按需加载
                                        useBuiltIns: 'usage',
                                        // 指定core-js版本
                                        corejs: {
                                            version: 3
                                        },
                                        //指定兼容性做到哪个版本浏览器 
                                        targets: {
                                            ie: '8',
                                            chrome: '60',
                                            safari: '10'
                                        }
                                    }
                                ]
                            ],
                            // 开启babel缓存
                            // 第二次构建时，会读取之前的缓存
                            cacheDirectory: true
                        }
                    }
                ]
            }
        ]
    },
    mode: 'development',
    // mode: 'production',

    // 开发服务器 devServer: 用来自动化(自动编译)
    // 特点： 只会在内存中编译打包，不会有任何输出
    // 启动devServer指令为：npx webpack server
    devServer: {
        // 要运行项目的路径
        contentBase: resolve(__dirname, 'dist'),
        // 启动gzip压缩
        compress: true,
        port: 3000,
        // 自动打开浏览器
        open: true,
        // 开启HMR
        /*
            HMR: hot module replacement 热模块替换
            作用：一个模块发生变化，只会重新打包这一模块（而不是打包所有模块）
                极大提升构建速度
            样式文件：可以使用HMR功能，因为style-loader内部实现了
            js文件：默认不能使用HMR功能 --> 需要修改js代码，添加支持HMR功能的代码
                只能处理非入口js文件的其他文件
            html文件：默认不能使用HMR功能，同时会导致问题：html文件不能热更新了
                解决：修改entry入口，将html文件引入
        */
        hot: true,
    },
    target: 'web',
    devtool: 'source-map'
    /*
        source-map:一种提供源代码到构建后代码映射技术（如果构建后代码出错了，通过映射可以追踪源代码错误）
        [inline-|hidden-|eval-][nosources-][cheap-[module-]]source-map
        source-map: 外部
            错误代码准确信息 和 源代码的错误位置
        inline-source-map: 内联
            只生成一个内联source-map
            错误代码准确信息 和 源代码的错误位置
        hidden-source-map: 外部
            错误代码错误原因，但是没有错误位置
            不能追踪源代码错误，只能提示到构建后代码的错误位置
        eval-source-map: 内联
            每一个文件都生成对应的source-map,都在eval
            错误代码准确信息 和 源代码的错误位置
        nosources-source-map: 外部
            错误代码准确信息，但是没有任何源代码信息
        cheap-source-map：外部
            错误代码准确信息 和 源代码的错误位置
            只能精确到行，其他可以精确到行和列
        cheap-module-source-map：外部
            错误代码准确信息 和 源代码的错误位置
            module会将loader的source map加入

        内联和外部的区别：1.外部生成了文件，内联没有 2.内联构建速度更快

        开发环境： 速度快，调试更友好
            速度快(eval>inline>cheap>...)
                eval-cheap-source-map
                eval-source-map
            调试更友好
                source-map
                cheap-module-source-map
                cheap-source-map

            --> eval-source-map / eval-cheap-moudule-source-map

        生产环境： 源代码要不要隐藏？调试要不要更友好
            内联会让代码体积变大，所以在生产环境不用内联
            nosources-source-map
            hidden-source-map

            --> source-map / cheap-module-source-map
    */
}