import { createRxDatabase, addRxPlugin } from 'rxdb'
import { deviceSchema } from './schemas/device'
import indexeddb from 'pouchdb-adapter-indexeddb'

async function createDatabase () {
  addRxPlugin(indexeddb)
  const db = await createRxDatabase({
    name: 'db',
    adapter: 'indexeddb',
    // password: 'admin' // optional
  })

  await db.addCollections({
    devices: deviceSchema
  })

  return db
}

let database
export function getDatabase () {
  if (!database) {
    database = createDatabase()
  }
  return database
}
