import Dexie from 'dexie'

const db = new Dexie('MainDatabase')

db.version(4).stores({
  device: '++id, workplace, deviceName',
  verb: '++id, verb, nouns'
})

// db.device = db.table('device')

export default db
