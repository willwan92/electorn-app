<template>
  <el-dialog custom-class="dialog" width="600px" :title="form.id ? '编辑简单规则' : '新建简单规则'" :visible.sync="dialogFormVisible">
    <el-form :model="form" ref="form" label-width="100px">
      <el-form-item
        label="规则名称"
        prop="name"
        :rules="[{
          required: true, message: '请输入规则名称', trigger: 'blur'
        }]">
        <el-input v-model="form.name" autocomplete="off"></el-input>
      </el-form-item>
      <el-form-item
        label="操作步骤"
        prop="step"
        :rules="[{
          required: true, message: '请选择操作步骤', trigger: 'blur'
        }]">
        <el-select v-model="form.step" placeholder="请选择操作步骤">
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
          <el-option
            v-for="item in operatorOptions"
            :label="item.label"
            :key="item.value"
            :value="item.value"
          ></el-option>
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
        <el-button v-if="index === 0" icon="el-icon-plus" @click="handleAddClick" circle></el-button>
        <el-button class="btn-del" v-else icon="el-icon-minus" @click="handleRemoveClick(index)" type="danger" circle></el-button>
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
      dialogFormVisible: false,
      isSubmiting: false,
      operatorOptions: Object.freeze(operatorOptions),
      stepOptions: Object.freeze(stepOptions),
      form: {
        name: '',
        step: '',
        operator: '',
        keywords: [''],
        errorMsg: ''
      }
    }
  },
  methods: {
    async edit (row) {
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs.form.clearValidate()
      })
      if (!row) {
        this.form = {
          name: '',
          step: '',
          operator: '',
          keywords: [''],
          errorMsg: ''
        }
      } else {
        this.form = await db.simpleRule.get(row.id)
      }
    },
    handleAddClick () {
      this.form.keywords.push('')
    },
    handleRemoveClick (index) {
      this.form.keywords.splice(index, 1)
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
          db.simpleRule
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
    width: 300px;
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