<template>
  <scroll-bar>
    <div class="logo-wrapper">
      <img class="logo" :src="logoImg" alt="logo">
    </div>
    <el-menu
      mode="vertical"
      :show-timeout="200"
      :default-active="$route.path"
      :collapse="isCollapse"
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#409EFF"
    >
      <sidebar-item :routes="menuRoutes"></sidebar-item>
    </el-menu>
  </scroll-bar>
</template>

<script>
import { mapGetters } from 'vuex'
import SidebarItem from './SidebarItem'
import ScrollBar from '@/components/ScrollBar'
import logoImg from '@/assets/logo.png'

export default {
  components: { SidebarItem, ScrollBar },
  data () {
    return {
      logoImg: logoImg
    }
  },
  computed: {
    ...mapGetters([
      'sidebar',
      'menuRoutes'
    ]),
    isCollapse () {
      return !this.sidebar.opened
    }
  }
}
</script>

<style scoped lang="scss">
.logo-wrapper {
  width: 100%;
  height: 50px;
  background-color: #EBEEF5;
  text-align: center;
  padding-top: 11px;
  .logo {
    width: 160px;
  }
}
</style>
