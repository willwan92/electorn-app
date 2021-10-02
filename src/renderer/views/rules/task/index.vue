<template>
  <el-card>
    <div slot="header" class="clearfix">
      <span style="line-height: 32px;">操作任务名称规则</span>
      <span style="float: right;">
        <el-upload
          class="upload"
          action=""
          :show-file-list="false"
          :before-upload="handleUpload"
        >
          <el-button size="small" icon="el-icon-upload2">导入</el-button>
        </el-upload>
        <el-button
          :loading="isExporting"
          @click="handleExportClick"
          icon="el-icon-download"
        >
          {{ isExporting ? "正在导出" : "导出" }}
        </el-button>
      </span>
    </div>

    <el-form
      class="page-form"
      :model="form"
      ref="form"
      :inline="true"
      label-width="100px"
      size="small"
    >
      <el-form-item label="规则说明：">
        操作任务名称不可包含设置的关键字，否则报出设置的错误信息
      </el-form-item>
      <br />
      <el-form-item label="校验逻辑：">
        <el-select v-model="form.operator">
          <el-option value="notIn" label="不可包含"></el-option>
        </el-select>
      </el-form-item>
      <br />
      <div v-for="(item, index) in form.keywords" :key="index">
        <el-form-item
          :label="`关键字${index + 1}：`"
          :prop="`keywords.${index}.keyword`"
          :rules="{
            required: true,
            message: '请输入关键字',
            trigger: 'blur',
          }"
        >
          <el-input
            v-model="form.keywords[index].keyword"
            placeholder="请输入关键字"
          ></el-input>
        </el-form-item>
        <el-form-item
          :prop="`keywords.${index}.errorMsg`"
          :rules="{
            required: true,
            message: '请输入报错信息',
            trigger: 'blur',
          }"
        >
          <el-input
            v-model="form.keywords[index].errorMsg"
            placeholder="请输入报错信息"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="form.keywords[index].ignore"
            >忽略括号中内容</el-checkbox
          >
        </el-form-item>
        <el-form-item>
          <el-button
            v-if="index === 0"
            icon="el-icon-plus"
            @click="handleAddClick"
            circle
          ></el-button>
          <el-button
            v-else
            icon="el-icon-minus"
            @click="handleRemoveClick(index)"
            type="danger"
            circle
          ></el-button>
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
import fs from 'fs'
import { remote } from 'electron'

export default {
  data () {
    return {
      isImporting: false,
      isExporting: false,
      form: {
        operator: 'notIn',
        keywords: [
          {
            keyword: '',
            errorMsg: '任务名称错误',
            ignore: false,
          },
        ],
      },
    }
  },
  created () {
    this.getRule()
  },
  methods: {
    async handleUpload (file) {
      await db.nameRule.clear()
      const rawdata = fs.readFileSync(file.path)
      const rules = JSON.parse(rawdata)
      if (Array.isArray(rules)) {
        await db.nameRule
          .bulkAdd(rules)
          .catch(err => {
            this.$message.error(`錯誤：请检查规则库文件是否正确（${err.message || err}）`)
          })
        this.$message.success('任务名称规则库导出成功。')
        this.getRule()
      }
      // 返回false，自行处理
      return false
    },
    async handleExportClick () {
      this.isExporting = true
      let rules = await db.nameRule.toArray()
      let data = JSON.stringify(rules, null, 2)
      const desktop = remote.app.getPath('desktop')
      const timestamp = this.$moment().format('yyyyMMDDHHmmss')
      fs.writeFile(`${desktop}/任务名称规则库-${timestamp}.json`, data, (err) => {
        if (err) throw err
        this.isExporting = false
        this.$message.success('任务名称规则库已经保存到桌面！')
      })
    },
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
        ignore: false,
      })
    },
    handleRemoveClick (index) {
      this.form.keywords.splice(index, 1)
    },
    async handleSubmit () {
      this.$refs.form.validate((valid) => {
        if (!valid) return
        db.nameRule
          .put(this.form, 'notIn')
          .then(() => {
            this.dialogFormVisible = false
            this.$message.success('保存成功')
          })
          .catch((err) => {
            this.$message.error(`錯誤：${err.message || err}`)
          })
      })
    },
  },
}
</script>

<style lang="scss" scoped>
.upload {
  display: inline-block;
}
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