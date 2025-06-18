import { OpenDatabase } from '../lib/mysql.js'

const migrate = OpenDatabase({ log: true })

await migrate()