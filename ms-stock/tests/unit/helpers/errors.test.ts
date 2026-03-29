import { describe, it, expect } from 'vitest'
import { AppError, NotFoundError, ConflictError, BusinessError } from '../../../src/helpers/errors.js'

describe('AppError', () => {
  it('atribui statusCode e mensagem corretamente', () => {
    const error = new AppError(400, 'erro base')
    expect(error.statusCode).toBe(400)
    expect(error.message).toBe('erro base')
    expect(error).toBeInstanceOf(Error)
  })
})

describe('NotFoundError', () => {
  it('tem statusCode 404', () => {
    expect(new NotFoundError('x').statusCode).toBe(404)
  })

  it('é instância de AppError e Error', () => {
    const err = new NotFoundError('x')
    expect(err).toBeInstanceOf(AppError)
    expect(err).toBeInstanceOf(Error)
  })
})

describe('ConflictError', () => {
  it('tem statusCode 409', () => {
    expect(new ConflictError('duplicado').statusCode).toBe(409)
  })

  it('é instância de AppError', () => {
    expect(new ConflictError('x')).toBeInstanceOf(AppError)
  })
})

describe('BusinessError', () => {
  it('tem statusCode 422', () => {
    expect(new BusinessError('regra').statusCode).toBe(422)
  })

  it('é instância de AppError', () => {
    expect(new BusinessError('x')).toBeInstanceOf(AppError)
  })
})
