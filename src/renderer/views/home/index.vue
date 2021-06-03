<template>
  <div>
    <el-card class="check-card" header="检查操作票" v-loading.lock="isOperating"  :element-loading-text="operatingText">
      <el-form label-width="60px" size="small" :inline="true">
        <el-form-item label="操作票">
          <el-input v-model="operatingOrderFile" readonly="" style="width: 460px"></el-input>
        </el-form-item>
        <el-form-item>
          <el-upload
            class="upload"
            action=""
            :show-file-list="false"
            :before-upload="handleUpload">
            <el-button type="primary">选择操作票</el-button>
          </el-upload>
          <el-button type="primary" :disabled="!operatingOrderFile" @click="handleCheck">开始检查</el-button>
        </el-form-item>
      </el-form>
      <el-progress v-show="checkProgress < 100" class="progress-bar" :percentage="checkProgress"></el-progress>
    </el-card>
    
    <el-card>
      <div slot="header" class="clearfix">
        <span>检查历史: </span>
        <el-select
          v-model="checkTime"
          @change="handleCheckTimeChange"
          placeholder="请选择历史检查时间">
          <el-option
            v-for="item in checkTimeOptions"
            :key="item"
            :label="item"
            :value="item">
          </el-option>
        </el-select>
        <span style="float: right;">
          <el-button
            :loading="isExporting"
            :disabled="!checkTime"
            @click="handleExportClick"
            type="primary"
            icon="el-icon-download"
          >
            {{ isExporting ? '正在导出' : '导出' }}
          </el-button>
        </span>
      </div>
      <p v-show="!isLoading" style="margin-top: 0;">
        概览：本次一共检查了<span class="red">{{ operatingOrderAmount }}</span>张操作票，
        共有<span class="red">{{ stepAmount }}</span>个操作步骤，
        其中一共有<span class="red">{{ total }}</span>处错误。
      </p>
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
import fs from 'fs'
import { remote } from 'electron'
import db from '@/database/index'
import { strUtils } from '@/utils/check'
import { trimAllSpace } from '@/utils/index'

