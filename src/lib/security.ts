// Security utilities — used across all API routes

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Validates a UUID v4 — prevents param injection and invalid DB queries */
export function isValidUUID(val: unknown): val is string {
  return typeof val === 'string' && UUID_RE.test(val)
}

/** Safe parseInt that returns a fallback instead of NaN */
export function safeInt(val: string | null, fallback: number, min = 0, max = Infinity): number {
  const n = parseInt(val ?? '', 10)
  return isNaN(n) ? fallback : Math.max(min, Math.min(max, n))
}

/** Generic error response — NEVER leaks internal details to clients */
export function errResponse(msg: string, status: number) {
  return Response.json({ error: msg }, { status })
}

/** Validates Content-Type is application/json */
export function requireJSON(req: Request): boolean {
  return !!req.headers.get('content-type')?.includes('application/json')
}

/** Strict plan whitelist — prevents any unexpected value reaching Stripe */
const PAID_PLANS = new Set(['starter', 'agency'] as const)
export function isValidPaidPlan(val: unknown): val is 'starter' | 'agency' {
  return typeof val === 'string' && PAID_PLANS.has(val as 'starter' | 'agency')
}
