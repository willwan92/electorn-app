import Dexie from 'dexie'

const db = new Dexie('MainDatabase')

db.version(1).stores({
  device: '++id, workplace, deviceName'
})

// db.device = db.table('device')

export default db
