<template>
  <el-form :model="form" ref="form"  label-width="155px" :inline="true">
    <el-form-item
      label="规则名称"
      prop="name"
      :rules="[{
        required: true, message: '请输入规则名称', trigger: 'blur'
      }]">
      <el-input v-model="form.name" type="textarea" autosize="" autocomplete="off"></el-input>
    </el-form-item>
    <br>
    <el-form-item
      label="校验步骤"
      prop="step"
      :rules="[{
        required: true, message: '请选择校验步骤', trigger: 'blur'
      }]">
      <el-select v-model="form.step" placeholder="请选择校验步骤">
        <el-option
          v-for="(val, key) in stepOptions"
          :label="val"
          :key="key"
          :value="key"
        ></el-option>
      </el-select>
    </el-form-item>
    <div v-for="(rule, index) in form.rules" class="condition" :key="index">
      <span class="label">
        <el-button
          v-if="index === 0" type="primary"
          class="conditions-btn"
          circle=""
          @click="addCondition(form.rules,)"
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
      <el-form-item>
        <el-select v-model="rule.operator" placeholder="">
          <el-option
            v-for="item in operatorOptions.filter(item => item.value !== 'equalToTaskName')"
            :label="item.label"
            :key="item.value"
            :value="item.value"
          ></el-option>
        </el-select>
      </el-form-item>
      <span v-for="(item, kwIndex) in rule.keywords" class="keyword-wrapper" :key="kwIndex">
        <el-form-item
          :prop="`rules.${index}.keywords.${kwIndex}`"
          :rules="[{
            required: true, message: '请输入关键字', trigger: 'blur'
          }]">
          <span v-if="kwIndex !== 0">或</span>
          <el-input v-model="rule.keywords[kwIndex]" placeholder="请输入关键字"></el-input>
        </el-form-item>
        <el-button v-if="kwIndex === 0" icon="el-icon-plus" @click="handleAddKeyword(form.rules[index].keywords)" circle></el-button>
        <el-button v-else icon="el-icon-minus" @click="handleRemoveKeyword(form.rules[index].keywords, kwIndex)" type="danger" circle></el-button>
      </span>
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
      <el-button @click="$router.push('/rules/simpleRule')">取 消</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
import { operatorOptions, stepOptions } from '@/utils/constant'
import db from '@/database/index'
export default {
  name: 'simpleRuleEdit',
  data () {
    // 步骤简单规则删除“存在一个步骤”选项
    const _stepOption = Object.assign({}, stepOptions)
    delete _stepOption.any
    return {
      isSubmiting: false,
      operatorOptions: Object.freeze(operatorOptions),
      stepOptions: Object.freeze(_stepOption),
      form: {
        name: '',
        step: '',
        rules: [
          {
            operator: 'in',
            keywords: ['']
          }
        ],
        errorMsg: ''
      }
    }
  },
  beforeRouteEnter (to, from, next) {
    next(vm => {
      const id = Number(to.query.id)
      if (id) {
        vm.getRuleDetail(id)
      }
    })
  },
  methods: {
    async getRuleDetail (id) {
      this.form = await db.simpleRule.get(id)
    },
    addCondition (target) {
      target.push({
        operator: 'in',
        keywords: ['']
      })
    },
    removeCondition (target, index) {
      target.splice(index, 1)
    },
    handleAddKeyword (target) {
      target.push('')
    },
    handleRemoveKeyword (target, index) {
      target.splice(index, 1)
    },
    handleSubmit () {
      // 防止重复提交
      if (this.isSubmiting) return
      this.$refs.form.validate(valid => {
        if (!valid) return
        this.isSubmiting = true
        if (!this.form.id) {
          db.simpleRule
            .add({
              ...this.form
            })
            .then(() => {
              this.$message.success('添加成功')
              this.$router.push('/rules/simpleRule')
            })
            .catch(err => {
              this.$message.error(`錯誤：${err.message || err}`)
            })
            .finally(() => {
              this.isSubmiting = false
            })
        } else {
          const rule = { ...this.form }
          db.simpleRule
            .update(this.form.id, rule)
            .then(() => {
              this.$message.success('修改成功')
              this.$router.push('/rules/simpleRule')
            })
            .catch(err => {
              this.$message.error(`錯誤：${err.message || err}`)
            })
            .finally(() => {
              this.isSubmiting = false
            })
        }
      })
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
  .btn-del {
    margin-top: 14px;
  }
  .keyword {
    margin-bottom: 0px;
  }
  .last-keyword {
    margin-bottom: 20px;
  }
}
</style>