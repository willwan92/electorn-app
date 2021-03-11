<template>
  <div class="app-container">
    <el-row style="margin-bottom: 20px;">
      <el-col :span="12">
        <el-select size="small" v-model="workpalce" placeholder="请选择工作地点">
          <el-option v-for="item in workpalceList" :label="item.label" :key="item.value" :value="item.value"></el-option>
        </el-select>
      </el-col>
      <el-col :span="12" style="text-align: right">
        <el-upload
          class="upload"
          action=""
          :before-upload="handleUpload">
          <el-button size="small">导入设备双编库</el-button>
        </el-upload>
      </el-col>
    </el-row>

    <el-table :data="list" v-loading.body="listLoading" element-loading-text="Loading" border fit highlight-current-row style="width: 100%;">
      <el-table-column align="center" label='序号' width="95" prop="index">
      </el-table-column>
      <el-table-column label="设备标识牌名称" prop="deviceName">
      </el-table-column>
      <el-table-column label="工作地点" width="120" prop="workplace">
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
// import xlsx from 'node-xlsx'
import { getDatabase } from '../../database/index'
import { getList } from '@/api/table'

export default {
  data () {
    return {
      list: [
        {
          index: 1,
          deviceName: '设备标识牌名称',
          workplace: '工作地点'
        }
      ],
      workpalce: '',
      workpalceList: '',
      listLoading: false
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
    console.log(getDatabase())
    // this.fetchData()
  },
  methods: {
    handleUpload (file) {
      // const deviceSheets = xlsx.parse(file.path)
      // console.log(deviceSheets)
      // // 插入数据库
      // deviceSheets.forEach(workplace => {
      //   workplace.forEach(device => {
      //     if (device.length > 1) {
      //       collections.device.insert({
      //         workplace: workplace.name,
      //         deviceName: device[2]
      //       })
      //     }
      //   })
      // })
      // 自行处理，不用上传
      return false
    },
    fetchData () {
      this.listLoading = true
      getList(this.listQuery).then(response => {
        this.list = response.data.items
        this.listLoading = false
      })
    }
  }
}
</script>
