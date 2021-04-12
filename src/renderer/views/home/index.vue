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
      // 遍历所有操作票
      const promises = operatingOrder.map(async order => {
        await this.checkTime(order)
        await this.checkTaskName(order)
        await this.checkSteps(order)
        await this.validateSpecialRule(order)
        // await this.validateSpecialComplexRule(order)
      })
      await Promise.all(promises)
      this.handleQuery()
      this.isUploading = false
    },
    /**
     * 校验步骤中是否符合关键字条件，符合一个关键字条件，即为符合
     * @param step { String } 步骤内容
     * @param operator { String } 校验逻辑
     * @param keywords { String[] } 要校验的关键字
     */
    validateStep (step, operator, keywords) {
      if (!step) return false
      let isMatch = false
      for (let i = 0, len = keywords.length; i < len; i++) {
        isMatch = strUtils[operator](step, keywords[i])
        if (isMatch) {
          // 如果有符合一个关键字，跳出该循环
          break
        }
      }
      return isMatch
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
        isMatched = this.validateStep(step, condition.operator, condition.keywords)
      } else if (condition.position === 'before') {
        // 检查当前步骤之前步骤的
        let len = Number(condition.positionNum)
        if (len > 0) {
          // 之后的指定几步
          if (condition.stepType === 'notChild') {
            // 遍历指定的步骤
            for (let i = stepIndex - 1, min = stepIndex - len; i >= min; i--) {
              targetStep = order.steps[i]
              isMatched = this.validateStep(targetStep, condition.operator, condition.keywords)
              // 如果步骤中有一个符合条件，终止循环
              if (isMatched) break
            }
          } else if (condition.stepType === 'child' && subIndex) {
            // 遍历指定的步骤
            for (let i = subIndex - 1, min = subIndex - len; i >= min; i--) {
              targetStep = order.steps[stepIndex][i]
              isMatched = this.validateStep(targetStep, condition.operator, condition.keywords)
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
              isMatched = this.validateStep(targetStep, condition.operator, condition.keywords)
              // 如果步骤中有一个符合条件，终止循环
              if (isMatched) break
            }
          } else if (condition.stepType === 'child' && subIndex) {
            // 遍历指定的步骤
            for (let i = subIndex - 1; i >= 0; i--) {
              targetStep = order.steps[stepIndex][i]
              isMatched = this.validateStep(targetStep, condition.operator, condition.keywords)
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
            // 遍历指定的步骤
            for (let i = stepIndex + 1, max = stepIndex + len + 1; i < max; i++) {
              targetStep = order.steps[i]
              isMatched = this.validateStep(targetStep, condition.operator, condition.keywords)
              // 如果步骤中有一个符合条件，终止循环
              if (isMatched) break
            }
          } else if (condition.stepType === 'child' && subIndex) {
            // 遍历指定的步骤
            for (let i = subIndex + 1, max = subIndex + len + 1; i < max; i++) {
              targetStep = order.steps[stepIndex][i]
              isMatched = this.validateStep(targetStep, condition.operator, condition.keywords)
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
              isMatched = this.validateStep(targetStep, condition.operator, condition.keywords)
              // 如果步骤中有一个符合条件，终止循环
              if (isMatched) break
            }
          } else if (condition.stepType === 'child' && subIndex) {
            // 遍历指定的步骤
            for (let i = subIndex + 1, max = order.steps[stepIndex].length; i < max; i++) {
              targetStep = order.steps[stepIndex][i]
              isMatched = this.validateStep(targetStep, condition.operator, condition.keywords)
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
    validateComplexRule ({ order, rule, stepIndex, subIndex }) {
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
          await this.addCheckResult({
            order,
            stepNum,
            step,
            errorMsg: rule.errorMsg
          })
        }
      }
    },
    /**
     * 遍历步骤复杂规则
     */
    async traverseComplexRule ({ order, stepIndex, subIndex = undefined }) {
      const rules = await db.complexRule.toArray()
      // 遍历所有规则
      rules.forEach(async rule => {
        this.validateComplexRule({ order, rule, stepIndex, subIndex })
      })
    },
    /**
     * 校验步骤简单规则
     */
    async validateRule ({ order, stepType, step, stepNum }) {
      let valid = false
      let keywords
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
            stepNum,
            step,
            errorMsg: rule.errorMsg
          })
        }
      })
    },
    /**
     * 校验专用复杂规则
     */
    async validateSpecialComplexRule (order) {
      const rules = await db.specialComplexRule.toArray()
      // 遍历专用复杂规则
      rules.forEach(rule => {
        const taskKeywords = rule.taskCondition.keywords
        const isMatched = this.validateStep(order.taskName, rule.taskCondition.operator, taskKeywords)
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
    async validateSpecialRule (order) {
      const rules = await db.specialSimpleRule.toArray()
      // 遍历规则
      rules.forEach(rule => {
        const taskKeywords = rule.taskCondition.keywords
        const isMatched = this.validateStep(order.taskName, rule.taskCondition.operator, taskKeywords)
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
              valid = this.validateStep(step, operator, keywords)
              if (isIn) {
                // 如果需要包含，有一个步骤包含关键字则跳出循环（符合规则）
                if (valid) break
              } else {
                // 如果是不可包含，有一个步骤包含关键字则跳出循环（违反规则）
                if (!valid) {
                  stepNum = `${idx + 1}`
                  break
                }
              }
            } else {
              let subStep
              for (let subIdx = 0, len = step.length; subIdx < len; subIdx++) {
                // 子步骤
                subStep = step[subIdx]
                stepTmp = subStep
                valid = this.validateStep(subStep, operator, keywords)
                if (isIn) {
                  // 如果需要包含，有一个步骤包含关键字则跳出循环（符合规则）
                  if (valid) break
                } else {
                  // 如果是不可包含，有一个步骤包含关键字则跳出循环（违反规则）
                  if (!valid) {
                    stepNum = subIdx > 0 ? `${idx + 1}.${subIdx}` : `${idx + 1}`
                    break
                  }
                }
              }
            }
          }
          if (!valid) {
            this.addCheckResult({
              order,
              stepNum,
              step: stepNum ? stepTmp : '',
              errorMsg: rule.errorMsg
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
        stepNum = stepIndex + 1
        await this.validateRule({
          order,
          step,
          stepNum,
          stepType: 'all'
        })
        await this.traverseComplexRule({
          order,
          stepIndex
        })
      } else {
        // 子步骤
        step = order.steps[stepIndex][subIndex]
        stepNum = subIndex > 0 ? `${stepIndex + 1}.${subIndex}` : `${stepIndex + 1}`
        await this.validateRule({
          order,
          step,
          stepNum,
          stepType: 'all'
        })
        await this.traverseComplexRule({
          order,
          stepIndex,
          subIndex
        })
      }
      await this.checkVerb({
        order,
        step,
        stepNum
      })
    },
    /**
     * 检查动词搭配
     */
    async checkVerb ({ order, step, stepNum }) {
      const verbs = await db.verb.toArray()
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
          for (let i = 0, len = nouns.length; i < len; i++) {
            nounValid = includes(step, nouns[i])
            if (nounValid) break
          }
          if (!nounValid) {
            await this.addCheckResult({
              order,
              step,
              stepNum,
              errorMsg: '动词和设备不一致'
            })
          }
          break
        }
      }
      if (!verbValid) {
        await this.addCheckResult({
          order,
          step,
          stepNum,
          errorMsg: '动词和设备不一致'
        })
      }
    },
    async checkSteps (order) {
      const promises = order.steps.map(async (step, stepIndex) => {
        if (!Array.isArray(step)) {
          let stepNum = stepIndex + 1
          if (stepIndex === 0) {
            // 第一步
            await this.validateRule({
              order,
              step,
              stepNum,
              stepType: 'first'
            })
          } else if (stepIndex === (order.steps.length - 1)) {
            // 最后一步
            await this.validateRule({
              order,
              step,
              stepNum,
              stepType: 'last'
            })
          } else {
            // 其他步骤
            await this.validateRule({
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
              await this.validateRule({
                order,
                stepNum,
                step: subStep,
                stepType: 'sub-first'
              })
            } else if (stepIndex === (order.steps.length - 1) && subIndex === (step.length - 1)) {
              // 最后一步
              await this.validateRule({
                order,
                stepNum,
                step: subStep,
                stepType: 'last'
              })
            } else {
              // 其他步骤
              await this.validateRule({
                order,
                stepNum,
                step: subStep,
                stepType: 'other'
              })
            }
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
      return db.checkResult.add({
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
      // 遍历所有操作步骤
      for (let i = 1, len = 3000; i < len; i++) {
        step = sheetsData[i]
        if (step.length < 11) {
          continue
        }
        newId = step[0] + step[2]
        if (id !== newId) {
          // 不属于当前操作任务的步骤，把当前操作任务添加到数据库
          db.operatingOrder.add(task).catch(error => {
            console.log('Error: ' + (error.stack || error))
          })

          // 新的操作任务
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
          // 属于当前操作任务的步骤
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
</style>
