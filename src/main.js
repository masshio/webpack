import print from './js/print';

const { add, mul } = require('./js/mathUtil');

console.log(add(20, 30));
console.log(mul(20, 30));

const promise = new Promise((resolve) => {
  resolve('aaa');
});
print();
console.log(promise);
require('./css/body.css');
require('./css/index.less');
require('./iconfont/iconfont.css');

if (module.hot) {
  // 一旦module.hot为true， 说明开启了HMR功能 --> 让HMR功能代码生效
  module.hot.accept('./js/print.js', () => {
    // 方法会监听print.js文件的变化，一旦发生变化，其他默认不会重新打包构建。
    // 会执行后面的回调函数
    print();
  });
}