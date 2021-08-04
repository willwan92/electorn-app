<template>
  <div>
    <el-row>
      <el-col :span="18">
        <el-form :inline="true" size="small">
          <el-form-item>
            <el-select v-model="workplace" placeholder="请选择工作地点">
              <el-option v-for="item in workplaceList" :label="item" :key="item" :value="item"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-input class="inline" v-model="deviceName" placeholder="请输入设备名称"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
          </el-form-item>
        </el-form>
      </el-col>
      <el-col :span="6" style="text-align: right">
        <el-upload
          class="upload"
          action=""
          :show-file-list="false"
          :before-upload="handleUpload">
          <el-button size="small" icon="el-icon-upload2" :disabled="isUploading" :loading="isUploading">{{isUploading ? '正在导入' : '导入'}}</el-button>
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
      <el-table-column label="工作地点" width="120" prop="workplace">
      </el-table-column>
      <el-table-column label="设备标识牌名称" prop="deviceName">
      </el-table-column>
      <el-table-column label="间隔" prop="interval">
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
      workplace: '',
      deviceName: '',
      workplaceList: [],
      currentPage: 1,
      pagesize: 10,
      total: 0,
      isUploading: false,
      isLoading: false
    }
  },
  created () {
    this.getWorkplaceList()
    this.fetchTableData()
  },
  methods: {
    getWorkplaceList () {
      const workplaceList = localStorage.getItem('workplaceList')
      if (workplaceList) {
        this.workplaceList = JSON.parse(workplaceList)
        this.workplace = this.workplaceList[0]
      }
    },
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
        .filter(item => {
          return item.deviceName.includes(this.deviceName)
        })
        .count(num => {
          this.total = num
        })
      // 获取数据
      const data = await db.device
        .where('workplace')
        .equals(this.workplace)
        .filter(item => {
          return item.deviceName.includes(this.deviceName)
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
      this.isUploading = true
      localStorage.removeItem('workplaceList')
      await db.device.clear()
      const deviceSheets = xlsx.parse(file.path)
      let interval = ''
      let deviceName
      let data = []
      // 遍历不同工作地点表格，格式化双编设备数据
      const workplaceList = deviceSheets.map(workplace => {
        console.log(workplace)
        // 遍历表格中的设备
        workplace.data.forEach((device, index) => {
          // 从第五行开始
          if (index > 3 && device) {
            if (device.length > 2) {
              // 新的间隔
              interval = device[2]
            }
            // 一次设备
            if (device[1]) {
              deviceName = device[1].trim()
              deviceName && data.push({
                interval,
                workplace: workplace.name,
                deviceName: deviceName,
                deviceType: '1次设备'
              })
            }
            // 二次设备
            if (device[3]) {
              deviceName = device[3].trim()
              deviceName && data.push({
                interval,
                workplace: workplace.name,
                deviceName: deviceName,
                deviceType: '2次设备'
              })
            }
          }
        })
        return workplace.name
      })
      console.log(workplaceList)
      localStorage.setItem('workplaceList', JSON.stringify(workplaceList))
      this.getWorkplaceList()
      // 插入数据库
      await db.device
        .bulkAdd(data)
        .catch(error => {
          this.$message.error('错误：导入设备双编库失败，请重试。')
          console.log('Error: ' + (error.stack || error))
        })
      this.isUploading = false
      this.$message.success('设备双编库导入成功')
      this.fetchTableData()
      // 自行处理excel数据，所以返回 false
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
