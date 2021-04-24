<template>
  <el-dialog custom-class="dialog" width="600px" :title="form.id ? '编辑双编设备' : '新建双编设备'" :visible.sync="dialogFormVisible">
    <el-form :model="form">
      <el-form-item label="工作地点" :label-width="formLabelWidth">
        <el-select v-model="form.workplace" placeholder="请选择工作地点">
          <el-option
            v-for="item in workplaceList"
            :label="item"
            :key="item"
            :value="item"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="设备标识牌名称" :label-width="formLabelWidth">
        <el-input v-model="form.deviceName" autocomplete="off"></el-input>
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
import { workplaceList } from '@/utils/constant'
export default {
  name: 'EditDialog',
  data () {
    return {
      formLabelWidth: '120px',
      dialogFormVisible: false,
      workplaceList: Object.freeze(workplaceList),
      form: {
        deviceName: '',
        workplace: ''
      }
    }
  },
  methods: {
    edit (row) {
      this.dialogFormVisible = true
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
      const { workplace, deviceName, id } = this.form
      if (!id) {
        db.device
          .add({ workplace, deviceName })
          .then(() => {
            this.dialogFormVisible = false
            this.$message.success('添加成功')
            this.$emit('ok')
          })
          .catch(err => {
            console.log(err)
            this.$message.error(`錯誤：${err.message || err}`)
          })
      } else {
        db.device
          .update(id, { workplace, deviceName })
          .then(() => {
            this.dialogFormVisible = false
            this.$message.success('修改成功')
            this.$emit('ok')
          })
          .catch(err => {
            console.log(err)
            this.$message.error(`錯誤：${err.message || err}`)
          })
      }
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