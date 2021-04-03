<template>
  <div>
    <el-card header="校核操作票" v-loading.lock="isUploading"  :element-loading-text="uploadingText">
      <el-form label-width="60px" size="small" :inline="true">
        <el-form-item label="操作票">
          <el-input v-model="operatingOrderFile" readonly="" style="width: 600px"></el-input>
        </el-form-item>
        <el-form-item>
          <el-upload
            class="upload"
            action=""
            :show-file-list="false"
            :before-upload="handleUpload">
            <el-button type="primary">选择操作票</el-button>
          </el-upload>
          <el-button type="primary" :disabled="!operatingOrderFile" @click="handleCheck">开始校核</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-card header="校核结果">
      <el-table :data="tableData" v-loading="isLoading" element-loading-text="Loading" border fit highlight-current-row style="width: 100%;">
        <el-table-column label="操作票号" prop="num">
        </el-table-column>
        <el-table-column label="操作任务" prop="taskName">
        </el-table-column>
        <el-table-column label="地点" prop="workplace">
        </el-table-column>
        <el-table-column label="操作顺序" prop="stepNum">
        </el-table-column>
        <el-table-column label="操作步骤" prop="step">
        </el-table-column>
        <el-table-column label="违反逻辑">
          <template slot-scope="scope">
            <span style="color: red">{{ scope.row.errorMsg }}</span>
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
    </el-card>
  </div>
</template>

<script>
import xlsx from 'node-xlsx'
import db from '@/database/index'
// import { stepOptions, operatorOptions } from '@/utils/constant'
import { strUtils } from '@/utils/check'

