import { vi } from 'vitest'

/**
 * Cria um mock reutilizável da interface fluente do Kysely.
 *
 * Uso:
 *   const { db, mocks } = createDbMock()
 *   mocks.executeTakeFirst.mockResolvedValue({ id: 'x' })
 */
export function createDbMock() {
  const execute = vi.fn().mockResolvedValue([])
  const executeTakeFirst = vi.fn().mockResolvedValue(undefined)
  const executeTakeFirstOrThrow = vi.fn().mockResolvedValue({ total: 0 })

  // ─── select chain ─────────────────────────────────────────────────────────

  const orderBy = vi.fn().mockReturnThis()
  const limit = vi.fn().mockReturnThis()
  const offset = vi.fn().mockReturnThis()
  const where = vi.fn().mockReturnThis()
  const selectAll = vi.fn().mockReturnThis()
  const select = vi.fn().mockReturnThis()
  const innerJoin = vi.fn().mockReturnThis()

  const selectChain = {
    selectAll,
    select,
    innerJoin,
    where,
    orderBy,
    limit,
    offset,
    execute,
    executeTakeFirst,
    executeTakeFirstOrThrow,
  }

  // Faz cada método retornar o mesmo objeto (encadeamento fluente)
  Object.values(selectChain).forEach((fn) => {
    if (typeof fn === 'function') (fn as ReturnType<typeof vi.fn>).mockReturnValue(selectChain)
  })

  // ─── insert chain ─────────────────────────────────────────────────────────

  const insertExecute = vi.fn().mockResolvedValue([])
  const onConflict = vi.fn().mockReturnValue({ execute: insertExecute })
  const values = vi.fn().mockReturnValue({ execute: insertExecute, onConflict })
  const insertInto = vi.fn().mockReturnValue({ values })

  // ─── update chain ─────────────────────────────────────────────────────────

  const updateExecute = vi.fn().mockResolvedValue([])
  const updateWhere = vi.fn().mockReturnValue({ execute: updateExecute })
  const set = vi.fn().mockReturnValue({ where: updateWhere })
  const updateTable = vi.fn().mockReturnValue({ set })

  // ─── delete chain ─────────────────────────────────────────────────────────

  const deleteExecute = vi.fn().mockResolvedValue([])
  const deleteWhere = vi.fn().mockReturnValue({ execute: deleteExecute })
  const deleteFrom = vi.fn().mockReturnValue({ where: deleteWhere })

  // ─── transaction ──────────────────────────────────────────────────────────

  const transaction = vi.fn().mockReturnValue({
    execute: vi.fn().mockImplementation((cb) =>
      cb({
        selectFrom: vi.fn().mockReturnValue(selectChain),
        insertInto,
        updateTable,
        deleteFrom,
      }),
    ),
  })

  const db = {
    selectFrom: vi.fn().mockReturnValue(selectChain),
    insertInto,
    updateTable,
    deleteFrom,
    transaction,
    fn: { countAll: vi.fn().mockReturnValue({ as: vi.fn().mockReturnValue('count') }), sql: vi.fn() },
  }

  return {
    db,
    mocks: {
      execute,
      executeTakeFirst,
      executeTakeFirstOrThrow,
      insertExecute,
      updateExecute,
      deleteExecute,
      where,
      selectFrom: db.selectFrom,
      insertInto,
      updateTable,
      transaction,
      onConflict,
    },
  }
}
