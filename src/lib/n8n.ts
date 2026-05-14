// Caller de webhooks n8n — solo usar desde API Routes (server-side)

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

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': secret,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(`n8n webhook error ${res.status}: ${await res.text()}`)
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
