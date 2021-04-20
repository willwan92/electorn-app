import Dexie from 'dexie'

const db = new Dexie('MainDatabase')

db.version(3).stores({
  device: '++id, workplace, deviceName',
  verb: '++id, verb, nouns',
  timeRule: 'operator, timeLength',
  nameRule: 'operator, keywords',
  simpleRule: '++id, name, enable, step, operator, keywords, errorMsg',
  complexRule: '++id, name, enable, conditions, position, positionNum, stepType, operator, keywords, errorMsg',
  specialSimpleRule: '++id, name, enable, taskCondition, workplace, operator, keywords, errorMsg',
  specialComplexRule: '++id, name, enable, taskCondition, workplace, conditions, position, positionNum, stepType, operator, keywords, errorMsg',
  operatingOrder: 'id, num, taskName, workplace, steps, startTime, endTime',
  checkResult: '++id, num, taskName, workplace, stepNum, step, errorMsg, *checkTime',
  checkResultSummary: '++id, checkTime, operatingOrderAmount, stepAmount'
})

// db.device = db.table('device')

export default db
