// ─── Classe base ─────────────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = this.constructor.name
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

// ─── 404 – recurso não encontrado ────────────────────────────────────────────

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, message)
  }
}

// ─── 422 – regra de negócio violada ──────────────────────────────────────────

export class BusinessError extends AppError {
  constructor(message: string) {
    super(422, message)
  }
}