export default {
  name: 'home',
  data () {
    return {
      tableData: [],
      currentPage: 1,
      pagesize: 10,
      total: 0,
      operatingOrderFile: '',
      uploadingText: '加载中...',
      isUploading: false,
      isLoading: false,
      timeRule: null,
      nameRule: null,
      simpleRule: [],
    }
  },
  created () {
    this.operatingOrderFile = localStorage.getItem('operatingOrderFile')
    this.fetchTableData()
  },
  methods: {
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
      db.checkResult
        .count(num => {
          this.total = num
        })
      // 获取数据
      const data = await db.checkResult
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
    async handleCheck () {
      this.isUploading = true
      this.uploadingText = '正在校核...'
      db.checkResult.clear()
      this.timeRule = await db.timeRule.get('gt')
      this.nameRule = await db.nameRule.get('notIn')
      const operatingOrder = await db.operatingOrder.toArray()
      const promises = operatingOrder.map(async order => {
        await this.checkTime(order)
        await this.checkTaskName(order)
        await this.checkSteps(order)
      })
      await Promise.all(promises)
      this.handleQuery()
      this.isUploading = false
    },
    async validateRule ({ order, stepType, stepIndex, subIndex }) {
      let valid = false
      let keywords
      const hasSubIndex = subIndex !== undefined
      let step = hasSubIndex ? order.steps[stepIndex][subIndex] : order.steps[stepIndex]
      this.simpleRule = await db.simpleRule.toArray()
      this.simpleRule.filter(rule => {
        // 获取与步骤类型相同的规则
        return rule.step === stepType
      }).forEach(async rule => { // 遍历规则
        keywords = rule.keywords
        // 遍历规则中的关键字
        for (let i = 0, len = keywords.length; i < len; i++) {
          valid = strUtils[rule.operator](step, keywords[i])
          if (valid) {
            // 如果有符合一个关键字，跳出该循环
            break
          }
        }
        if (!valid) {
          // 如果所有关键字都不符合，将该步骤添加到校核结果中
          await this.addCheckResult({
            order,
            stepNum: hasSubIndex ? `${stepIndex + 1}.${subIndex + 1}` : stepIndex + 1,
            step: step,
            errorMsg: rule.errorMsg
          })
        }
      })
    },
    async checkSteps (order) {
      const promises = order.steps.map(async (step, index) => {
        if (index === 0) {
          // 第一步
          await this.validateRule({
            order,
            stepType: 'first',
            stepIndex: index
          })
          // 所有步骤
          await this.validateRule({
            order,
            stepType: 'all',
            stepIndex: index
          })
        } else if (Array.isArray(step)) {
          // 包含子步骤的步骤
          step.forEach(async (item, subIndex) => {
            if (subIndex === 0) {
              // 母步骤
              await this.validateRule({
                order,
                stepType: 'sub-first',
                stepIndex: index,
                subIndex: subIndex
              })
            } else if (index === (order.steps.length - 1) && subIndex === (step.length - 1)) {
              // 最后一步
              await this.validateRule({
                order,
                stepType: 'last',
                stepIndex: index,
                subIndex: subIndex
              })
            } else {
              // 其他步骤
              await this.validateRule({
                order,
                stepType: 'other',
                stepIndex: index,
                subIndex: subIndex
              })
            }
            // 所有步骤
            await this.validateRule({
              order,
              stepType: 'all',
              stepIndex: index,
              subIndex: subIndex
            })
          })
        } else if (index === (order.steps.length - 1)) {
          // 最后一步
          await this.validateRule({
            order,
            stepType: 'last',
            stepIndex: index
          })
          // 所有步骤
          await this.validateRule({
            order,
            stepType: 'all',
            stepIndex: index
          })
        } else {
          // 其他步骤
          await this.validateRule({
            order,
            stepType: 'other',
            stepIndex: index
          })
          // 所有步骤
          await this.validateRule({
            order,
            stepType: 'all',
            stepIndex: index
          })
        }
      })
      await Promise.all(promises)
    },
    addCheckResult ({ order, stepNum = '', step = '', errorMsg }) {
      db.checkResult.add({
        num: order.num,
        taskName: order.taskName,
        workplace: order.workplace,
        stepNum: stepNum,
        step: step,
        errorMsg: errorMsg
      }).catch(error => {
        console.log('Error: ' + (error.stack || error))
      })
    },
    async checkTaskName (order) {
      const keywords = this.nameRule.keywords
      for (let i = 0, len = keywords.length; i < len; i++) {
        if (order.taskName.includes(keywords[i].keyword)) {
          await this.addCheckResult({
            order,
            errorMsg: `通用逻辑：${keywords[i].errorMsg}`
          })
        }
      }
    },
    async checkTime (operatingOrder) {
      const timeLength = (new Date(operatingOrder.endTime) - new Date(operatingOrder.startTime)) / 60000
      if (timeLength <= this.timeRule.timeLength) {
        await db.checkResult.add({
          num: operatingOrder.num,
          taskName: operatingOrder.taskName,
          workplace: operatingOrder.workplace,
          stepNum: '',
          step: '',
          errorMsg: '通用逻辑：操作用时过短'
        }).catch(error => {
          console.log('Error: ' + (error.stack || error))
        })
      }
    },
    async handleUpload (file) {
      this.isUploading = true
      this.uploadingText = '正在导入操作票...'
      await db.operatingOrder.clear()
      this.operatingOrderFile = file.path
      localStorage.setItem('operatingOrderFile', file.path)
      const sheetsData = xlsx.parse(file.path)[0].data
      // 插入数据库
      let id, task, stepIndex, step, newId
      for (let i = 1, len = 100; i < len; i++) {
        step = sheetsData[i]
        if (step.length < 11) {
          continue
        }
        newId = step[0] + step[2]
        if (id !== newId) {
          db.operatingOrder.add(task).catch(error => {
            console.log('Error: ' + (error.stack || error))
          })
          id = newId
          task = {
            id: id,
            num: step[0],
            taskName: step[1],
            workplace: step[2],
            steps: [step[4]],
            startTime: step[5],
            endTime: step[6],
            unit: step[7],
            date: step[8],
            status: step[9],
            department: step[10],
          }
        } else {
          if (step[3].includes('.')) {
            // 子步骤
            stepIndex = Number(step[3].split('.')[0]) - 1
            if (Array.isArray(task.steps[stepIndex])) {
              task.steps[stepIndex].push(step[4])
            } else {
              task.steps[stepIndex] = [task.steps[stepIndex], step[4]]
            }
          } else {
            // 非子步骤
            task.steps.push(step[4])
          }
        }

        // 清空上次校核结果
        db.checkResult.clear()
      }
      this.isUploading = false
      this.$message.success('操作票导入成功')
      // 返回 false, 自行处理excel数据
      return false
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.upload {
  display: inline-block;
}
</style>
