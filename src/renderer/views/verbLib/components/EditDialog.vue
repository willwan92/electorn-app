<template>
  <el-dialog custom-class="dialog" width="600px" :title="form.id ? '编辑动词搭配' : '新建动词搭配'" :visible.sync="dialogFormVisible">
    <el-form :model="form" size="small">
      <el-form-item label="动词" :label-width="formLabelWidth">
        <el-input v-model="form.verb" autocomplete="off"></el-input>
      </el-form-item>
      <el-form-item label="对应搭配" :label-width="formLabelWidth">
        <div v-for="(item, index) in form.nouns" :key="index" style="margin-bottom: 6px;">
          <el-input v-model="form.nouns[index]" autocomplete="off"></el-input>
          <el-button v-if="index === 0" icon="el-icon-plus" @click="handleAddClick" circle></el-button>
          <el-button v-else icon="el-icon-minus" @click="handleRemoveClick(index)" type="danger" circle></el-button>
        </div>
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
      formLabelWidth: '120px',
      dialogFormVisible: false,
      form: {
        verb: '',
        nouns: ['']
      }
    }
  },
  methods: {
    edit (row) {
      this.dialogFormVisible = true
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