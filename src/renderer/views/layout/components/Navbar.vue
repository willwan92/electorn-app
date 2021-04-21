<template>
  <el-menu class="navbar" mode="horizontal">
    <hamburger class="hamburger-container" :toggleClick="toggleSideBar" :isActive="sidebar.opened"></hamburger>
    <breadcrumb></breadcrumb>
    <el-dropdown class="avatar-container"  @command="handleCommand">
      <div class="avatar-wrapper">
        {{ isLogin ? username : '未登录' }}
        <i class="el-icon-caret-bottom"></i>
      </div>
      <el-dropdown-menu class="user-dropdown" slot="dropdown">
        <span v-if="!isLogin">
          <el-dropdown-item command="handleLoginClick">
            登录
          </el-dropdown-item>
        </span>
        <span v-else>
          <el-dropdown-item command="handleChangePwdClick">
            修改密码
          </el-dropdown-item>
          <el-dropdown-item divided command="handleLogoutClick">
            注销登录
          </el-dropdown-item>
        </span>
      </el-dropdown-menu>
    </el-dropdown>
  </el-menu>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import Breadcrumb from '@/components/Breadcrumb'
import Hamburger from '@/components/Hamburger'

export default {
  data () {
    return {
      user: '未登录',
      squareUrl: 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png',
    }
  },
  components: {
    Breadcrumb,
    Hamburger
  },
  computed: {
    ...mapGetters([
      'sidebar',
      'avatar',
      'username',
      'isLogin'
    ])
  },
  methods: {
    ...mapActions(['LogOut']),
    handleCommand (command) {
      this[command]()
    },
    toggleSideBar () {
      this.$store.dispatch('ToggleSideBar')
    },
    handleChangePwdClick () {
      this.$emit('change-pwd-click')
    },
    handleLoginClick () {
      this.$emit('login-click')
    },
    handleLogoutClick () {
      this.LogOut().then(() => {
        this.$message.success('已注销登录')
        // location.reload() // 为了重新实例化vue-router对象 避免bug
      })
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.navbar {
  height: 50px;
  line-height: 50px;
  border-radius: 0px !important;
  .hamburger-container {
    line-height: 58px;
    height: 50px;
    float: left;
    padding: 0 10px;
  }
  .screenfull {
    position: absolute;
    right: 90px;
    top: 16px;
    color: red;
  }
  .avatar-container {
    height: 50px;
    display: inline-block;
    position: absolute;
    right: 20px;
    .avatar-wrapper {
      cursor: pointer;
      margin-top: 5px;
      .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 10px;
      }
      .el-icon-caret-bottom {
        font-size: 12px;
      }
    }
  }
}
</style>

