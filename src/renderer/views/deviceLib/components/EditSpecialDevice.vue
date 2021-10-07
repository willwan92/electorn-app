<template>
  <el-dialog custom-class="dialog" width="400px" :title="id !== null ? '编辑特殊设备' : '新建特殊设备'" :visible.sync="dialogFormVisible">
    <el-form :model="form" ref="form"  label-width="120px">
      <el-form-item
        label="特殊设备"
        prop="deviceName"
        :rules="[{
          required: true, message: '请输入设备名称', trigger: 'blur'
        }]">
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
import { trimAllSpace } from '@/utils/index'
export default {
  name: 'EditSpecialDevice',
  data () {
    return {
      dialogFormVisible: false,
      isSubmiting: false,
      id: null,
      form: {
        deviceName: '',
      }
    }
  },
  methods: {
    edit (row) {
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs.form.clearValidate()
      })
      if (!row) {
        this.id = null
        this.form = {
          deviceName: '',
        }
      } else {
        this.id = row.id
        this.form = {
          deviceName: row.deviceName
        }
      }
    },
    handleSubmit () {
      // 防止重复提交
      if (this.isSubmiting) return
      this.$refs.form.validate(valid => {
        if (!valid) return
        this.isSubmiting = true
        const deviceName = trimAllSpace(this.form.deviceName)
        if (this.id === null) {
          db.specialDevice
            .add({
              deviceName
            })
            .then(() => {
              this.dialogFormVisible = false
              this.$message.success('新建成功')
              this.$emit('ok')
            })
            .catch(err => {
              console.log(err)
              this.$message.error('錯誤：设备名称不能重复，请检查后再试')
            })
            .finally(() => {
              this.isSubmiting = false
            })
        } else {
          db.specialDevice
            .update(this.id, {
              deviceName
            })
            .then(() => {
              this.dialogFormVisible = false
              this.$message.success('保存成功')
              this.$emit('ok')
            })
            .catch(err => {
              console.log(err)
              this.$message.error('錯誤：设备名称不能重复，请检查后再试')
            })
            .finally(() => {
              this.isSubmiting = false
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
  .el-input, .el-select, .el-textarea {
    width: 200px;
  }
}
</style>