<template>
  <el-dialog custom-class="dialog" width="600px" :title="form.id ? '编辑简单规则' : '新建简单规则'" :visible.sync="dialogFormVisible">
    <el-form :model="form" ref="form" label-width="auto">
      <el-form-item
        label="规则名称"
        prop="name"
        :rules="[{
          required: true, message: '请输入规则名称', trigger: 'blur'
        }]">
        <el-input v-model="form.name" autocomplete="off"></el-input>
      </el-form-item>
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
      <el-form-item
        label="任务名称条件"
        prop="taskCondition.operator"
        :rules="[{
          required: true, message: '请选择任务名称筛选逻辑', trigger: 'blur'
        }]"
        style="margin-bottom: 0;">
        <el-select v-model="form.taskCondition.operator" placeholder="请选择筛选逻辑">
          <el-option
            v-for="item in operatorOptions"
            :label="item.filterLabel"
            :key="item.value"
            :value="item.value"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item
        v-for="(item, index) in form.taskCondition.keywords"
        :key="`cond-${index}`"
        :class="index === form.taskCondition.keywords.length - 1 ? 'last-keyword' : 'keyword'"
        :prop="`taskCondition.keywords.${index}`"
        :rules="[{
          required: true, message: '请输入关键字', trigger: 'blur'
        }]">
        <el-input v-model="form.taskCondition.keywords[index]" placeholder="请输入关键字，关键字之间是或的关系"></el-input>
        <el-button v-if="index === 0" class="btn-del" icon="el-icon-plus" @click="handleAddCondKeyword" circle></el-button>
        <el-button class="btn-del" v-else icon="el-icon-minus" @click="handleRemoveCondKeyword(index)" type="danger" circle></el-button>
      </el-form-item>
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
      <el-form-item
        label="校验逻辑"
        prop="operator"
        :rules="[{
          required: true, message: '请选择校验逻辑', trigger: 'blur'
        }]">
        <el-select v-model="form.operator" placeholder="请选择校验逻辑">
          <el-option label="需包含" value="in"></el-option>
          <el-option label="不可包含" value="notIn"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item
        v-for="(item, index) in form.keywords"
        :key="index"
        :label="index === 0 ? '校验关键字' : ''"
        :class="index === form.keywords.length - 1 ? 'last-keyword' : 'keyword'"
        :prop="`keywords.${index}`"
        :rules="[{
          required: true, message: '请输入关键字', trigger: 'blur'
        }]">
        <el-input v-model="form.keywords[index]" placeholder="请输入关键字，关键字之间是或的关系"></el-input>
        <el-button v-if="index === 0" icon="el-icon-plus" @click="handleAddCheckKeyword" circle></el-button>
        <el-button class="btn-del" v-else icon="el-icon-minus" @click="handleRemoveCheckKeyword(index)" type="danger" circle></el-button>
      </el-form-item>
      <el-form-item
        label="报错信息"
        prop="errorMsg"
        :rules="[{
          required: true, message: '请输入报错信息', trigger: 'blur'
        }]">
        <el-input v-model="form.errorMsg"></el-input>
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="dialogFormVisible = false">取 消</el-button>
      <el-button type="primary" :disabled="isSubmiting" :loading="isSubmiting" @click="handleSubmit">确 定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { operatorOptions, stepOptions } from '@/utils/constant'
import db from '@/database/index'
export default {
  name: 'EditDialog',
  data () {
    return {
      formLabelWidth: '120px',
      dialogFormVisible: false,
      isSubmiting: false,
      operatorOptions: Object.freeze(operatorOptions),
      stepOptions: Object.freeze(stepOptions),
      workplaceList: [],
      form: {
        name: '',
        workplace: [],
        taskCondition: {
          operator: 'in',
          keywords: ['']
        },
        step: '',
        operator: '',
        keywords: [''],
        errorMsg: ''
      }
    }
  },
  methods: {
    getWorkplaceList () {
      const workplaceList = localStorage.getItem('workplaceList')
      workplaceList && (this.workplaceList = JSON.parse(workplaceList))
    },
    async edit (row) {
      this.dialogFormVisible = true
      this.getWorkplaceList()
      this.$nextTick(() => {
        this.$refs.form.clearValidate()
      })
      if (!row) {
        this.form = {
          name: '',
          workplace: '',
          taskCondition: {
            operator: 'in',
            keywords: ['']
          },
          operator: '',
          keywords: [''],
          errorMsg: ''
        }
      } else {
        this.form = await db.specialSimpleRule.get(row.id)
      }
    },
    handleAddCondKeyword () {
      this.form.taskCondition.keywords.push('')
    },
    handleRemoveCondKeyword (index) {
      this.form.taskCondition.keywords.splice(index, 1)
    },
    handleAddCheckKeyword () {
      this.form.keywords.push('')
    },
    handleRemoveCheckKeyword (index) {
      this.form.keywords.splice(index, 1)
    },
    handleSubmit () {
      // 防止重复提交
      if (this.isSubmiting) return
      this.$refs.form.validate(valid => {
        if (!valid) return
        this.isSubmiting = true
        if (!this.form.id) {
          db.specialSimpleRule
            .add({
              ...this.form
            })
            .then(() => {
              this.dialogFormVisible = false
              this.$message.success('添加成功')
              this.$emit('ok')
            })
            .catch(err => {
              this.$message.error(`錯誤：${err.message || err}`)
            })
            .finally(() => {
              this.isSubmiting = false
            })
        } else {
          const rule = { ...this.form }
          db.specialSimpleRule
            .update(this.form.id, rule)
            .then(() => {
              this.dialogFormVisible = false
              this.$message.success('修改成功')
              this.$emit('ok')
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
.dialog {
  width: 400px;
  .el-input, .el-select {
    width: 320px;
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