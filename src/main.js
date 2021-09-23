import print from './js/print';

import './css/body.css';
import './css/index.less';
import './iconfont/iconfont.css';
/*
通过js代码，让某个文件被单独打包成一个chunk
import动态导入语法：能将某个文件单独打包
*/
import(/* webpackChunkName: 'math' */'./js/mathUtil').then(({ add }) => {
  console.log(add(1,2));
})

/*
  懒加载：当文件需要使用时才加载
  正常加载可以认为是并行加载（同一时间加载多个文件）
  预加载 prefetch: 会在使用之前，提前加载js文件，等其他资源加载完毕，浏览器空闲了，再偷偷加载资源
*/
document.getElementById('btn').onclick = function() {
  import(/* webpackChunkName: 'lazy', webpackPrefetch: true */'./js/lazy').then(({lazy}) => {
    console.log(lazy());
  })
}

const promise = new Promise((resolve) => {
  resolve('aaaaaa');
});
print();

// eslint-disable-next-line
console.log(promise);

if (module.hot) {
  // 一旦module.hot为true， 说明开启了HMR功能 --> 让HMR功能代码生效
  module.hot.accept('./js/print.js', () => {
    // 方法会监听print.js文件的变化，一旦发生变化，其他默认不会重新打包构建。
    // 会执行后面的回调函数
    print();
  });
}

/*
  sw代码必须运行在服务器上
  --> nodejs
  -->
    npm i serve -g
    serve -s build 启动服务器，将build目录下所有资源作为静态资源暴露出去
*/
// 注册serviceworker
// 处理兼容性问题
if('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(() => {
        console.log('sw注册成功了');
      })
      .catch(() => {
        console.log('sw注册失败了');
      })
  })
}