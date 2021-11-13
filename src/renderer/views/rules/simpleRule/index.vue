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
          size="small"
          @click="$router.push('/rules/simpleRuleEdit')"
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
      <el-table-column label="校验步骤" prop="step">
      </el-table-column>
      <el-table-column label="校验规则" prop="rules">
      </el-table-column>
      <el-table-column label="报错信息" prop="errorMsg">
      </el-table-column>
      <el-table-column fixed="right"
        label="操作"
        width="216">
      <template slot-scope="{ row }">
        <el-button
          @click.native.prevent="$router.push(`/rules/simpleRuleEdit?id=${row.id}`)"
          type="primary"
          plain
          size="mini">
          编辑
        </el-button>
        <el-button
          @click.native.prevent="handleCopyClick(row)"
          type="primary"
          plain
          size="mini">
          复制
        </el-button>
        <el-button
          @click.native.prevent="deleteRow(row)"
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
import { checkOperatorOptions, stepOptions } from '@/utils/constant'

export default {
  data () {
    return {
      stepOptions: Object.freeze(stepOptions),
      checkOperatorOptions: Object.freeze(checkOperatorOptions),
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
    async handleCopyClick (row) {
      const rule = await db.simpleRule.get(row.id)
      delete rule.id
      await db.simpleRule
        .add(rule)
        .then(() => {
          this.$message.success(`复制规则“${rule.name}”成功！`)
          this.fetchTableData()
        })
        .catch(err => {
          this.$message.error(`錯誤：${err.message || err}`)
        })
    },
    async toggleSelectRow (selection, row) {
      const isSelected = selection.includes(row)
      db.simpleRule
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
          db.simpleRule
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
      await db.simpleRule.clear()
      const rawdata = fs.readFileSync(file.path)
      const rules = JSON.parse(rawdata)
      if (Array.isArray(rules)) {
        const promises = rules.map(async rule => {
          delete rule.id
          await db.simpleRule
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
      let rules = await db.simpleRule.toArray()
      let data = JSON.stringify(rules, null, 2)
      const desktop = remote.app.getPath('desktop')
      const timestamp = this.$moment().format('yyyyMMDDHHmmss')
      fs.writeFile(`${desktop}/简单规则库-${timestamp}.json`, data, (err) => {
        if (err) throw err
        this.isExporting = false
        this.$message.success('规则库已经保存到桌面！')
      })
    },
    deleteRow (row) {
      this.$confirm(`确认要删除规则 ${row.name} 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        db.simpleRule
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
      db.simpleRule
        .filter(item => {
          return item.name.includes(this.name)
        })
        .count(num => {
          this.total = num
        })

      // 获取数据
      let data = await db.simpleRule
        .filter(item => {
          return item.name.includes(this.name)
        })
        .offset(this.pagesize * (this.currentPage - 1))
        .limit(this.pagesize)
        .toArray()

      data = data.map(rule => {
        // 校验规则
        let rules = ''
        rule.rules.forEach((item, index) => {
          if (index > 0) {
            rules += '且'
          }
          rules += checkOperatorOptions[item.operator]
          item.keywords.forEach((item, index) => {
            if (index === 0) {
              rules += ` “${item}” `
            } else {
              rules += ` 或 “${item}” `
            }
          })
          if (index !== rule.rules.length - 1) {
            rules += '，'
          }
        })
        rule.rules = rules
        rule.step = stepOptions[rule.step]
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
