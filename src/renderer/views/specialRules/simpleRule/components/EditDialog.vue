<template>
  <el-dialog custom-class="dialog" width="600px" :title="form.id ? '编辑简单规则' : '新建简单规则'" :visible.sync="dialogFormVisible">
    <el-form :model="form" label-width="100px">
      <el-form-item label="规则名称">
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
      <el-form-item label="任务名称条件">
        <el-select v-model="form.taskCondition.operator" placeholder="请选择筛选逻辑" style="margin-bottom: 10px;">
          <el-option
            v-for="item in operatorOptions"
            :label="item.filterLabel"
            :key="item.value"
            :value="item.value"
          ></el-option>
        </el-select>
        <div v-for="(item, index) in form.taskCondition.keywords" :key="index">
          <el-input v-model="form.taskCondition.keywords[index]" placeholder="请输入关键字，关键字之间是或的关系"></el-input>
          <el-button v-if="index === 0" icon="el-icon-plus" @click="handleAddClick(form.taskCondition.keywords)" circle></el-button>
          <el-button class="btn-del" v-else icon="el-icon-minus" @click="handleRemoveClick(form.taskCondition.keywords, index)" type="danger" circle></el-button>
        </div>
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
        <div v-for="(item, index) in form.keywords" :key="index">
          <el-input v-model="form.keywords[index]" placeholder="请输入关键字，关键字之间是或的关系"></el-input>
          <el-button v-if="index === 0" icon="el-icon-plus" @click="handleAddClick(form.keywords)" circle></el-button>
          <el-button class="btn-del" v-else icon="el-icon-minus" @click="handleRemoveClick(form.keywords, index)" type="danger" circle></el-button>
        </div>
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
import { operatorOptions, workplaceList } from '@/utils/constant'
import db from '@/database/index'
export default {
  name: 'EditDialog',
  data () {
    return {
      formLabelWidth: '120px',
      dialogFormVisible: false,
      operatorOptions: Object.freeze(operatorOptions),
      workplaceList: Object.freeze(workplaceList),
      form: {
        name: '',
        workplace: [],
        taskCondition: {
          operator: '',
          keywords: ['']
        },
        operator: '',
        keywords: [''],
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
          workplace: '',
          taskCondition: {
            operator: '',
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
    handleAddClick (target) {
      target.push('')
    },
    handleRemoveClick (target, index) {
      target.splice(index, 1)
    },
    handleSubmit () {
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
  .btn-del {
    margin-top: 10px;
  }
}
</style>