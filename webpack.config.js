var path = require('path')
var webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin') //提取css成单独文件
const CssMinimizerWebpackPlugin = require('css-minimizer-webpack-plugin') //压缩css
const EslintWebpackPlugin = require('eslint-webpack-plugin')
const TerserWebpackPlugin = require('terser-webpack-plugin')
const WorkboxWebpackPlugin = require('workbox-webpack-plugin')
// const BabelPluginDynamicImportWebpack = require('babel-plugin-dynamic-import-webpack')

const { resolve } = require('path')
/*
    loader： 1.下载 2.使用
    plugin:  1.下载 2.引入 3.使用
*/

/*
    PWA: 渐进式网络开发应用程序（离线可访问）
    workbox --> workbox-webpack-plugin
*/

/*
    Chunk是Webpack打包过程中，一堆module的集合。我们知道Webpack的打包是从一个入口文件开始，也可以说是入口模块，
    入口模块引用这其他模块，模块再引用模块。Webpack通过引用关系逐个打包模块，这些module就形成了一个Chunk。
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
                    因为css是在js中被引入的，所以同属于一个chunk
            contenthash: 根据文件的内容生成hash值。不同文件hash值一定不一样
*/

/*
    tree shaking: 去除无用代码
        前提： 1.必须使用ES6模块化 2.开启production环境
        作用：减少代码体积

    在package.json中配置
        "sideEffects": false 所有代码都没有副作用（都可以进行tree shaking)
            问题： 可能会把css @babel/polyfill 文件干掉
        "sideEffects": ["*.css", "*.less"]
*/

// process.env.NODE_ENV = 'development'

module.exports = {
    // 单入口
    entry: ['./src/main.js', './index.html'],
    // entry : {
    //     // 多入口： 有一个入口，最终输出就有一个bundle
    //     main: ['./src/main.js','./index.html'],
    //     math: './src/js/mathUtil.js',
    // },
    output: {
        //输出路径
        path: path.resolve(__dirname, 'dist'),
        //输出文件名
        filename: 'js/[name].[contenthash:10].js',
        assetModuleFilename: 'images/[hash:10][ext]',
        // 所有资源引入公共路径前缀 --> 'imgs/a.jpg' --> '/imgs/a.jpg'
        publicPath: '/',
        chunkFilename: 'js/[name]_chunk.js', // 指定非入口chunk的名称
        library: '[name]', // 打包整个库后向外暴露的变量名
        libraryTarget: 'window' // 变量名添加到哪个上 browser：window
        // libraryTarget: 'global' // node：global
        // libraryTarget: 'commonjs' // conmmonjs模块 exports
    },
    resolve: {
        // 配置解析模块路径别名： 优点简写路径 缺点路径没有提示
        alias: {
            $css : path.resolve(__dirname,'src/css')
        },
        // 配置省略文件路径的后缀名 
        extensions: ['.js', 'json']
    },
    plugins: [
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
            filename: 'css/built.[contenthash:10].css'
        }),
        new WorkboxWebpackPlugin.GenerateSW({
            /*
                1.帮助serviceworker快速启动
                2.删除旧的 serviceworker

                打包后生成一个 serviceworker 配置文件
            */
            clientsClaim: true,
            skipWaiting: true
        })
        /*
            语法检查： eslint-webpack-plugin eslint
            注意：只检查自己的代码，不检查第三方库
            检查规则在package.json中eslintConfig中设置
            airbnb -> eslint-config-airbnb-base eslint eslint-plugin-import
            eslint 不认识 window navigator全局变量
                解决：需要修改package.json中eslintConfig配置
                "env": {
                    "browser": true //支持浏览器端全局变量
                }
        */
        // new EslintWebpackPlugin({
        //     fix: true
        // })
    ],
    optimization: {
        minimize: true,
        minimizer: [
            new CssMinimizerWebpackPlugin(),
            // 配置了minimizer后，就表示开发者在自定义压缩插件，内部的js压缩器就会被覆盖掉
            new TerserWebpackPlugin({
                // 开启缓存
                cache: true,
                // 开启多进程打包
                parallel: true,
                // 启动source-map
                scourceMap: true
            })
        ],
        /*
            1. 可以将node_modules中代码单独打包一个chunk最终输出
            2. 自动分析多入口chunk中，有没有公共的文件。如果有会打包成一个单独的chunk
        */
        splitChunks: {
            chunks: 'all'
        }
    },
    module: {
        rules: [
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
                        use: [
                            /*
                                开启多进程打包。
                                进程启动大概为600ms，进程通信也有开销。
                                只有工作消耗时间比较长，才需要多进程打包
                            */
                            // 'thread-loader',
                            {
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
    externals: {
        // 拒绝jQuery被打包进来
        jquery: 'jQuery'
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