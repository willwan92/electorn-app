// 专用复杂规则编辑
<template>
  <el-form :model="form" ref="form"  label-width="155px" label-position="right" :inline="true">
    <el-form-item
      label="规则名称"
      prop="name"
      :rules="[{
        required: true, message: '请输入规则名称', trigger: 'blur'
      }]">
      <el-input type="textarea" autosize="" v-model="form.name"></el-input>
    </el-form-item>
    <br>
    <el-form-item label="工作地点">
      <el-select v-model="form.workplace" multiple placeholder="所有站点">
        <el-option
          v-for="item in workplaceList"
          :label="item"
          :key="item"
          :value="item"
        ></el-option>
      </el-select>
    </el-form-item>
    <br>

    <!-- 任务名称条件 -->
    <div v-for="(condition, index) in form.taskConditions" class="condition task-condition" :key="`task-condition-${index}`">
      <span class="label">
        <el-button
          v-if="index === 0" type="primary"
          class="conditions-btn"
          circle=""
          @click="addTaskNameCondition(form.taskConditions)"
          icon="el-icon-plus"
          size="mini"></el-button>
        <el-button
          v-else type="danger"
          class="conditions-btn"
          circle=""
          @click="removeCondition(form.taskConditions, index)"
          icon="el-icon-minus"
          size="mini"></el-button>
          任务名称条件 {{index + 1 }}
      </span>
      <el-form-item>
        <el-select v-model="condition.operator" placeholder="">
          <el-option
            v-for="item in operatorOptions.filter(item => item.value !== 'equalToTaskName')"
            :label="item.filterLabel"
            :key="item.value"
            :value="item.value"
          ></el-option>
        </el-select>
      </el-form-item>
      <span v-for="(item, kwIndex) in condition.keywords" class="keyword-wrapper" :key="kwIndex">
        <el-form-item
          :prop="`taskConditions.${index}.keywords.${kwIndex}`"
          :rules="[{
            required: true, message: '请输入关键字', trigger: 'blur'
          }]">
          <span v-if="kwIndex !== 0">或</span>
          <el-input v-model="condition.keywords[kwIndex]" placeholder="请输入关键字"></el-input>
        </el-form-item>
        <el-button v-if="kwIndex === 0" icon="el-icon-plus" @click="handleAddKeyword(form.taskConditions[index].keywords)" circle></el-button>
        <el-button v-else icon="el-icon-minus" @click="handleRemoveKeyword(form.taskConditions[index].keywords, kwIndex)" type="danger" circle></el-button>
      </span>
    </div>
    <!-- 步骤筛选条件 -->
    <div v-for="(condition, index) in form.conditions" class="condition" :key="`step-condition-${index}`">
      <span class="label">
        <el-button
        v-if="index === 0" type="primary"
        class="conditions-btn"
        circle=""
        @click="addCondition(form.conditions)"
        icon="el-icon-plus"
        size="mini"></el-button>
      <el-button
        v-else type="danger"
        class="conditions-btn"
        circle=""
        @click="removeCondition(form.conditions, index)"
        icon="el-icon-minus"
        size="mini"></el-button>
        步骤条件 {{index + 1 }}
      </span>
      <span v-if="index !== 0">
        <el-form-item label="">
          <el-select v-model="condition.position" @change="handleCondPosChange(form.conditions, index)">
            <el-option
              v-for="(val, key) in condPosOptions"
              :label="val"
              :key="key"
              :value="key"
            ></el-option>
          </el-select>
        </el-form-item>
        <span v-show="condition.position !== 'current'">
          <el-form-item
            :prop="`conditions.${index}.positionNum`"
            :rules="[{
              validator: validatStepNum, trigger: 'blur'
            }]">
            <el-input type="number" v-model="condition.positionNum" placeholder="不填代表之前/后所有步骤">
              <template slot="append">步</template>
            </el-input>
          </el-form-item>
          <el-form-item label="">
            <el-select v-model="condition.stepType">
              <el-option value="notChild" label="非子步骤"></el-option>
              <el-option value="child" label="子步骤"></el-option>
            </el-select>
          </el-form-item>
        </span>
      </span>
      <el-form-item>
        <el-select v-model="condition.operator" placeholder="">
          <el-option
            v-for="item in operatorOptions"
            :label="item.filterLabel"
            :key="item.value"
            :value="item.value"
          ></el-option>
        </el-select>
      </el-form-item>
      <template v-if="condition.operator !== 'equalToTaskName'">
        <span v-for="(item, kwIndex) in condition.keywords" class="keyword-wrapper" :key="kwIndex">
          <el-form-item
            :prop="`conditions.${index}.keywords.${kwIndex}`"
            :rules="[{
              required: true, message: '请输入关键字', trigger: 'blur'
            }]">
            <span v-if="kwIndex !== 0">或</span>
            <el-input v-model="condition.keywords[kwIndex]" placeholder="请输入关键字"></el-input>
          </el-form-item>
          <el-button v-if="kwIndex === 0" icon="el-icon-plus" @click="handleAddKeyword(form.conditions[index].keywords)" circle></el-button>
          <el-button v-else icon="el-icon-minus" @click="handleRemoveKeyword(form.conditions[index].keywords, kwIndex)" type="danger" circle></el-button>
        </span>
      </template>
    </div>
    <!-- 校验规则 -->
    <div v-for="(condition, index) in form.rules" class="condition" :key="`rule-${index}`">
      <span class="label">
        <el-button
        v-if="index === 0" type="primary"
        class="conditions-btn"
        circle=""
        @click="addCondition(form.rules)"
        icon="el-icon-plus"
        size="mini"></el-button>
      <el-button
        v-else type="danger"
        class="conditions-btn"
        circle=""
        @click="removeCondition(form.rules, index)"
        icon="el-icon-minus"
        size="mini"></el-button>
        校验规则 {{index + 1 }}
      </span>
      <!-- <span v-if="index !== 0"> -->
        <el-form-item label="">
          <el-select  v-if="index === 0" v-model="condition.position" @change="handleCondPosChange(form.rules, index)">
            <el-option
              v-for="(val, key) in positionOptions"
              :label="val"
              :key="key"
              :value="key"
            ></el-option>
          </el-select>
          <el-select  v-else v-model="condition.position" @change="handleCondPosChange(form.rules, index)">
            <el-option
              v-for="(val, key) in condPosOptions"
              :label="val"
              :key="key"
              :value="key"
            ></el-option>
          </el-select>
        </el-form-item>
        <span v-show="condition.position !== 'current'">
          <el-form-item
            :prop="`rules.${index}.positionNum`"
            :rules="[{
              validator: validatStepNum, trigger: 'blur'
            }]">
            <el-input type="number" v-model="condition.positionNum" placeholder="不填代表之前/后所有步骤">
              <template slot="append">步</template>
            </el-input>
          </el-form-item>
          <el-form-item label="">
            <el-select v-model="condition.stepType">
              <el-option value="notChild" label="非子步骤"></el-option>
              <el-option value="child" label="子步骤"></el-option>
            </el-select>
          </el-form-item>
        </span>
      <!-- </span> -->
      <el-form-item>
        <el-select v-model="condition.operator" placeholder="">
          <el-option
            v-for="item in operatorOptions"
            :label="item.label"
            :key="item.value"
            :value="item.value"
          ></el-option>
        </el-select>
      </el-form-item>
      <template v-if="condition.operator !== 'equalToTaskName'">
        <span v-for="(item, kwIndex) in condition.keywords" class="keyword-wrapper" :key="kwIndex">
          <el-form-item
            :prop="`rules.${index}.keywords.${kwIndex}`"
            :rules="[{
              required: true, message: '请输入关键字', trigger: 'blur'
            }]">
            <span v-if="kwIndex !== 0">或</span>
            <el-input v-model="condition.keywords[kwIndex]" placeholder="请输入关键字"></el-input>
          </el-form-item>
          <el-button v-if="kwIndex === 0" icon="el-icon-plus" @click="handleAddKeyword(form.rules[index].keywords)" circle></el-button>
          <el-button v-else icon="el-icon-minus" @click="handleRemoveKeyword(form.rules[index].keywords, kwIndex)" type="danger" circle></el-button>
        </span>
      </template>
    </div>
    <el-form-item
      label="报错信息"
      prop="errorMsg"
      :rules="[{
        required: true, message: '请输入报错信息', trigger: 'blur'
      }]">
      <el-input type="textarea" autosize="" v-model="form.errorMsg"></el-input>
    </el-form-item>
    <br>
    <el-form-item label=" ">
      <el-button type="primary" :disabled="isSubmiting" :loading="isSubmiting"  @click="handleSubmit">确 定</el-button>
      <el-button @click="$router.push('/specialRules/complexRule')">取 消</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
