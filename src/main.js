import print from './js/print';

import './css/body.css';
import './css/index.less';
import './iconfont/iconfont.css';
/*
通过js代码，让某个文件被单独打包成一个chunk
import动态导入语法：能将某个文件单独打包
*/
import('./js/mathUtil').then(({ add }) => {
  console.log(add(1,2));
})

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
