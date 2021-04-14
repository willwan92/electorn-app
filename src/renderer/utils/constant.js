const workplaceList = [
  '500kV蝶岭站',
  '220kV阳江站',
  '110kV石湾站',
  '110kV塘坪站',
  '110kV白沙站',
  '110kV金郊站',
  '110kV随垌站',
  '110kV始安站',
  '110kV城西站',
  '110kV银河站',
  '35kV大八站'
]

const positionOptions = {
  current: '目标步骤（满足条件的）',
  before: '在目标步骤之前',
  after: '在目标步骤之后'
}

const condPosOptions = {
  current: '且在此步骤中',
  before: '且在此步骤之前',
  after: '且在此步骤之后'
}

const stepOptions = {
  'all': '所有步骤',
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
  workplaceList,
  stepOptions,
  operatorOptions
}