export default {
  name: 'home',
  data () {
    return {
      checkTime: '',
      checkTimeOptions: [],
      tableData: [],
      currentPage: 1,
      pagesize: 10,
      total: 0,
      operatingOrderFile: '',
      operatingOrderAmount: 0,
      stepAmount: 0,
      newOperatingOrderAmount: 0,
      newStepAmount: 0,
      operatingText: '加载中...',
      isOperating: false,
      isLoading: false,
      isExporting: false,
      timeRule: null,
      nameRule: null,
      simpleRule: [],
      complexRule: [],
      specialSimpleRule: [],
      verbs: [],
      workplace: '',
      taskName: '',
      intervalList: [],
      deviceList: [],
      checkResult: [],
      prevStep: '',
      checkProgress: 100
    }
  },
  async created () {
    this.operatingOrderFile = localStorage.getItem('operatingOrderFile')
    await this.getCheckTimeOptions()
    this.handleCheckTimeChange()
  },
  methods: {
    handleCheckTimeChange () {
      this.getCheckResultSummary()
      this.handleQuery()
    },
    async getCheckResultSummary () {
      if (!this.checkTime) return
      const checkResultSummary = await db.checkResultSummary
        .where('checkTime')
        .equals(this.checkTime)
        .toArray()
      this.stepAmount = checkResultSummary[0].stepAmount
      this.operatingOrderAmount = checkResultSummary[0].operatingOrderAmount
    },
    async getCheckTimeOptions () {
      const checkResultSummary = await db.checkResultSummary.reverse().toArray()
      if (checkResultSummary.length) {
        this.checkTimeOptions = checkResultSummary.map(item => item.checkTime)
        this.checkTime = this.checkTimeOptions[0]
      }
    },
    async handleExportClick () {
      this.isExporting = true
      const data = await db.checkResult
        .where('checkTime')
        .equals(this.checkTime)
        .sortBy('num')
      let sheetData = data.map(item => {
        return [
          item.num,
          item.taskName,
          item.workplace,
          item.stepNum,
          item.step,
          item.errorMsg
        ]
      })
      sheetData.unshift(['操作票号', '操作任务', '地点', '操作顺序', '操作步骤', '错误信息'])
      // 定义列宽
      const options = {
        '!cols': [
          { wch: 10 },
          { wch: 40 },
          { wch: 15 },
          { wch: 10 },
          { wch: 40 },
          { wch: 50 }
        ]
      }
      const sheetBuffer = xlsx.build([{name: `操作票检查结果-${this.checkTime}`, data: sheetData, options: options}])
      const desktop = remote.app.getPath('desktop')
      const checkTime = this.$moment(this.checkTime).format('yyyyMMDDHHmmss')
      this.saveFile({
        filePath: desktop,
        fileName: `操作票检查结果-${checkTime}`,
        fileType: 'xlsx',
        fileData: sheetBuffer,
        num: 0
      })
      this.isExporting = false
    },
    saveFile ({ filePath, fileName, fileType, fileData, num = 0 }) {
      const fullPath = num ? `${filePath}/${fileName}(${num}).${fileType}` : `${filePath}/${fileName}.${fileType}`
      fs.writeFile(fullPath, fileData, { flag: 'ax' }, (err) => {
        if (!err) {
          this.$message.success(`${fileName} 已经保存到桌面！`)
        } else {
          if (err.code === 'EEXIST') {
            this.saveFile({ filePath, fileName, fileType, fileData, num: num + 1 })
          } else {
            this.$message.error(err)
          }
        }
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
      if (!this.checkTime) return
      this.isLoading = true
      // 获取总条数
      db.checkResult
        .where('checkTime')
        .equals(this.checkTime)
        .count(num => {
          this.total = num
        })
      // 获取数据
      const data = await db.checkResult
        .where('checkTime')
        .equals(this.checkTime)
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
    async getDeviceList (order) {
      const workplace = order.workplace
      if (workplace !== this.workplace) {
        this.deviceList = await db.device
          .where('workplace')
          .equals(workplace)
          .toArray()
        this.workplace = workplace
      }
    },
    async handleCheck () {
      this.isOperating = true
      this.operatingText = '正在检查...'
      this.checkResult = []
      this.checkProgress = 0
      this.newStepAmount = 0
      this.newCheckTime = this.$moment().format('yyyy-MM-DD HH:mm:ss')
      // 获取所有规则
      this.timeRule = await db.timeRule.get('gt')
      this.nameRule = await db.nameRule.get('notIn')
      this.simpleRule = await db.simpleRule.toArray()
      this.complexRule = await db.complexRule.filter((rule) => rule.enable).toArray()
      this.specialSimpleRule = await db.specialSimpleRule.filter(rule => rule.enable).toArray()
      this.specialComplexRule = await db.specialComplexRule.filter(rule => rule.enable).toArray()
      this.verbs = Object.freeze(await db.verb.toArray())
      this.checkProgress = 5
      const operatingOrder = await db.operatingOrder.toArray()
      this.checkProgress = 10
      // 遍历所有操作票
      const total = operatingOrder.length
      const promises = operatingOrder.map(async (order, index) => {
        this.checkTimeLength(order)
        this.checkTaskName(order)
        this.validateSpecialRule(order)
        this.validateSpecialComplexRule(order)
        await this.getDeviceList(order)
        await this.checkSteps(order)
        this.checkProgress = Math.floor((index + 1) / total * 90) + 10
      })
      await Promise.all(promises)
      await db.checkResult
        .bulkAdd(this.checkResult)
        .catch(() => {
          this.$message.error('操作票导入失败，请重试')
        })
      this.checkProgress = 100
      this.isOperating = false
      this.checkTimeOptions.unshift(this.newCheckTime)
      this.checkTime = this.newCheckTime
      this.newOperatingOrderAmount = operatingOrder.length
      // 添加本次检查概要
      await db.checkResultSummary.add({
        checkTime: this.newCheckTime,
        stepAmount: this.newStepAmount,
        operatingOrderAmount: this.newOperatingOrderAmount
      })
      this.handleCheckTimeChange()

      // 保留30次检查结果（放在检查之后，减少检查耗时）
      const checkResultSummary = await db.checkResultSummary.toArray()
      if (checkResultSummary.length > 30) {
        const firstTime = checkResultSummary[0]
        const firstTimeResult = await db
          .checkResult
          .where('checkTime')
          .equals(firstTime.checkTime)
          .toArray()
        const firstTimeResultIdList = firstTimeResult.map(item => item.id)
        db.checkResult.bulkDelete(firstTimeResultIdList)
        db.checkResultSummary.delete(firstTime.id)
        this.checkTimeOptions.splice(-1, 1)
      }
    },
    /**
     * 校验字符串中是否符合关键字条件
     * @param step { String } 目标字符串
     * @param operator { String } 校验逻辑
     * @param keywords { String[] } 要校验的关键字
     */
    validateStr (step, operator, keywords) {
      if (!step) return true
      let valid = false
      const isNotIn = operator === 'notIn'
      const validate = strUtils[operator]
      // 遍历关键字
      for (let i = 0, len = keywords.length; i < len; i++) {
        valid = validate(step, keywords[i])
        if (isNotIn) {
          // 如果校验逻辑是不包含，不符合一个关键字则跳出循环（违反规则）
          if (!valid) break
        } else {
          // 如果校验逻辑不是不包含，符合一个关键字则跳出循环（符合规则）
          if (valid) break
        }
      }
      return valid
    },
    /**
     * 校验步骤是否符合指定条件
     */
    validateCondition (condition, order, stepIndex, subIndex) {
      let isMatched = true
      let targetStep
      let step
      if (condition.position === 'current') {
        // 检查当前步骤的
        step = subIndex === undefined ? order.steps[stepIndex] : order.steps[stepIndex][subIndex]
        isMatched = this.validateStr(step, condition.operator, condition.keywords)
      } else if (condition.position === 'before') {
        // 检查当前步骤之前步骤的
        let len = Number(condition.positionNum)
        if (len > 0) {
          // 之前的指定几步
          if (condition.stepType === 'notChild') {
            // 遍历指定的步骤
            let min = stepIndex - len
            // 防止用户指定的超出
            min = min < 0 ? 0 : min
            for (let i = stepIndex - 1; i >= min; i--) {
              targetStep = order.steps[i]
              // 如果是包含子步骤的步骤，跳过
              if (Array.isArray(targetStep)) continue
              isMatched = this.validateStr(targetStep, condition.operator, condition.keywords)
              // 如果步骤中有一个符合条件，终止循环
              if (isMatched) break
            }
          } else if (condition.stepType === 'child' && subIndex) {
            // 遍历指定的步骤
            let min = subIndex - len
            // 防止用户指定的超出
            min = min < 0 ? 0 : min
            for (let i = subIndex - 1; i >= min; i--) {
              targetStep = order.steps[stepIndex][i]
              isMatched = this.validateStr(targetStep, condition.operator, condition.keywords)
              // 如果步骤中有一个符合条件，终止循环
              if (isMatched) break
            }
          }
        } else if (len === 0) {
          // 之前所有步骤
          if (condition.stepType === 'notChild') {
            // 遍历指定的步骤
            for (let i = stepIndex - 1; i >= 0; i--) {
              targetStep = order.steps[i]
              if (Array.isArray(targetStep)) continue
              isMatched = this.validateStr(targetStep, condition.operator, condition.keywords)
              // 如果步骤中有一个符合条件，终止循环
              if (isMatched) break
            }
          } else if (condition.stepType === 'child' && subIndex) {
            // 遍历指定的步骤
            for (let i = subIndex - 1; i >= 0; i--) {
              targetStep = order.steps[stepIndex][i]
              isMatched = this.validateStr(targetStep, condition.operator, condition.keywords)
              // 如果步骤中有一个符合条件，终止循环
              if (isMatched) break
            }
          }
        }
      } else if (condition.position === 'after') {
        // 检查当前步骤之后步骤的
        let len = Number(condition.positionNum)
        if (len > 0) {
          // 之后的指定几步
          if (condition.stepType === 'notChild') {
            const length = order.steps.length
            let max = stepIndex + len + 1
            // 防止用户指定的超出
            max = max > length ? length : max
            // 遍历指定的步骤
            for (let i = stepIndex + 1; i < max; i++) {
              targetStep = order.steps[i]
              if (Array.isArray(targetStep)) continue
              isMatched = this.validateStr(targetStep, condition.operator, condition.keywords)
              // 如果步骤中有一个符合条件，终止循环
              if (isMatched) break
            }
          } else if (condition.stepType === 'child' && subIndex) {
            // 遍历指定的步骤
            const length = order.steps[stepIndex].length
            let max = subIndex + len + 1
            // 防止用户指定的超出
            max = max > length ? length : max
            // 遍历指定的步骤
            for (let i = subIndex + 1; i < max; i++) {
              targetStep = order.steps[stepIndex][i]
              isMatched = this.validateStr(targetStep, condition.operator, condition.keywords)
              // 如果步骤中有一个符合条件，终止循环
              if (isMatched) break
            }
          }
        } else if (len === 0) {
          // 之后所有步骤
          if (condition.stepType === 'notChild') {
            // 遍历指定的步骤
            for (let i = stepIndex + 1, max = order.steps.length; i < max; i++) {
              targetStep = order.steps[i]
              if (Array.isArray(targetStep)) continue
              isMatched = this.validateStr(targetStep, condition.operator, condition.keywords)
              // 如果步骤中有一个符合条件，终止循环
              if (isMatched) break
            }
          } else if (condition.stepType === 'child' && subIndex) {
            // 遍历指定的步骤
            for (let i = subIndex + 1, max = order.steps[stepIndex].length; i < max; i++) {
              targetStep = order.steps[stepIndex][i]
              isMatched = this.validateStr(targetStep, condition.operator, condition.keywords)
              // 如果步骤中有一个符合条件，终止循环
              if (isMatched) break
            }
          }
        }
      }
      return isMatched
    },
    /**
     * 校验复杂规则
     */
    validateComplexRule ({ order, rule, stepIndex, subIndex = undefined }) {
      // 遍历规则中所有条件
      let stepNum
      let step
      let isMatched = true
      let condition
      for (let cIndex = 0, len = rule.conditions.length; cIndex < len; cIndex++) {
        condition = rule.conditions[cIndex]
        isMatched = this.validateCondition(condition, order, stepIndex, subIndex)
        // 不满足条件，跳出循环
        if (!isMatched) break
        // 记录符合第一个条件的步骤号
        if (cIndex === 0) {
          if (subIndex === undefined) {
            step = order.steps[stepIndex]
            stepNum = `${stepIndex + 1}`
          } else {
            step = order.steps[stepIndex][subIndex]
            stepNum = subIndex > 0 ? `${stepIndex + 1}.${subIndex}` : `${stepIndex + 1}`
          }
        }
      }
      if (isMatched) {
        // 满足所有条件，执行校验规则
        if (!this.validateCondition(rule, order, stepIndex, subIndex)) {
          const errorMsg = rule.taskCondition ? `专用规则：${rule.errorMsg}` : `通用规则：${rule.errorMsg}`
          this.addCheckResult({
            order,
            stepNum,
            step,
            errorMsg
          })
        }
      }
    },
    /**
     * 遍历步骤复杂规则
     */
    traverseComplexRule ({ order, stepIndex, subIndex = undefined }) {
      const rules = this.complexRule
      // 遍历所有规则
      rules.forEach(async rule => {
        this.validateComplexRule({ order, rule, stepIndex, subIndex })
      })
    },
    /**
     * 校验步骤简单规则
     */
    validateRule ({ order, stepType, step, stepNum }) {
      let valid = false
      const rules = this.simpleRule.filter(rule => {
        // 获取与步骤类型相同的规则
        return rule.enable && rule.step === stepType
      })

      rules.forEach(rule => { // 遍历规则
        // 遍历规则中的关键字
        valid = this.validateStr(step, rule.operator, rule.keywords)
        if (!valid) {
          // 如果不符合规则，将该步骤添加检查结果中
          this.addCheckResult({
            order,
            stepNum,
            step,
            errorMsg: `通用规则：${rule.errorMsg}`
          })
        }
      })
    },
    /**
     * 校验专用复杂规则
     */
    validateSpecialComplexRule (order) {
      const rules = this.specialComplexRule
      // 遍历专用复杂规则
      rules.forEach(rule => {
        const taskKeywords = rule.taskCondition.keywords
        const isMatched = this.validateStr(order.taskName, rule.taskCondition.operator, taskKeywords)
        const isMatchedWorkplace = rule.workplace.length > 0 ? rule.workplace.includes(order.workplace) : true
        if (isMatched && isMatchedWorkplace) {
          // 任务符合规则的任务条件和工作站点
          // 遍历操作票中的步骤
          order.steps.forEach((step, stepIndex) => {
            if (!Array.isArray(step)) {
              this.validateComplexRule({ order, rule, stepIndex })
            } else {
              step.forEach((subStep, subIndex) => {
                this.validateComplexRule({ order, rule, stepIndex, subIndex })
              })
            }
          })
        }
      })
    },
    /**
     * 校验专用简单规则
     */
    validateSpecialRule (order) {
      const rules = this.specialSimpleRule
      // 遍历规则
      rules.forEach(rule => {
        const taskKeywords = rule.taskCondition.keywords
        const isMatched = this.validateStr(order.taskName, rule.taskCondition.operator, taskKeywords)
        const isMatchedWorkplace = rule.workplace.length > 0 ? rule.workplace.includes(order.workplace) : true
        if (isMatched && isMatchedWorkplace) {
          // 任务符合规则的任务条件和工作站点
          const operator = rule.operator
          const keywords = rule.keywords
          const steps = order.steps
          const isIn = operator === 'in'
          let step
          let stepNum = ''
          let stepTmp = ''
          let valid = false
          // 遍历操作票所有步骤
          for (let idx = 0, len = steps.length; idx < len; idx++) {
            step = steps[idx]
            stepTmp = step
            if (!Array.isArray(step)) {
              // 非子步骤
              valid = this.validateStr(step, operator, keywords)
              if (isIn) {
                // 如果校验逻辑是包含，有一个步骤符合关键字条件则跳出循环（符合规则）
                if (valid) break
              } else {
                // 如果校验逻辑不是包含，需要遍历所有步骤
                if (!valid) {
                  stepNum = `${idx + 1}`
                  this.addCheckResult({
                    order,
                    stepNum,
                    step: stepNum ? stepTmp : '',
                    errorMsg: `专用规则：${rule.errorMsg}`
                  })
                }
                // 合法性需要重置为True
                valid = true
              }
            } else {
              let subStep
              for (let subIdx = 0, len = step.length; subIdx < len; subIdx++) {
                // 子步骤
                subStep = step[subIdx]
                stepTmp = subStep
                valid = this.validateStr(subStep, operator, keywords)
                if (isIn) {
                  // 如果校验逻辑是包含，有一个步骤符合关键字条件则跳出循环（符合规则）
                  if (valid) break
                } else {
                  // 如果校验逻辑不是包含，需要遍历所有步骤
                  if (!valid) {
                    stepNum = subIdx > 0 ? `${idx + 1}.${subIdx}` : `${idx + 1}`
                    this.addCheckResult({
                      order,
                      stepNum,
                      step: stepNum ? stepTmp : '',
                      errorMsg: `专用规则：${rule.errorMsg}`
                    })
                  }
                  // 合法性需要重置为True
                  valid = true
                }
              }
            }
          }
          // 校验逻辑是包含时
          if (!valid) {
            this.addCheckResult({
              order,
              stepNum,
              step: stepNum ? stepTmp : '',
              errorMsg: `专用规则：${rule.errorMsg}`
            })
          }
        }
      })
    },
    async validateCommonRule ({ order, stepIndex, subIndex = undefined }) {
      let step
      let stepNum
      if (subIndex === undefined) {
        // 非子步骤
        step = order.steps[stepIndex]
        stepNum = `${stepIndex + 1}`
        this.checkDevice({
          order,
          step,
          stepNum
        })
        this.validateRule({
          order,
          step,
          stepNum,
          stepType: 'all'
        })
        this.traverseComplexRule({
          order,
          stepIndex
        })
      } else {
        // 子步骤
        step = order.steps[stepIndex][subIndex]
        stepNum = subIndex > 0 ? `${stepIndex + 1}.${subIndex}` : `${stepIndex + 1}`
        this.checkDevice({
          order,
          step,
          stepNum
        })
        this.validateRule({
          order,
          step,
          stepNum,
          stepType: 'all'
        })
        this.traverseComplexRule({
          order,
          stepIndex,
          subIndex
        })
      }
      this.checkVerb({
        order,
        step,
        stepNum
      })

      // 验证步骤是否重复
      if (step === this.prevStep) {
        this.addCheckResult({
          order,
          step,
          stepNum,
          errorMsg: '通用规则：操作步骤重复'
        })
      }
      this.prevStep = step
    },
    /**
     * 检查动词搭配
     */
    checkVerb ({ order, step, stepNum }) {
      const verbs = this.verbs
      if (!verbs.length) return
      const startsWith = strUtils['startsWith']
      const includes = strUtils['in']
      let verb
      let nouns
      let verbValid = false
      let nounValid = false
      for (let i = 0, len = verbs.length; i < len; i++) {
        verb = verbs[i]
        verbValid = startsWith(step, verb.verb)
        if (verbValid) {
          nouns = verb.nouns
          // 如果有对应搭配
          if (nouns.length) {
            for (let i = 0, len = nouns.length; i < len; i++) {
              nounValid = includes(step, nouns[i])
              if (nounValid) break
            }
            if (!nounValid) {
              this.addCheckResult({
                order,
                step,
                stepNum,
                errorMsg: '通用规则：动词和设备不一致'
              })
            }
          }
          break
        }
      }
      if (!verbValid) {
        this.addCheckResult({
          order,
          step,
          stepNum,
          errorMsg: '通用规则：动词错误'
        })
      }
    },
    /**
     * 校验步骤中是否包含对应的双编设备
     */
    validateDevice (step, deviceList) {
      let isIncluded = false
      let deviceName
      let newStep = trimAllSpace(step)
      // 遍历所有双编设备
      if (!deviceList.length) return
      for (let i = 0, len = deviceList.length; i < len; i++) {
        deviceName = trimAllSpace(deviceList[i].deviceName)
        isIncluded = newStep.includes(deviceName)
        if (isIncluded) break
      }
      return isIncluded
    },
    /**
     * 检查双编设备
     */
    checkDevice ({ order, stepNum, step }) {
      // 规则1：如果某一步骤中包含kV ，那么此步骤必须包含所属（工作地点）的（双编）
      if (!step.includes('kV')) return
      if (!this.validateDevice(step, this.deviceList)) {
        // 步骤中不包含该工作地点的任意双编设备，将该步骤添加检查结果中
        this.addCheckResult({
          order,
          stepNum,
          step,
          errorMsg: '通用规则：双编错误'
        })
      }

      // 规则2：如果某一步骤中包含kV ，且操作任务中包含所属工作地点的某一个/几个间隔，那么此步骤必须包含上述间隔对应的（双编）
      // 获取操作步骤的任务名和任务名包含的间隔
      let interval
      let intervalList = []
      if (this.taskName !== order.taskName) {
        const taskName = order.taskName
        this.taskName = taskName
        this.deviceList.forEach(item => {
          interval = trimAllSpace(item.interval)
          if (taskName.includes(interval) && !intervalList.includes(interval)) {
            intervalList.push(interval)
          }
        })
      }
      this.intervalList = intervalList
      // 遍历间隔，检查步骤中是否包含对应间隔的双编设备
      if (!intervalList.length) return
      let valid = false
      let deviceList
      for (let i = 0, len = intervalList.length; i < len; i++) {
        deviceList = this.deviceList.filter(item => item.interval === intervalList[i])
        valid = this.validateDevice(step, deviceList)
        if (valid) break
      }
      if (!valid) {
        this.addCheckResult({
          order,
          stepNum,
          step,
          errorMsg: '通用规则：双编间隔错误'
        })
      }
    },
    async checkSteps (order) {
      const promises = order.steps.map(async (step, stepIndex) => {
        if (!Array.isArray(step)) {
          // 统计步骤数
          this.newStepAmount += 1
          let stepNum = `${stepIndex + 1}`
          if (stepIndex === 0) {
            // 第一步
            this.validateRule({
              order,
              step,
              stepNum,
              stepType: 'first'
            })
          } else if (stepIndex === (order.steps.length - 1)) {
            // 最后一步
            this.validateRule({
              order,
              step,
              stepNum,
              stepType: 'last'
            })
          } else {
            // 其他步骤
            this.validateRule({
              order,
              step,
              stepNum,
              stepType: 'other'
            })
          }
          // 所有步骤
          await this.validateCommonRule({
            order,
            stepIndex
          })
        } else {
          // 包含子步骤的步骤
          step.forEach(async (subStep, subIndex) => {
            let stepNum = subIndex > 0 ? `${stepIndex + 1}.${subIndex}` : `${stepIndex + 1}`
            if (subIndex === 0) {
              // 母步骤
              this.validateRule({
                order,
                stepNum,
                step: subStep,
                stepType: 'sub-first'
              })
            } else if (stepIndex === (order.steps.length - 1) && subIndex === (step.length - 1)) {
              // 最后一步
              this.validateRule({
                order,
                stepNum,
                step: subStep,
                stepType: 'last'
              })
            } else {
              // 其他步骤
              this.validateRule({
                order,
                stepNum,
                step: subStep,
                stepType: 'other'
              })
            }
            // 统计步骤数
            this.newStepAmount += 1
            // 所有步骤
            await this.validateCommonRule({
              order,
              subIndex,
              stepIndex
            })
          })
        }
      })
      await Promise.all(promises)
    },
    addCheckResult ({ order, stepNum = '', step = '', errorMsg }) {
      this.checkResult.push({
        checkTime: this.newCheckTime,
        num: order.num,
        taskName: order.taskName,
        workplace: order.workplace,
        stepNum: stepNum,
        step: step,
        errorMsg: errorMsg
      })
    },
    checkTaskName (order) {
      if (!this.nameRule) return
      const keywords = this.nameRule.keywords
      let taskName = order.taskName
      for (let i = 0, len = keywords.length; i < len; i++) {
        if (keywords[i].ignore) {
          taskName = taskName.replace(/[(（].*[）)]/, '')
        }
        if (taskName.includes(keywords[i].keyword)) {
          this.addCheckResult({
            order,
            errorMsg: `通用规则：${keywords[i].errorMsg}`
          })
        }
      }
    },
    checkTimeLength (order) {
      if (!this.timeRule) return
      const timeLength = (new Date(order.endTime) - new Date(order.startTime)) / 60000
      if (timeLength < this.timeRule.timeLength) {
        this.addCheckResult({
          order,
          stepNum: '',
          step: '',
          errorMsg: '通用规则：操作用时过短'
        })
      }
    },
    async handleUpload (file) {
      this.isOperating = true
      this.operatingText = '正在导入操作票...'
      await db.operatingOrder.clear()
      this.operatingOrderFile = file.path
      localStorage.setItem('operatingOrderFile', file.path)
      const sheetsData = xlsx.parse(file.path)[0].data
      // 插入数据库
      let id, task, stepNum, stepIndex, subIndex, step, newId
      let taskList = []
      // 遍历所有操作步骤
      for (let i = 1, len = sheetsData.length; i < len; i++) {
        step = sheetsData[i]
        if (step.length < 7) {
          continue
        }
        newId = step[0] + step[2]
        if (id !== newId) {
          // 不属于当前操作任务的步骤，把当前操作任务添加到任务列表
          task && taskList.push(task)

          // 新的操作任务
          id = newId
          task = {
            id: id,
            num: step[0],
            taskName: trimAllSpace(step[1]),
            workplace: step[2],
            steps: [step[4]],
            startTime: step[5],
            endTime: step[6],
          }
        } else {
          // 属于当前操作任务的步骤
          stepNum = step[3].split('.')
          stepIndex = Number(stepNum[0]) - 1
          if (stepNum[1]) {
            // 子步骤
            subIndex = Number(stepNum[1])
            if (Array.isArray(task.steps[stepIndex])) {
              task.steps[stepIndex][subIndex] = step[4]
            } else {
              task.steps[stepIndex] = [task.steps[stepIndex]]
              task.steps[stepIndex][subIndex] = step[4]
            }
          } else {
            // 非子步骤
            task.steps[stepIndex] = step[4]
          }
        }
      }
      // 把最后一个任务添加到任务列表
      taskList.push(task)
      await db.operatingOrder.bulkAdd(taskList).catch(() => {
        this.$message.error('操作票导入失败，请重试')
      })
      this.isOperating = false
      this.$message.success('操作票导入成功')
      this.handleQuery()
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
.red {
  color: #F56C6C;
}

.check-card {
  position: relative;
}
.progress-bar {
  position: absolute;
  top: 0;
  left: 12px;
  z-index: 2001;
  width: 100%;
}
</style>
