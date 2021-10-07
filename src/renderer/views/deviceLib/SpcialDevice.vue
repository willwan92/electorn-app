<template>
  <div>
    <el-row>
      <el-col :span="16">
        <el-form :inline="true" size="small">
          <el-form-item>
            <el-input class="inline" v-model="deviceName" placeholder="请输入设备名称"></el-input>
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
          @click="$refs.editSpecialDevice.edit()"
          icon="el-icon-plus">
          新建
        </el-button>
      </el-col>
    </el-row>
    <p class="text-muted">说明：包含下列设备的操作步骤不检查双编设备</p>
    <el-table :data="tableData" v-loading.body="isLoading" element-loading-text="Loading" border fit highlight-current-row style="width: 100%;">
      <!-- <el-table-column align="center" label='序号' width="95" prop="index">
      </el-table-column> -->
      <el-table-column label="序号" width="120" prop="index">
      </el-table-column>
      <el-table-column label="设备名称" prop="deviceName">
      </el-table-column>
      <el-table-column fixed="right"
        label="操作"
        width="150">
      <template slot-scope="scope">
        <el-button
          @click.native.prevent="$refs.editSpecialDevice.edit(scope.row)"
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

    <edit-special-device ref="editSpecialDevice" @ok="fetchTableData" />
  </div>
</template>

<script>
import xlsx from 'node-xlsx'
import { remote } from 'electron'
import db from '@/database/index'
import { trimAllSpace, saveFile } from '@/utils/index'
import EditSpecialDevice from './components/EditSpecialDevice.vue'

export default {
  components: {
    EditSpecialDevice
  },
  data () {
    return {
      tableData: [],
      deviceName: '',
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
      this.$confirm(`确认要删除特殊设备 ${row.deviceName} 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        db.specialDevice
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
      db.specialDevice
        .filter(item => {
          return item.deviceName.includes(this.deviceName)
        })
        .count(num => {
          this.total = num
        })
      // 获取数据
      const data = await db.specialDevice
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
        this.tableData = data.map((item, index) => {
          item.index = index + 1
          return item
        })
        this.isLoading = false
      }
    },
    async handleExportClick () {
      this.isExporting = true
      let sheetData = await db.specialDevice.toArray()
      sheetData = sheetData.map(item => [item.deviceName])
      sheetData.unshift(['设备名称'])
      const options = {
        '!cols': [
          { wch: 20 }
        ]
      }
      const sheetBuffer = xlsx.build([{name: 'Sheet1', data: sheetData, options: options}])
      const desktop = remote.app.getPath('desktop')
      const checkTime = this.$moment(this.checkTime).format('yyyyMMDDHHmmss')
      saveFile({
        filePath: desktop,
        fileName: `特殊设备库-${checkTime}`,
        fileType: 'xlsx',
        fileData: sheetBuffer,
        num: 0
      }).then(() => {
        this.$message.success('特殊设备库已保存到桌面')
      }).catch(err => {
        this.$message.err(`错误：导出特殊设备库出错（${err.message}）`)
      })
      this.isExporting = false
    },
    async handleUpload (file) {
      // 如果表中有数据，先清空
      await db.specialDevice
        .count()
        .then(num => {
          if (num) {
            db.verb.clear()
          }
        })

      const sheetData = xlsx.parse(file.path)[0].data
      let item
      let repeatDevices = []
      let deviceList = []
      let deviceData = []
      // 除去表头，从第二行开始遍历
      for (let i = 1, len = sheetData.length; i < len; i++) {
        item = trimAllSpace(sheetData[i][0])
        if (!deviceList.includes(item)) {
          deviceList.push(item)
          deviceData.push({ deviceName: item })
        } else {
          repeatDevices.push(item)
        }
      }
      // 插入数据库
      if (repeatDevices.length) {
        this.$message.error(`错误：${repeatDevices.join('、')}等设备名称重复，请删除后重新上传！`)
      } else {
        db.specialDevice.bulkAdd(deviceData)
          .then(() => {
            this.$message.success('特殊设备库导入成功')
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

.text-muted {
  color: #ccc;
}
</style>
