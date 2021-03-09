import router from './router'
import store from './store'
import NProgress from 'nprogress' // Progress 进度条
import 'nprogress/nprogress.css'// Progress 进度条样式
// import { Message } from 'element-ui'

// const whiteList = ['/login'] // 不重定向白名单
router.beforeEach((to, from, next) => {
  NProgress.start()
  if (store.getters.token) {
    if (to.path === '/login') {
      // if current page is dashboard will not trigger afterEach hook, so manually handle it
      next({ path: '/' })
      NProgress.done()
    } else {
      next()
    }
  } else {
    // if (whiteList.indexOf(to.path) !== -1) {
    //   next()
    // } else {
    //   next('/login')
    //   NProgress.done()
    // }
    next()
    NProgress.done()
  }
})

router.afterEach(() => {
  NProgress.done() // 结束Progress
})
