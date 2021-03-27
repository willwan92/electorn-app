<template>
  <el-dialog custom-class="dialog" width="600px" :title="form.id ? '编辑简单规则' : '新建简单规则'" :visible.sync="dialogFormVisible">
    <el-form :model="form" label-width="100px">
      <el-form-item label="规则名称">
        <el-input v-model="form.name" autocomplete="off"></el-input>
      </el-form-item>
      <el-form-item label="操作步骤">
        <el-select v-model="form.step" placeholder="请选择操作步骤">
          <el-option
            v-for="item in stepOptions"
            :label="item.label"
            :key="item.value"
            :value="item.value"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="校验逻辑">
        <el-select v-model="form.operator" placeholder="请选择校验逻辑">
          <el-option
            v-for="item in operatorOptions"
            :label="item.label"
            :key="item.value"
            :value="item.value"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="校验关键字">
        <el-input v-model="form.keyword"></el-input>
      </el-form-item>
      <el-form-item label="报错信息">
        <el-input v-model="form.errorMsg"></el-input>
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="dialogFormVisible = false">取 消</el-button>
      <el-button type="primary" @click="handleSubmit">确 定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { operatorOptions } from '@/utils/constant'
import db from '@/database/index'
export default {
  name: 'EditDialog',
  data () {
    return {
      formLabelWidth: '120px',
      dialogFormVisible: false,
      operatorOptions: Object.freeze(operatorOptions),
      stepOptions: [
        {
          label: '所有步骤',
          value: 'all',
        },
        {
          label: '任务的第一步',
          value: 'first',
        },
        {
          label: '任务的最后一步',
          value: 'last',
        },
        {
          label: '子任务的第一步',
          value: 'sub-0',
        },
        {
          label: '其他步骤',
          value: 'other'
        }
      ],
      form: {
        name: '',
        step: '',
        operator: '',
        keyword: '',
        errorMsg: ''
      }
    }
  },
  methods: {
    async edit (row) {
      this.dialogFormVisible = true
      if (!row) {
        this.form = {
          name: '',
          step: '',
          operator: '',
          keyword: '',
          errorMsg: ''
        }
      } else {
        this.form = await db.simpleRule.get(row.id)
      }
    },
    handleSubmit () {
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
      }
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
}
</style>