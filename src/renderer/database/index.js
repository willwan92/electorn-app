import Dexie from 'dexie'

const db = new Dexie('MainDatabase')

db.version(10).stores({
  device: '++id, workplace, deviceName',
  verb: '++id, verb, nouns',
  timeRule: 'operator, timeLength',
  nameRule: 'operator, keywords',
  simpleRule: '++id, name, step, operator, keywords, errorMsg',
  complexRule: '++id, name, conditions, position, positionNum, stepType, operator, keywords, errorMsg',
  specialSimpleRule: '++id, name, taskCondition, workplace, operator, keywords, errorMsg',
  operatingOrder: 'id, num, taskName, workplace, steps, startTime, endTime, unit, date, status, department',
  checkResult: '++id, num, taskName, workplace, stepNum, step, errorMsg',
})

// db.device = db.table('device')

export default db
