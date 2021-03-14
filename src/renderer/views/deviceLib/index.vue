<template>
  <div class="app-container">
    <el-row style="margin-bottom: 20px;">
      <el-col :span="12">
        <el-select size="small" v-model="workplace" @change="handleQuery" placeholder="请选择工作地点">
          <el-option v-for="item in workplaceList" :label="item" :key="item" :value="item"></el-option>
        </el-select>
      </el-col>
      <el-col :span="12" style="text-align: right">
        <el-button
          type="primary"
          size="small"
          @click="$refs.editDialog.edit()"
          icon="el-icon-plus">
          新建
        </el-button>
        <el-upload
          class="upload"
          action=""
          :show-file-list="false"
          :before-upload="handleUpload">
          <el-button size="small">导入设备双编库</el-button>
        </el-upload>
      </el-col>
    </el-row>

    <el-table :data="tableData" v-loading.body="isLoading" element-loading-text="Loading" border fit highlight-current-row style="width: 100%;">
      <!-- <el-table-column align="center" label='序号' width="95" prop="index">
      </el-table-column> -->
      <el-table-column label="工作地点" width="120" prop="workplace">
      </el-table-column>
      <el-table-column label="设备标识牌名称" prop="deviceName">
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
import { workplaceList } from '@/utils/constant'
import EditDialog from './components/EditDialog'

export default {
  components: {
    EditDialog
  },
  data () {
    return {
      tableData: [],
      workplace: '500kV蝶岭站',
      workplaceList: Object.freeze(workplaceList),
      currentPage: 1,
      pagesize: 10,
      total: 0,
      isLoading: false
    }
  },
  filters: {
    statusFilter (status) {
      const statusMap = {
        published: 'success',
        draft: 'gray',
        deleted: 'danger'
      }
      return statusMap[status]
    }
  },
  created () {
    this.fetchTableData()
  },
  methods: {
    deleteRow (row) {
      this.$confirm(`确认要删除设备 ${row.deviceName} 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        db.device
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
      db.device
        .where('workplace')
        .equals(this.workplace)
        .count(num => {
          this.total = num
        })
      // 获取数据
      const data = await db.device
        .where('workplace')
        .equals(this.workplace)
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
    handleUpload (file) {
      const deviceSheets = xlsx.parse(file.path)
      // 插入数据库
      deviceSheets.forEach(workplace => {
        workplace.data.forEach(device => {
          if (device.length > 1) {
            db.device.add({
              workplace: workplace.name,
              deviceName: device[1]
            }).catch(error => {
              console.log('Error: ' + (error.stack || error))
            })
          }
        })
      })
      // 返回 false, 自行处理excel数据
      return false
    }
  }
}
</script>

<style lang="scss" scoped>
.upload {
  display: inline;
}
</style>
