import Datastore from 'nedb'
import path from 'path'
import { remote } from 'electron'

let db = {}
db.users = new Datastore({
  autoload: true,
  filename: path.join(remote.app.getPath('userData'), '/users.db')
})
db.rules = new Datastore({
  autoload: true,
  filename: path.join(remote.app.getPath('userData'), '/rules.db')
})

export default db
