import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const SYSTEM_PROMPT = `You are the digital assistant for RBX Systems — a precision engineering company that builds governed AI platforms for high-demand operations. RBX is headquartered in Brazil and Switzerland (Zug).

RBX platform layers:
- TruthMetal: AI evaluation and ground truth. Measures whether agents are correct. Owns eval datasets, golden cases, benchmarks, scoring, reliability metrics and behavioral regression. It does not decide production — it produces evidence.
- Thalamus: Semantic control and operational governance. Answers the question "Can this agent operate now, in this context, with this level of risk?" Handles model routing, guardrails, context limits, production gates, observability, distributed tracing, fallback strategies, and human-in-the-loop intervention. Thalamus consumes evidence from TruthMetal and applies operational decisions in real time. It is the nerve center that keeps AI operations auditable and controllable.
- Agent Orchestration Plane: Coordinates agents, missions, execution plans, delegations, retry logic, bounded loops, and mission termination. It does not own governance or LLM routing — its responsibility is to coordinate work.
- RBX Governance: Institutional decision layer. Owns ADRs, policies, standards, decision registry, mission registry, ownership maps and audit trails. Answers why a decision was made, by whom, when, and which systems are affected.

We serve enterprises that need AI sovereignty, governance, and operational precision. We work with strategy, precision and intelligence for high efficiency.

Your role:
1. Answer questions about RBX Systems, our platform, solutions and products
2. Understand the visitor's context: what they do, what problem they are trying to solve
3. When the visitor shows clear interest in working with RBX, guide them naturally to contact us via WhatsApp or our contact form
4. Be direct, precise and institutional — no filler, no jargon overload
5. Match the visitor's language — respond in Portuguese if they write in Portuguese, in English if they write in English
6. Keep responses concise: 2–4 sentences unless a detailed explanation is genuinely needed

Do NOT:
- Invent features, clients or case studies not mentioned here
- Promise pricing, SLAs or timelines
- Discuss internal infrastructure details, credentials or security specifics
- Use em-dashes or excessive arrows — write in natural prose

CTA rule — be strict. Append exactly [CTA] at the very end of your response ONLY when the visitor's latest message expresses concrete intent to engage: asking about pricing, scheduling a call, requesting a proposal, asking how to start, or explicitly saying they want to talk to the team. Do NOT append [CTA] after a purely informational answer (e.g. "what is Thalamus", "what does RBX do"). When unsure, do not append it.`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// In-memory sliding-window rate limit, per client IP. Bounds abuse/cost on the
// public chat endpoint (each request is one gateway completion). Per-pod state,
// acceptable for current traffic; move to Redis when scaling past a few pods.
const RATE_WINDOW_MS = 5 * 60 * 1000;
const RATE_MAX = 30;
const hits = new Map<string, number[]>();

function clientIp(request: Request, fallback: string): string {
  const xff = request.headers.get('x-forwarded-for');
  // Traefik sets XFF; take the first (original client) hop.
  return xff?.split(',')[0]?.trim() || fallback;
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  // Opportunistic cleanup so the map does not grow unbounded.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(k);
    }
  }
  return false;
}

interface LlmTarget {
  url: string;
  key: string;
  model: string;
}

/**
 * Resolve the LLM target. Sovereign-first: route through the RBX LLM gateway
 * (LiteLLM, governed by Thalamus) so the site never holds a raw provider key
 * and model routing / quota / spend stay centralized. The gateway speaks the
 * OpenAI-compatible surface, so the same request shape works unchanged.
 *
 * Falls back to a direct provider (Groq's OpenAI-compatible endpoint) only when
 * the gateway is not configured — convenient for local dev, never the prod path.
 */
function resolveLlmTarget(): LlmTarget | null {
  const base = env.LLM_GATEWAY_URL?.replace(/\/+$/, '');
  const key = env.LLM_GATEWAY_KEY;
  const model = env.LLM_MODEL || 'llama-3.3-70b-versatile';

  if (base && key) {
    return { url: `${base}/chat/completions`, key, model };
  }

  if (env.GROQ_API_KEY) {
    return {
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: env.GROQ_API_KEY,
      model
    };
  }

  return null;
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  const target = resolveLlmTarget();
  if (!target) throw error(503, 'AI assistant not configured');

  if (rateLimited(clientIp(request, getClientAddress()))) {
    throw error(429, 'Too many requests. Please wait a moment and try again.');
  }

  let messages: Message[];
  try {
    ({ messages } = await request.json());
  } catch {
    throw error(400, 'Invalid request body');
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    throw error(400, 'messages array required');
  }

  const recent = messages.slice(-12);

  const res = await fetch(target.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${target.key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: target.model,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...recent],
      max_tokens: 320,
      temperature: 0.65
    })
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('[chat] LLM gateway error', res.status, detail);
    throw error(502, 'AI service unavailable');
  }

  const data = await res.json();
  const raw: string = data.choices?.[0]?.message?.content ?? '';
  const showCta = raw.includes('[CTA]');
  const content = raw.replace('[CTA]', '').trim();

  return json({ content, showCta });
};
