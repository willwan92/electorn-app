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
      <el-table-column label="步骤筛选条件" prop="conditionsText">
      </el-table-column>
      <el-table-column label="校验步骤" prop="position">
      </el-table-column>
      <el-table-column label="校验逻辑" prop="operator">
      </el-table-column>
      <el-table-column label="校验关键字">
        <template slot-scope="scope">
          <div>
            <span v-for="(item, index) in scope.row.keywords" :key="item">
              <el-divider v-if="index > 0"  direction="vertical"></el-divider>
              {{ item }}
            </span>
          </div>
        </template>
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
import { operatorOptions, positionOptions, condOperatorOptions, condPosOptions } from '@/utils/constant'

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
      db.complexRule
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
          db.complexRule
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
      await db.complexRule.clear()
      const rawdata = fs.readFileSync(file.path)
      const rules = JSON.parse(rawdata)
      if (Array.isArray(rules)) {
        const promises = rules.map(async rule => {
          delete rule.id
          await db.complexRule
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
      let rules = await db.complexRule.toArray()
      let data = JSON.stringify(rules, null, 2)
      const desktop = remote.app.getPath('desktop')
      const timestamp = this.$moment().format('yyyyMMDDHHmmss')
      fs.writeFile(`${desktop}/复杂规则库-${timestamp}.json`, data, (err) => {
        if (err) throw err
        this.isExporting = false
        this.$message.success('规则库已经保存到桌面！')
      })
    },
    handleEditClick (row) {
      const query = row ? { id: row.id } : null
      this.$router.push({
        path: '/rules/complexRuleEdit',
        query
      })
    },
    deleteRow (row) {
      this.$confirm(`确认要删除规则 ${row.name} 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        db.complexRule
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
      db.complexRule
        .filter(item => {
          return item.name.includes(this.name)
        })
        .count(num => {
          this.total = num
        })

      // 获取数据
      let data = await db.complexRule
        .filter(item => {
          return item.name.includes(this.name)
        })
        .offset(this.pagesize * (this.currentPage - 1))
        .limit(this.pagesize)
        .toArray()

      data = data.map(rule => {
        let conditionsText = ''
        rule.operator = operatorOptions.find(item => {
          return item.value === rule.operator
        })['label']
        if (rule.position !== 'current' && rule.positionNum > 0) {
          rule.position = `${positionOptions[rule.position]}${rule.positionNum}步之内`
        } else {
          rule.position = positionOptions[rule.position]
        }

        // 步骤条件
        rule.conditions.forEach((item, index) => {
          if (index === 0) {
            conditionsText += condOperatorOptions[item.operator]
            conditionsText += item.keywords.join('或')
          } else {
            conditionsText += condPosOptions[item.position]
            if (item.position !== 'current') {
              conditionsText += `${item.positionNum}步之内`
            }
            conditionsText += condOperatorOptions[item.operator]
            conditionsText += item.keywords.join('或')
          }
          if (index !== rule.conditions.length - 1) {
            conditionsText += '，'
          }
        })
        rule.conditionsText = conditionsText
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
