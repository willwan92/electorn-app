<template>
  <el-dialog custom-class="dialog" width="600px" :title="form.id ? '编辑双编设备' : '新建双编设备'" :visible.sync="dialogFormVisible">
    <el-form ref="form" :model="form" :rules="rules" label-width="150px">
      <el-form-item label="工作地点" prop="workplace">
        <el-select
          v-model="form.workplace"
          filterable
          placeholder="请选择工作地点">
          <el-option
            v-for="item in workplaceList"
            :label="item"
            :key="item"
            :value="item"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="设备标识牌名称" prop="deviceName">
        <el-input v-model="form.deviceName" autocomplete="off"></el-input>
      </el-form-item>
      <el-form-item label="间隔" prop="interval">
        <el-input v-model="form.interval" autocomplete="off"></el-input>
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="dialogFormVisible = false">取 消</el-button>
      <el-button type="primary" @click="handleSubmit">确 定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import db from '@/database/index'
export default {
  name: 'EditDialog',
  data () {
    return {
      dialogFormVisible: false,
      workplaceList: [],
      form: {
        deviceName: '',
        workplace: '',
        interval: ''
      },
      rules: {
        deviceName: [
          { required: true, message: '请输入设备标识牌名称', trigger: 'blur' }
        ],
        workplace: [
          { required: true, message: '请选择工作地点', trigger: 'blur' }
        ],
        interval: [
          { required: true, message: '请输入间隔', trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    getWorkplaceList () {
      const workplaceList = localStorage.getItem('workplaceList')
      workplaceList && (this.workplaceList = JSON.parse(workplaceList))
    },
    edit (row) {
      this.$refs.form && this.$refs.form.clearValidate()
      this.dialogFormVisible = true
      this.getWorkplaceList()
      if (!row) {
        this.form = {
          deviceName: '',
          workplace: ''
        }
      } else {
        this.form = row
      }
    },
    handleSubmit () {
      this.$refs.form.validate(valid => {
        if (!valid) return
        const form = this.form
        if (!form.id) {
          db.device
            .add(form)
            .then(() => {
              this.$message.success('添加成功')
              this.$emit('ok')
            })
            .catch(err => {
              console.log(err)
              this.$message.error(`錯誤：${err.message || err}`)
            })
            .finally(() => {
              this.dialogFormVisible = false
            })
        } else {
          db.device
            .update(form.id, form)
            .then(() => {
              this.dialogFormVisible = false
              this.$message.success('修改成功')
              this.$emit('ok')
            })
            .catch(err => {
              console.log(err)
              this.$message.error(`錯誤：${err.message || err}`)
            })
            .finally(() => {
              this.dialogFormVisible = false
            })
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.dialog {
  width: 400px;
  .el-input, .el-select {
    width: 300px;
  }
}
</style>