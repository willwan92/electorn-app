const positionOptions = {
  current: '目标步骤（满足条件的）',
  before: '在目标步骤之前',
  after: '在目标步骤之后'
}

const condPosOptions = {
  current: '且此步骤',
  before: '且此步骤之前',
  after: '且此步骤之后'
}

const stepOptions = {
  'all': '所有步骤',
  'any': '存在一个步骤',
  'first': '任务的第一步',
  'last': '任务的最后一步',
  'sub-first': '母步骤',
  'other': '其他步骤（除了母步骤、第一步和最后一步）'
}

const condOperatorOptions = {
  in: '包含',
  notIn: '不包含',
  equal: '等于',
  startsWith: '以关键字开头',
  equalToTaskName: '不等于任务名称',
  endsWith: '以关键字结尾'
}

const checkOperatorOptions = {
  in: '需包含',
  notIn: '不可包含',
  equal: '要等于',
  startsWith: '要以关键字开头',
  endsWith: '要以关键字结尾'
}

const operatorOptions = [
  {
    label: '需包含',
    filterLabel: '包含',
    value: 'in'
  },
  {
    label: '不可包含',
    filterLabel: '不包含',
    value: 'notIn'
  },
  {
    label: '要等于',
    filterLabel: '等于',
    value: 'equal'
  },
  {
    label: '不等于任务名称',
    filterLabel: '不等于任务名称',
    value: 'equalToTaskName'
  },
  {
    label: '要以关键字开头',
    filterLabel: '以关键字开头',
    value: 'startsWith'
  },
  {
    label: '要以关键字结尾',
    filterLabel: '以关键字结尾',
    value: 'endsWith'
  }
]

export {
  condOperatorOptions,
  checkOperatorOptions,
  positionOptions,
  condPosOptions,
  stepOptions,
  operatorOptions
}
