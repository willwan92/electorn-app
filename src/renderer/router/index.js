import Vue from 'vue'
import Router from 'vue-router'
import Layout from '../views/layout/Layout'

// in development-env not use lazy-loading, because lazy-loading too many pages will cause webpack hot update too slow. so only in production use lazy-loading;
// detail: https://panjiachen.github.io/vue-element-admin-site/#/lazy-loading

Vue.use(Router)

/* Layout */

/**
* hidden: true                   if `hidden:true` will not show in the sidebar(default is false)
* alwaysShow: true               if set true, will always show the root menu, whatever its child routes length
*                                if not set alwaysShow, only more than one route under the children
*                                it will becomes nested mode, otherwise not show the root menu
* redirect: noredirect           if `redirect:noredirect` will no redirct in the breadcrumb
* name:'router-name'             the name is used by <keep-alive> (must set!!!)
* meta : {
    title: 'title'               the name show in submenu and breadcrumb (recommend set)
    icon: 'svg-name'             the icon show in the sidebar,
  }
**/
export const constantRouterMap = [
  {
    path: '/login',
    component: () => import('@/views/login/index'),
    hidden: true
  },
  {
    path: '/',
    redirect: '/home/index'
  },
  {
    path: '/home',
    name: 'Home',
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('@/views/home/index'),
        meta: { title: '首页', icon: 'home' }
      }
    ]
  },
  {
    path: '/example',
    component: Layout,
    redirect: '/example/table',
    name: 'Example',
    meta: { title: 'Example', icon: 'example' },
    children: [
      {
        path: 'table',
        name: 'Table',
        component: () => import('@/views/table/index'),
        meta: { title: 'Table', icon: 'table' }
      },
      {
        path: 'tree',
        name: 'Tree',
        component: () => import('@/views/tree/index'),
        meta: { title: 'Tree', icon: 'tree' }
      }
    ]
  },
  {
    path: '/rules',
    component: Layout,
    name: 'rules',
    redirect: '/rules/time',
    meta: { title: '通用规则', icon: 'form' },
    children: [
      {
        path: 'time',
        name: 'time',
        component: () => import('@/views/rules/time/index'),
        meta: { title: '操作时间规则', icon: 'form' }
      },
      {
        path: 'taskName',
        name: 'taskName',
        component: () => import('@/views/rules/task/index'),
        meta: { title: '任务名称规则', icon: 'form' }
      },
      {
        path: 'simpleRule',
        name: 'simpleRule',
        component: () => import('@/views/rules/simpleRule/index'),
        meta: { title: '简单规则', icon: 'form' }
      }
    ]
  },
  {
    path: '/deviceLib',
    component: Layout,
    children: [
      {
        path: 'index',
        name: 'deviceLib',
        component: () => import('@/views/deviceLib/index'),
        meta: { title: '设备双编库', icon: 'form' }
      }
    ]
  },
  {
    path: '/verbLib',
    component: Layout,
    children: [
      {
        path: 'index',
        name: 'verbLib',
        component: () => import('@/views/verbLib/index'),
        meta: { title: '动词库', icon: 'form' }
      }
    ]
  }
]

export default new Router({
  // mode: 'history', //后端支持可开
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRouterMap
})
