# electron-vue-app

> An electron-vue project

系统是基于Electron开发的离线的windows客户端应用程序。应用程序界面采用vue-electron，ElementUI和node-xlsx开发。通过应用程序界面管理操作票和操作票检查规则，数据存储采用浏览器内核 Chromium 提供的本地数据库IndexedDB，基于IndexedDB提供的高性能数据查询和Electron提供的程序运行环境执行操作票的检查和结果的输出。

#### Build Setup

``` bash
# install dependencies
yarn install

# serve with hot reload at localhost:9080
yarn run dev

# build electron application for production
yarn run build


# lint all JS/Vue component files in `src/`
yarn run lint

```

---

This project was generated with [electron-vue](https://github.com/SimulatedGREG/electron-vue)@[45a3e22](https://github.com/SimulatedGREG/electron-vue/tree/45a3e224e7bb8fc71909021ccfdcfec0f461f634) using [vue-cli](https://github.com/vuejs/vue-cli). Documentation about the original structure can be found [here](https://simulatedgreg.gitbooks.io/electron-vue/content/index.html).
