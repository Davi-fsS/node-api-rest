// extensão d.ts -> definição de tipos (não terá código javascript)
// eslint-disable-next-line
import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    transactions: {
      id: string
      title: string
      amount: number
      creation_at: string
      session_id?: string
    }
  }
}
