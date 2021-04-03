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

const stepOptions = [
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
    label: '母步骤',
    value: 'sub-first',
  },
  {
    label: '其他步骤（除了母步骤和最后一步）',
    value: 'other'
  }
]

const operatorOptions = [
  {
    label: '需包含',
    value: 'in'
  },
  {
    label: '不可包含',
    value: 'notIn'
  },
  {
    label: '要等于',
    value: 'equal'
  },
  {
    label: '要以关键字开头',
    value: 'startsWith'
  },
  {
    label: '要以关键字结尾',
    value: 'endsWith'
  }
]

export {
  workplaceList,
  stepOptions,
  operatorOptions
}
