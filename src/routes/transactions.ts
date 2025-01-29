import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import crypto from 'node:crypto'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function transactionsRoute(app: FastifyInstance) {
  app.addHook('preHandler', async (request) => {
    console.log(`Método [${request.method}] - ${request.url}`)
  })

  app.post('/', async (request, response) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body,
    )

    let { sessionId } = request.cookies

    if (!sessionId) {
      sessionId = crypto.randomUUID()

      response.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60,
      })
    }

    await knex('transactions').insert({
      id: crypto.randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    })

    return response.status(201).send()
  })

  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, response) => {
      const { sessionId } = request.cookies

      const transactions = await knex('transactions')
        .where('session_id', sessionId)
        .select()

      return response.status(200).send({ transactions })
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, response) => {
      const getTransactionParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getTransactionParamsSchema.parse(request.params)

      const { sessionId } = request.cookies

      const transaction = await knex('transactions')
        .where({ id, session_id: sessionId })
        .first()

      return response.status(200).send({ transaction })
    },
  )

  app.get(
    '/resume',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, response) => {
      const { sessionId } = request.cookies

      const transactions = await knex('transactions')
        .where('session_id', sessionId)
        .sum('amount', { as: 'amount' })
        .first()

      return response.status(200).send({
        transactions,
      })
    },
  )
}
