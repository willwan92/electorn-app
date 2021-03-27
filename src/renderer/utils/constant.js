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
    value: 'start'
  },
  {
    label: '要以关键字结尾',
    value: 'end'
  }
]

export {
  workplaceList,
  operatorOptions
}
