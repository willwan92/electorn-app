<template>
  <div class="app-wrapper" :class="classObj">
    <sidebar class="sidebar-container"></sidebar>
    <div class="main-container">
      <navbar
        class="navbar"
        @login-click="handleLoginClick"
        @change-pwd-click="handleChangePwdCLick"
      ></navbar>
      <app-main></app-main>
    </div>
    <login-dialog ref="loginDialog"></login-dialog>
    <change-pwd-dialog ref="changePwdDialog"></change-pwd-dialog>
  </div>
</template>

<script>
import { Navbar, Sidebar, AppMain } from './components'
import LoginDialog from './components/LoginDialog'
import ChangePwdDialog from './components/ChangePwdDialog'

export default {
  name: 'layout',
  components: {
    LoginDialog,
    ChangePwdDialog,
    Navbar,
    Sidebar,
    AppMain
  },
  computed: {
    sidebar () {
      return this.$store.state.app.sidebar
    },
    device () {
      return this.$store.state.app.device
    },
    classObj () {
      return {
        hideSidebar: !this.sidebar.opened,
        withoutAnimation: this.sidebar.withoutAnimation,
        mobile: this.device === 'mobile'
      }
    }
  },
  methods: {
    handleLoginClick () {
      this.$refs.loginDialog.show()
    },
    handleChangePwdCLick () {
      this.$refs.changePwdDialog.show()
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
  @import "../../styles/mixin.scss";
  .app-wrapper {
    @include clearfix;
    position: relative;
    height: 100%;
    width: 100%;
    padding-top: 50px;
    .navbar {
      position: fixed;
      top: 0;
      width: 100%;
      z-index: 1000;
    }
  }
</style>
