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
      <el-form-item
         v-for="(item, index) in form.nouns"
        :key="index"
        :label="index === 0 ? '对应搭配' : ''"
        :class="index === form.nouns.length - 1 ? 'last-noun' : 'noun'"
        :prop="`nouns.${index}`"
        :rules="[{
          required: true, message: '请输入动词搭配', trigger: 'blur'
        }]">
        <el-input v-model="form.nouns[index]" autocomplete="off"  placeholder="请输入动词搭配，搭配之间是或的关系"></el-input>
        <el-button v-if="index === 0" icon="el-icon-plus" @click="handleAddClick" circle></el-button>
        <el-button v-else icon="el-icon-minus" @click="handleRemoveClick(index)" type="danger" circle></el-button>
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
      isSubmiting: false,
      form: {
        verb: '',
        nouns: ['']
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
          nouns: ['']
        }
      } else {
        this.form = {
          id: row.id,
          verb: row.verb,
          nouns: row.nouns.split('、')
        }
      }
    },
    handleAddClick () {
      this.form.nouns.push('')
    },
    handleRemoveClick (index) {
      this.form.nouns.splice(index, 1)
    },
    handleSubmit () {
      // 防止重复提交
      if (this.isSubmiting) return
      this.$refs.form.validate(valid => {
        if (!valid) return
        this.isSubmiting = true
        const { verb, nouns, id } = this.form
        if (!id) {
          db.verb
            .add({
              verb: verb,
              nouns: nouns.join('、')
            })
            .then(() => {
              this.dialogFormVisible = false
              this.$message.success('添加成功')
              this.$emit('ok')
            })
            .catch(err => {
              this.$message.error(`錯誤：${err.message || err}`)
            })
            .finally(() => {
              this.isSubmiting = false
            })
        } else {
          db.verb
            .update(id, {
              verb: verb,
              nouns: nouns.join('、')
            })
            .then(() => {
              this.dialogFormVisible = false
              this.$message.success('修改成功')
              this.$emit('ok')
            })
            .catch(err => {
              this.$message.error(`錯誤：${err.message || err}`)
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
  .el-input, .el-select {
    width: 300px;
  }
}
</style>