import 'dotenv/config'
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import type { Database } from './types/database.js'
import { t } from './i18n/index.js'

if (!process.env.DATABASE_URL) {
  throw new Error(t('errors.database_url_required'))
}

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({ connectionString: process.env.DATABASE_URL }),
  }),
})
