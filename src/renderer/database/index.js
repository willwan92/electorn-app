import Dexie from 'dexie'

const db = new Dexie('MainDatabase')

db.version(13).stores({
  specialDevice: '++id, &deviceName',
  taskSpecialDevice: '++id, &deviceName',
  device: '++id, workplace, deviceName, deviceType, interval',
  verb: '++id, &verb, nouns',
  timeRule: 'operator, timeLength',
  nameRule: 'operator, keywords',
  simpleRule: '++id, name, enable, step, operator, keywords, errorMsg',
  complexRule: '++id, name, enable, conditions, position, positionNum, stepType, operator, keywords, errorMsg',
  specialSimpleRule: '++id, name, enable, taskConditions, workplace, step, rules, errorMsg',
  specialComplexRule: '++id, name, enable, taskConditions, workplace, conditions, rules, errorMsg',
  operatingOrder: 'id, num, taskName, workplace, steps, startTime, endTime',
  checkResult: '++id, num, taskName, workplace, stepNum, step, errorMsg, *checkTime',
  checkResultSummary: '++id, checkTime, operatingOrderAmount, stepAmount'
})

// db.device = db.table('device')

export default db
