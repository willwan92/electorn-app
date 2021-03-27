<template>
  <el-card header="操作任务名称规则">
    <el-form class="page-form" :model="form" label-width="100px" size="small">
      <el-form-item label="规则说明：">
        操作任务名称不可包含设置的关键字
      </el-form-item>
      <el-form-item label="校验逻辑：">
        <el-select v-model="form.operator">
          <el-option value="notIn" label="不可包含"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="关键字：">
        <div v-for="(item, index) in form.keywords" :key="index" style="margin-bottom: 6px;">
          <el-input v-model="form.keywords[index]" autocomplete="off"></el-input>
          <el-button v-if="index === 0" icon="el-icon-plus" @click="handleAddClick" circle></el-button>
          <el-button v-else icon="el-icon-minus" @click="handleRemoveClick(index)" type="danger" circle></el-button>
        </div>
      </el-form-item>
      <el-form-item label-width="" >
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script>
import db from '@/database/index'

export default {
  data () {
    return {
      form: {
        operator: 'notIn',
        keywords: ['']
      }
    }
  },
  created () {
    this.getRule()
  },
  methods: {
    async getRule () {
      const rule = await db.nameRule.get('notIn')
      if (rule) {
        this.form = rule
      }
    },
    handleAddClick () {
      this.form.keywords.push('')
    },
    handleRemoveClick (index) {
      this.form.keywords.splice(index, 1)
    },
    async handleSubmit () {
      db.nameRule
        .put(this.form, 'notIn')
        .then(() => {
          this.dialogFormVisible = false
          this.$message.success('保存成功')
        })
        .catch(err => {
          this.$message.error(`錯誤：${err.message || err}`)
        })
    }
  }
}
</script>

<style lang="scss" scoped>
.page-form {
  width: 600px;
  .el-select, .el-input {
    width: 400px;
  }
}
</style>