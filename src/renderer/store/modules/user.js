import { getToken } from '@/utils/auth'
import { constantRouterMap, asyncRoutes } from '@/router/index'

const user = {
  state: {
    token: getToken(),
    name: 'admin',
    password: 'admin',
    isLogin: false,
    menuRoutes: constantRouterMap,
    avatar: '',
    roles: []
  },

  mutations: {
    SET_TOKEN: (state, token) => {
      state.token = token
    },
    SET_NAME: (state, name) => {
      state.name = name
    },
    SET_PASSWORD: (state, password) => {
      state.password = password
    },
    SET_LOGIN_STATUS: (state, isLogin) => {
      state.isLogin = isLogin
    },
    SET_MENU_ROUTES: (state, routes) => {
      state.menuRoutes = routes
    },
    SET_AVATAR: (state, avatar) => {
      state.avatar = avatar
    },
    SET_ROLES: (state, roles) => {
      state.roles = roles
    }
  },

  actions: {
    // 登录
    Login ({ commit, state }, userInfo) {
      const username = userInfo.name.trim()
      const password = userInfo.password.trim()
      return new Promise((resolve, reject) => {
        if (username === state.name && password === state.password) {
          commit('SET_LOGIN_STATUS', true)
          commit('SET_MENU_ROUTES', constantRouterMap.concat(asyncRoutes))
          resolve()
        } else {
          reject(new Error('用户名或密码错误'))
        }
      })
    },

    // 登出
    LogOut ({ commit, state }) {
      return new Promise((resolve, reject) => {
        commit('SET_LOGIN_STATUS', false)
        commit('SET_MENU_ROUTES', constantRouterMap)
        resolve()
      })
    },

    ChangePassword ({ commit, state }, password) {
      return new Promise((resolve, reject) => {
        commit('SET_PASSWORD', password)
        resolve()
      })
    },

    // 前端 登出
    FedLogOut ({ commit }) {
      return new Promise(resolve => {
        commit('SET_LOGIN_STATUS', false)
        resolve()
      })
    }
  }
}

export default user
