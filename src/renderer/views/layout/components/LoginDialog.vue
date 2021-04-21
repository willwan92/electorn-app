<template>
<el-dialog title="管理员登录" :visible.sync="dialogVisible" :show-close="false" width="400px" center>
  <el-form ref="form" :model="form" :rules="rules" label-width="auto">
    <el-form-item label="账号" prop="name">
      <el-input v-model="form.name" autocomplete="off"></el-input>
    </el-form-item>
    <el-form-item label="密码" prop="password">
      <el-input v-model="form.password" @keydown.enter.native="handleSubmit" type="password" autocomplete="off"></el-input>
    </el-form-item>
  </el-form>
  <div slot="footer" class="dialog-footer">
    <el-button @click="hide">取 消</el-button>
    <el-button type="primary" @click="handleSubmit">登 录</el-button>
  </div>
</el-dialog>
</template>

<script>
import { mapActions } from 'vuex'
export default {
  data () {
    return {
      dialogVisible: false,
      form: {
        name: '',
        password: ''
      },
      rules: {
        name: [
          { required: true, message: '请输入账号', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' }
        ],
      }
    }
  },
  methods: {
    ...mapActions(['Login']),
    show () {
      // 清空表单数据
      this.form = {
        name: '',
        password: ''
      }
      this.dialogVisible = true
    },
    hide () {
      this.$refs.form.clearValidate()
      this.dialogVisible = false
    },
    handleSubmit () {
      this.$refs.form.validate(valid => {
        if (!valid) return
        this.Login(this.form)
          .then(() => {
            this.dialogVisible = false
            this.$message.success('登录成功')
          })
          .catch(err => {
            this.$message.error(err.message)
          })
      })
    }
  }
}
</script>