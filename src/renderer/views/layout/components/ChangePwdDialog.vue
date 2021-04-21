<template>
<el-dialog title="修改密码" :visible.sync="dialogVisible" :show-close="false" width="400px" center>
  <el-form ref="form" :model="form" :rules="rules" label-width="auto">
    <el-form-item label="密码" prop="password">
      <el-input v-model="form.password" autocomplete="off"></el-input>
    </el-form-item>
    <el-form-item label="确认密码" prop="rePassword">
      <el-input v-model="form.rePassword" @keydown.enter.native="handleSubmit" type="password" autocomplete="off"></el-input>
    </el-form-item>
  </el-form>
  <div slot="footer" class="dialog-footer">
    <el-button @click="hide">取 消</el-button>
    <el-button type="primary" @click="handleSubmit">确 定</el-button>
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
        password: '',
        rePassword: ''
      },
      rules: {
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, max: 16, message: '密码长度在 6 到 16 个字符', trigger: 'blur' }
        ],
        rePassword: [
          { required: true, message: '请再次输入密码', trigger: 'blur' }
        ],
      }
    }
  },
  methods: {
    ...mapActions(['ChangePassword']),
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
        if (this.form.password !== this.form.rePassword) {
          this.$message.error('两次密码输入不一致')
          return
        }
        this.ChangePassword(this.form.password)
          .then(res => {
            this.dialogVisible = false
            this.$message.success('密码修改成功')
          })
          .catch(err => {
            this.$message.error(err.message)
          })
      })
    }
  }
}
</script>