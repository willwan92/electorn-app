// 专用复杂规则
<template>
  <div>
    <el-row>
      <el-col :span="12">
        <el-form :inline="true">
          <el-form-item>
            <el-input class="inline" v-model="name" placeholder="请输入规则名称"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
          </el-form-item>
        </el-form>
      </el-col>
      <el-col :span="12" style="text-align: right">
        <el-upload
          class="upload"
          action=""
          :show-file-list="false"
          :before-upload="handleImportClick">
          <el-button :loading="isImporting" icon="el-icon-upload2">
            {{ isImporting ? '正在导入' : '导入' }}
          </el-button>
        </el-upload>
        <el-button
          :loading="isExporting"
          @click="handleExportClick"
          icon="el-icon-download"
        >
          {{ isExporting ? '正在导出' : '导出' }}
        </el-button>
        <el-button
          type="primary"
          @click="handleEditClick"
          icon="el-icon-plus">
          新建
        </el-button>
      </el-col>
    </el-row>

    <el-table
      ref="multipleTable"
      :data="tableData"
      @select="toggleSelectRow"
      @select-all="toggleSelectAll"
      v-loading.body="isLoading"
      element-loading-text="Loading"
      border
      style="width: 100%;">
      <el-table-column type="selection" width="50" align="center">
      </el-table-column>
      <el-table-column label='规则名称' prop="name">
      </el-table-column>
      <el-table-column label="工作地点" prop="workplace">
      </el-table-column>
      <el-table-column label="任务名称条件" prop="taskConditions">
      </el-table-column>
      <el-table-column label="步骤筛选条件" prop="conditionsText">
      </el-table-column>
      <el-table-column label="校验规则" prop="rules">
      </el-table-column>
      <el-table-column label="报错信息" prop="errorMsg">
      </el-table-column>
      <el-table-column fixed="right"
        label="操作"
        width="150">
      <template slot-scope="scope">
        <el-button
          plain
          @click="handleEditClick(scope.row)"
          type="primary"
          size="mini">
          编辑
        </el-button>
        <el-button
          @click.native.prevent="deleteRow(scope.row)"
          type="danger"
          plain
          size="mini">
          删除
        </el-button>
      </template>
    </el-table-column>
    </el-table>
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="currentPage"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pagesize"
      :total="total"
      layout="total, sizes, prev, pager, next, jumper"
      style="margin-top: 10px;">
    </el-pagination>
  </div>
</template>

<script>
import db from '@/database/index'
import fs from 'fs'
import { remote } from 'electron'
import { positionOptions, condOperatorOptions, checkOperatorOptions, condPosOptions } from '@/utils/constant'
import { stringifyKeywords } from '@/utils/index'

