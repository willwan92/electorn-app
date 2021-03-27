import Dexie from 'dexie'

const db = new Dexie('MainDatabase')

db.version(6).stores({
  device: '++id, workplace, deviceName',
  verb: '++id, verb, nouns',
  timeRule: 'operator, timeLength',
  nameRule: 'operator, keywords',
  simpleRule: '++id, name, step, operator, keyword, errorMsg'
})

// db.device = db.table('device')

export default db
