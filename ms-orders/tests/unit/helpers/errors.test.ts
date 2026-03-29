import { describe, it, expect } from 'vitest'
import { AppError, NotFoundError, BusinessError } from '../../../src/helpers/errors.js'

describe('AppError', () => {
  it('atribui statusCode e mensagem corretamente', () => {
    const error = new AppError(418, 'sou um bule')
    expect(error.statusCode).toBe(418)
    expect(error.message).toBe('sou um bule')
    expect(error).toBeInstanceOf(Error)
  })
})

describe('NotFoundError', () => {
  it('tem statusCode 404', () => {
    const error = new NotFoundError('não encontrado')
    expect(error.statusCode).toBe(404)
  })

  it('é instância de AppError', () => {
    expect(new NotFoundError('x')).toBeInstanceOf(AppError)
  })

  it('preserva instanceof após serialização de prototype', () => {
    const error = new NotFoundError('test')
    expect(error instanceof NotFoundError).toBe(true)
    expect(error instanceof AppError).toBe(true)
  })
})

describe('BusinessError', () => {
  it('tem statusCode 422', () => {
    const error = new BusinessError('regra violada')
    expect(error.statusCode).toBe(422)
  })

  it('é instância de AppError', () => {
    expect(new BusinessError('x')).toBeInstanceOf(AppError)
  })
})