export default {
  data () {
    return {
      tableData: [],
      name: '',
      currentPage: 1,
      pagesize: 10,
      total: 0,
      isImporting: false,
      isExporting: false,
      isLoading: false
    }
  },
  created () {
    this.handleQuery()
  },
  updated () {
    this.tableData.forEach(row => {
      row.enable && this.$refs.multipleTable.toggleRowSelection(row, true)
    })
  },
  methods: {
    async toggleSelectRow (selection, row) {
      const isSelected = selection.includes(row)
      db.specialComplexRule
        .update(row.id, { enable: isSelected })
        .then(() => {
          this.$message.success(`规则 ${row.name} ${isSelected ? '已启用' : '已禁用'}`)
        })
        .catch(err => {
          this.$message.error(`错误：${err.message}`)
        })
    },
    async toggleSelectAll (selection) {
      const isSelectAll = selection.length > 0
      const promises = await this.tableData.map(row => {
        if (row.enable !== isSelectAll) {
          db.specialComplexRule
            .update(row.id, { enable: isSelectAll })
            .catch(err => {
              this.$message.error(`错误：${err.message}`)
            })
        }
      })
      await Promise.all(promises)
      this.$message.success(`当前页规则已全部${isSelectAll ? '启用' : '禁用'}`)
    },
    async handleImportClick (file) {
      await db.specialComplexRule.clear()
      const rawdata = fs.readFileSync(file.path)
      const rules = JSON.parse(rawdata)
      if (Array.isArray(rules)) {
        const promises = rules.map(async rule => {
          delete rule.id
          await db.specialComplexRule
            .add(rule)
            .catch(err => {
              this.$message.error(`錯誤：${err.message || err}`)
            })
        })
        await Promise.all(promises)
        this.handleQuery()
      }
      // 返回false，自行处理
      return false
    },
    async handleExportClick () {
      this.isExporting = true
      let rules = await db.specialComplexRule.toArray()
      let data = JSON.stringify(rules, null, 2)
      const desktop = remote.app.getPath('desktop')
      const timestamp = this.$moment().format('yyyyMMDDHHmmss')
      fs.writeFile(`${desktop}/专用复杂规则库-${timestamp}.json`, data, (err) => {
        if (err) throw err
        this.isExporting = false
        this.$message.success('规则库已经保存到桌面！')
      })
    },
    handleEditClick (row) {
      const query = row ? { id: row.id } : null
      this.$router.push({
        path: '/specialRules/complexRuleEdit',
        query
      })
    },
    deleteRow (row) {
      this.$confirm(`确认要删除规则 ${row.name} 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        db.specialComplexRule
          .delete(row.id)
          .then(() => {
            this.$message.success('刪除成功')
            this.fetchTableData()
          })
          .catch(err => {
            this.$message.error(`錯誤：${err.message || err}`)
          })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        })
      })
    },
    handleSizeChange (value) {
      this.pagesize = value
      this.handleQuery()
    },
    handleCurrentChange (value) {
      this.currentPage = value
      this.fetchTableData()
    },
    handleQuery () {
      this.currentPage = 1
      this.fetchTableData()
    },
    async fetchTableData () {
      this.isLoading = true
      // 获取总条数
      db.specialComplexRule
        .filter(item => {
          return item.name.includes(this.name)
        })
        .count(num => {
          this.total = num
        })

      // 获取数据
      let data = await db.specialComplexRule
        .filter(item => {
          return item.name.includes(this.name)
        })
        .offset(this.pagesize * (this.currentPage - 1))
        .limit(this.pagesize)
        .toArray()

      data = data.map(rule => {
        rule.workplace = rule.workplace.length === 0 ? '所有站点' : rule.workplace.join('、')

        // 任务名称条件
        let taskConditions = ''
        rule.taskConditions.forEach((item, index) => {
          if (index > 0) {
            taskConditions += '且'
          }
          taskConditions += condOperatorOptions[item.operator]
          taskConditions += stringifyKeywords(item.keywords)
          if (index !== rule.taskConditions.length - 1) {
            taskConditions += '，'
          }
        })
        rule.taskConditions = taskConditions

        // 步骤条件
        let conditionsText = ''
        rule.conditions.forEach((item, index) => {
          if (index === 0) {
            conditionsText += condOperatorOptions[item.operator]
            conditionsText += stringifyKeywords(item.keywords)
          } else {
            conditionsText += condPosOptions[item.position]
            if (item.position !== 'current') {
              conditionsText += `${item.positionNum}步之内`
            }
            conditionsText += condOperatorOptions[item.operator]
            conditionsText += stringifyKeywords(item.keywords)
          }
          if (index !== rule.conditions.length - 1) {
            conditionsText += '，'
          }
        })
        rule.conditionsText = conditionsText

        // 校验规则
        let rulesText = ''
        rule.rules.forEach((item, index) => {
          rulesText += index === 0 ? positionOptions[item.position] : `且${positionOptions[item.position]}`
          if (item.positionNum) {
            rulesText += `${item.positionNum}步之内`
          }
          rulesText += checkOperatorOptions[item.operator]
          rulesText += stringifyKeywords(item.keywords)
          if (index !== rule.rules.length - 1) {
            rulesText += '，'
          }
        })
        rule.rules = rulesText

        return rule
      })
      if (data.length === 0 && this.currentPage > 1) {
        // 当前页无数据，自动回到上一页
        this.currentPage -= 1
        this.fetchTableData()
      } else {
        this.tableData = data
        this.isLoading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.upload {
  display: inline;
  margin-right: 10px;
}
</style>
