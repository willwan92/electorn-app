<template>
  <div>
    <el-row>
      <el-col :span="16">
        <el-form :inline="true" size="small">
          <el-form-item>
            <el-input class="inline" v-model="verb" placeholder="请输入动词"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
          </el-form-item>
        </el-form>
      </el-col>
      <el-col :span="8" style="text-align: right">
        <el-upload
          class="upload"
          action=""
          :show-file-list="false"
          :before-upload="handleUpload">
          <el-button size="small" icon="el-icon-upload2">导入</el-button>
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
          @click="$refs.editDialog.edit()"
          icon="el-icon-plus">
          新建
        </el-button>
      </el-col>
    </el-row>

    <el-table :data="tableData" v-loading.body="isLoading" element-loading-text="Loading" border fit highlight-current-row style="width: 100%;">
      <!-- <el-table-column align="center" label='序号' width="95" prop="index">
      </el-table-column> -->
      <el-table-column label="动词" width="120" prop="verb">
      </el-table-column>
      <el-table-column label="对应设备" prop="nouns">
      </el-table-column>
      <el-table-column fixed="right"
        label="操作"
        width="150">
      <template slot-scope="scope">
        <el-button
          @click.native.prevent="$refs.editDialog.edit(scope.row)"
          type="primary"
          plain
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

    <edit-dialog ref="editDialog" @ok="fetchTableData" />
  </div>
</template>

<script>
import xlsx from 'node-xlsx'
import { remote } from 'electron'
import db from '@/database/index'
import { trimAllSpace, saveFile } from '@/utils/index'
import EditDialog from './components/EditDialog'

export default {
  components: {
    EditDialog
  },
  data () {
    return {
      tableData: [],
      verb: '',
      currentPage: 1,
      pagesize: 10,
      total: 0,
      isExporting: false,
      isLoading: false
    }
  },
  created () {
    this.fetchTableData()
  },
  methods: {
    deleteRow (row) {
      this.$confirm(`确认要删除动词搭配 ${row.verb} 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        db.verb
          .delete(row.id)
          .then(() => {
            this.$message.success('刪除成功')
            this.fetchTableData()
          })
          .catch(err => {
            console.log(err)
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
      db.verb
        .filter(item => {
          return item.verb.includes(this.verb)
        })
        .count(num => {
          this.total = num
        })
      // 获取数据
      const data = await db.verb
        .filter(item => {
          return item.verb.includes(this.verb)
        })
        .offset(this.pagesize * (this.currentPage - 1))
        .limit(this.pagesize)
        .toArray()
      if (data.length === 0 && this.currentPage > 1) {
        // 当前页无数据，自动回到上一页
        this.currentPage -= 1
        this.fetchTableData()
      } else {
        this.tableData = data.map(item => {
          item.nouns = item.nouns.join('、')
          return item
        })
        this.isLoading = false
      }
    },
    async handleExportClick () {
      this.isExporting = true
      let sheetData = await db.verb.toArray()
      sheetData = sheetData.map(item => [item.verb, item.nouns.join('、')])
      sheetData.unshift(['动词', '对应设备'])
      const options = {
        '!cols': [
          { wch: 20 },
          { wch: 60 }
        ]
      }
      const sheetBuffer = xlsx.build([{name: 'Sheet1', data: sheetData, options: options}])
      const desktop = remote.app.getPath('desktop')
      const checkTime = this.$moment(this.checkTime).format('yyyyMMDDHHmmss')
      saveFile({
        filePath: desktop,
        fileName: `动词库-${checkTime}`,
        fileType: 'xlsx',
        fileData: sheetBuffer,
        num: 0
      }).then(() => {
        this.$message.success('动词库已保存到桌面')
      }).catch(err => {
        this.$message.err(`错误：导出动词库出错（${err.message}）`)
      })
      this.isExporting = false
    },
    async handleUpload (file) {
      // 如果表中有数据，先清空
      await db.verb
        .count()
        .then(num => {
          if (num) {
            db.verb.clear()
          }
        })

      const verbData = xlsx.parse(file.path)[0].data
      let nouns
      let errVerbs = []
      let verbs = []
      let data = []
      let item
      for (let i = 1, len = verbData.length; i < len; i++) {
        item = verbData[i]
        if (typeof item[0] === 'string') {
          if (verbs.includes(item[0])) {
            errVerbs.push(item[0])
          } else {
            nouns = item[1] && trimAllSpace(item[1])
            data.push({
              verb: item[0],
              nouns: nouns ? nouns.split('、') : []
            })
          }
        } else {
          this.$message.error('错误：动词库格式错误，动词只能为汉字，请检查动词库')
          return false
        }
      }
      // 插入数据库
      if (errVerbs.length) {
        this.$message.error(`错误：${errVerbs.join('、')}等动词重复，重复的动词请合并成 1 条数据`)
      } else {
        db.verb.bulkAdd(data)
          .then(() => {
            this.$message.success('动词库导入成功')
            this.fetchTableData()
          })
          .catch(err => {
            this.$message.error(err)
          })
      }
      // 返回 false, 自行处理excel数据
      return false
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
