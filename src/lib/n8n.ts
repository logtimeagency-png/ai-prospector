// Caller de webhooks n8n — solo usar desde API Routes (server-side)
// NUNCA llamar desde Client Components

interface N8nSearchPayload {
  search_id: string
  user_id: string
  niche: string
  location: string
  query: string
}

interface N8nAnalyzePayload {
  lead_id: string
  website_url: string
  place_id: string
  niche: string
  location: string
}

interface N8nMessagesPayload {
  lead_id: string
  user_id: string
}

async function callWebhook(url: string, payload: unknown): Promise<void> {
  const secret = process.env.N8N_WEBHOOK_SECRET
  if (!secret) throw new Error('N8N_WEBHOOK_SECRET no configurado')

  // Only allow calls to our own n8n instance — prevents SSRF
  const n8nBase = process.env.N8N_BASE_URL
  if (!url.startsWith(n8nBase ?? 'https://logtime.app.n8n.cloud')) {
    throw new Error('URL de webhook no autorizada')
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': secret,
      'User-Agent': 'AIProspector/1.0',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30_000), // 30s timeout
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`n8n webhook ${res.status}: ${text.slice(0, 200)}`)
  }
}

export const n8n = {
  triggerSearch: (payload: N8nSearchPayload) =>
    callWebhook(process.env.N8N_WEBHOOK_SEARCH!, payload),

  triggerAnalyze: (payload: N8nAnalyzePayload) =>
    callWebhook(process.env.N8N_WEBHOOK_ANALYZE!, payload),

  triggerMessages: (payload: N8nMessagesPayload) =>
    callWebhook(process.env.N8N_WEBHOOK_MESSAGES!, payload),
}
