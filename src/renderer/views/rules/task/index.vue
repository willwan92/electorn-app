<template>
  <el-card header="操作任务名称规则">
    <el-form class="page-form" :model="form" ref="form" :inline="true" label-width="100px" size="small">
      <el-form-item label="规则说明：">
        操作任务名称不可包含设置的关键字，否则报出设置的错误信息
      </el-form-item>
      <br>
      <el-form-item label="校验逻辑：">
        <el-select v-model="form.operator">
          <el-option value="notIn" label="不可包含"></el-option>
        </el-select>
      </el-form-item>
      <br>
      <div v-for="(item, index) in form.keywords" :key="index">
        <el-form-item
          :label="`关键字${index + 1}：`"
          :prop="`keywords.${index}.keyword`"
          :rules="{
            required: true, message: '请输入关键字', trigger: 'blur'
          }">
          <el-input v-model="form.keywords[index].keyword" placeholder="请输入关键字"></el-input>
        </el-form-item>
        <el-form-item
          :prop="`keywords.${index}.errorMsg`"
          :rules="{
            required: true, message: '请输入报错信息', trigger: 'blur'
          }">
          <el-input v-model="form.keywords[index].errorMsg" placeholder="请输入报错信息"></el-input>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="form.keywords[index].ignore">忽略括号中内容</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button v-if="index === 0" icon="el-icon-plus" @click="handleAddClick" circle></el-button>
          <el-button v-else icon="el-icon-minus" @click="handleRemoveClick(index)" type="danger" circle></el-button>
        </el-form-item>
      </div>
      <el-form-item label=" ">
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
        keywords: [{
          keyword: '',
          errorMsg: '任务名称错误',
          ignore: false
        }]
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
      this.form.keywords.push({
        keyword: '',
        errorMsg: '任务名称错误',
        ignore: false
      })
    },
    handleRemoveClick (index) {
      this.form.keywords.splice(index, 1)
    },
    async handleSubmit () {
      this.$refs.form.validate(valid => {
        if (!valid) return
        db.nameRule
          .put(this.form, 'notIn')
          .then(() => {
            this.dialogFormVisible = false
            this.$message.success('保存成功')
          })
          .catch(err => {
            this.$message.error(`錯誤：${err.message || err}`)
          })
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.page-form {
  width: 710px;
  .el-select {
    width: 200px;
  }
  .keywords {
    .line {
      text-align: center;
    }
    .button {
      text-align: right;
    }
  }
}
</style>