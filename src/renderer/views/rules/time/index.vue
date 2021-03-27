<template>
  <el-card header="操作时间规则">
    <el-form class="page-form" :model="form" label-width="100px" size="small">
      <el-form-item label="规则说明：">
        操作开始时间至操作结束时间要满足设置的时长规则
      </el-form-item>
      <el-form-item label="校验逻辑：">
        <el-select v-model="form.operator">
          <el-option value="gt" label="要大于"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="时长：">
        <el-input placeholder="请输入时长" v-model="form.timeLength">
          <template slot="append">分钟</template>
        </el-input>
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
        operator: 'gt',
        timeLength: ''
      }
    }
  },
  created () {
    this.getRule()
  },
  methods: {
    async getRule () {
      const rule = await db.timeRule.get('gt')
      if (rule) {
        this.form = rule
      }
    },
    async handleSubmit () {
      const timeLength = this.form.timeLength
      if (!timeLength) {
        return this.$message.error('请输入时长')
      } else if (!(Number(timeLength) > 0)) {
        return this.$message.error('时长请输入大于零的数字')
      }

      db.timeRule
        .put(this.form, 'gt')
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