import { operatorOptions, positionOptions, condPosOptions } from '@/utils/constant'
import { validatPositiveInt } from '@/utils/validate'
import db from '@/database/index'
export default {
  data () {
    return {
      isSubmiting: false,
      workplaceList: [],
      operatorOptions: Object.freeze(operatorOptions),
      positionOptions: Object.freeze(positionOptions),
      condPosOptions: Object.freeze(condPosOptions),
      form: {
        name: '',
        workplace: [],
        taskConditions: [
          {
            operator: 'in',
            keywords: ['']
          }
        ],
        conditions: [
          {
            position: 'current',
            stepType: 'notChild',
            positionNum: '',
            operator: 'in',
            keywords: ['']
          }
        ],
        rules: [
          {
            position: 'current',
            positionNum: '',
            stepType: 'notChild',
            operator: 'in',
            keywords: ['']
          }
        ]
      }
    }
  },
  beforeRouteEnter (to, from, next) {
    next(vm => {
      vm.getWorkplaceList()
      const id = Number(to.query.id)
      if (id) {
        vm.getRuleDetail(id)
      }
    })
  },
  methods: {
    getWorkplaceList () {
      const workplaceList = localStorage.getItem('workplaceList')
      workplaceList && (this.workplaceList = JSON.parse(workplaceList))
    },
    async getRuleDetail (id) {
      this.form = await db.specialComplexRule.get(id)
    },
    validatStepNum (rule, value, callback) {
      if (value === '') {
        callback()
      } else if (!validatPositiveInt(value)) {
        callback(new Error('步数必须是正整数'))
      } else {
        callback()
      }
    },
    handleSubmit () {
      // 防止重复提交
      if (this.isSubmiting) return
      this.$refs.form.validate(valid => {
        if (!valid) return
        this.isSubmiting = true
        if (!this.form.id) {
          db.specialComplexRule
            .add({
              ...this.form
            })
            .then(() => {
              this.$message.success('添加成功')
              this.$router.push('/specialRules/complexRule')
            })
            .catch(err => {
              this.$message.error(`錯誤：${err.message || err}`)
            })
            .finally(() => {
              this.isSubmiting = false
            })
        } else {
          const rule = { ...this.form }
          db.specialComplexRule.update(this.form.id, rule)
            .then(() => {
              this.$message.success('修改成功')
              this.$router.push('/specialRules/complexRule')
            })
            .catch(err => {
              this.$message.error(`錯誤：${err.message || err}`)
            })
            .finally(() => {
              this.isSubmiting = false
            })
        }
      })
    },
    handleCondPosChange (conditions, index) {
      const condition = conditions[index]
      if (condition.position === 'current') {
        condition.positionNum = ''
      }
    },
    handlePositionChange (val) {
      if (val === 'current') {
        this.form.positionNum = ''
      }
    },
    addCondition (target) {
      target.push({
        position: 'current',
        stepType: 'notChild',
        positionNum: '',
        operator: 'in',
        keywords: ['']
      })
    },
    removeCondition (target, index) {
      target.splice(index, 1)
    },
    addTaskNameCondition (target) {
      target.push({
        operator: 'in',
        keywords: ['']
      })
    },
    removeTaskCondition (index) {
      this.form.taskConditions.splice(index, 1)
    },
    handleAddKeyword (target) {
      target.push('')
    },
    handleRemoveKeyword (target, index) {
      target.splice(index, 1)
    }
  }
}
</script>

<style lang="scss" scoped>
.el-form {
  .el-textarea {
    width: 442px;
  }
  .el-select {
    width: 240px;
  }
  .keyword-wrapper {
    line-height: 32px;
    .el-form-item {
      margin-right: 0;
    }
    .el-input {
      width: auto;
      margin-bottom: 5px;
    }
    .el-button {
      margin-right: 10px;
      padding: 1px !important;
    }
  }
  .condition {
    position: relative;
    padding-left: 155px;
    .label {
      position: absolute;
      left: 51px;
      font-size: 14px;
      color: #606266;
      line-height: 32px;
    }
    .el-button {
      padding: 3px;
    }
  }
  .task-condition {
    .label {
      left: 25px;
    }
  }
}
</style>