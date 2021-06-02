<template>
  <el-dialog custom-class="dialog" width="600px" :title="form.id ? '编辑动词搭配' : '新建动词搭配'" :visible.sync="dialogFormVisible">
    <el-form :model="form" ref="form"  label-width="120px">
      <el-form-item
        label="动词"
        prop="verb"
        :rules="[{
          required: true, message: '请输入动词', trigger: 'blur'
        }]">
        <el-input v-model="form.verb" autocomplete="off"></el-input>
      </el-form-item>
      <el-form-item label="对应搭配">
        <el-input
          type="textarea"
          :rows="2"
          v-model="form.nouns"
          autocomplete="off"
          placeholder="请输入动词搭配，多个搭配用顿号“、”隔开"></el-input>
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
  name: 'EditDialog',
  data () {
    return {
      dialogFormVisible: false,
      isSubmiting: false,
      form: {
        verb: '',
        nouns: ''
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
        this.form = {
          verb: '',
          nouns: ''
        }
      } else {
        this.form = {
          id: row.id,
          verb: row.verb,
          nouns: row.nouns
        }
      }
    },
    handleSubmit () {
      // 防止重复提交
      if (this.isSubmiting) return
      this.$refs.form.validate(valid => {
        if (!valid) return
        this.isSubmiting = true
        const id = this.form.id
        const verb = trimAllSpace(this.form.verb)
        let nouns = trimAllSpace(this.form.nouns)
        nouns = nouns ? nouns.split('、') : []
        if (!id) {
          db.verb
            .add({
              verb: verb,
              nouns: nouns
            })
            .then(() => {
              this.dialogFormVisible = false
              this.$message.success('添加成功')
              this.$emit('ok')
            })
            .catch(err => {
              console.log(err)
              this.$message.error(`錯誤：动词不能重复，动词${verb}已存在`)
            })
            .finally(() => {
              this.isSubmiting = false
            })
        } else {
          db.verb
            .update(id, {
              verb: verb,
              nouns: nouns
            })
            .then(() => {
              this.dialogFormVisible = false
              this.$message.success('修改成功')
              this.$emit('ok')
            })
            .catch(err => {
              console.log(err)
              this.$message.error(`錯誤：系统繁忙，请稍后再试`)
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
    width: 300px;
  }
}
</style>