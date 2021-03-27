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
          <el-button size="small">导入动词库</el-button>
        </el-upload>
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
import db from '@/database/index'
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
        this.tableData = data
        this.isLoading = false
      }
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

      const verbSheets = xlsx.parse(file.path)
      // // 插入数据库
      verbSheets[0].data.forEach((item, index) => {
        if (index > 2 && item.length > 2) {
          db.verb.add({
            verb: item[1],
            nouns: item[2]
          }).catch(error => {
            this.$message.error('Error: ' + (error.stack || error))
          })
        }
      })

      this.$message.success('动词库导入成功')
      this.fetchTableData()
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
