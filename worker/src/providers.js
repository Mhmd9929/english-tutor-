// Talks to the AI provider. Two providers are supported:
//   gemini (default) - Google Gemini API free tier
//   claude           - Anthropic API (claude-haiku-5-5) with prompt caching
// Both get exactly the same prompt and history and return plain text.

import Anthropic from '@anthropic-ai/sdk';

export class ProviderError extends Error {
  // kind: 'rate_limit' | 'auth' | 'blocked' | 'config' | 'server'
  constructor(kind, message, retryAfter) {
    super(message);
    this.kind = kind;
    this.retryAfter = retryAfter;
  }
}

export function providerName(env) {
  return String(env.AI_PROVIDER || 'gemini').trim().toLowerCase() === 'claude' ? 'claude' : 'gemini';
}

/**
 * @param env Worker env
 * @param req { staticPrompt, dynamicPrompt, messages: [{role:'user'|'assistant', content}], maxTokens }
 * @returns {Promise<string>}
 */
export async function generateReply(env, req) {
  return providerName(env) === 'claude' ? callClaude(env, req) : callGemini(env, req);
}

// ---------------------------------------------------------------- Gemini

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';
const GEMINI_FALLBACK_MODEL = 'gemini-flash-latest';
const GEMINI_SAFETY = [
  'HARM_CATEGORY_HARASSMENT',
  'HARM_CATEGORY_HATE_SPEECH',
  'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  'HARM_CATEGORY_DANGEROUS_CONTENT',
].map((category) => ({ category, threshold: 'BLOCK_LOW_AND_ABOVE' }));

function parseGeminiRetry(text) {
  const m = /"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/.exec(text || '');
  return m ? Math.ceil(Number(m[1])) : undefined;
}

async function callGemini(env, { staticPrompt, dynamicPrompt, messages, maxTokens }) {
  if (!env.GEMINI_API_KEY) throw new ProviderError('config', 'GEMINI_API_KEY is not set on the Worker');
  const primary = String(env.GEMINI_MODEL || 'gemini-flash-lite-latest').trim();
  const models = primary === GEMINI_FALLBACK_MODEL ? [primary] : [primary, GEMINI_FALLBACK_MODEL];

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  for (const model of models) {
    // First try with thinking switched off (fast, and keeps the token budget for the reply).
    // Some models reject that setting, so retry once without it and with more room.
    const attempts = [
      { maxOutputTokens: maxTokens, temperature: 0.8, thinkingConfig: { thinkingBudget: 0 } },
      { maxOutputTokens: maxTokens * 4, temperature: 0.8 },
    ];
    let notFound = false;
    for (let i = 0; i < attempts.length; i++) {
      const body = {
        systemInstruction: { parts: [{ text: `${staticPrompt}\n\n${dynamicPrompt}` }] },
        contents,
        generationConfig: attempts[i],
        safetySettings: GEMINI_SAFETY,
      };
      const res = await fetch(`${GEMINI_BASE}${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        body: JSON.stringify(body),
      });
      const text = await res.text();

      if (res.status === 429 || res.status === 503) {
        throw new ProviderError('rate_limit', `Gemini busy (${res.status})`, parseGeminiRetry(text));
      }
      if (res.status === 401 || res.status === 403) {
        throw new ProviderError('auth', 'Gemini rejected the API key (check GEMINI_API_KEY)');
      }
      if (res.status === 404) { notFound = true; break; }
      if (res.status === 400) {
        if (/API key/i.test(text)) throw new ProviderError('auth', 'Gemini rejected the API key (check GEMINI_API_KEY)');
        if (i === 0) continue; // probably the thinking setting; try without it
        throw new ProviderError('server', `Gemini bad request: ${text.slice(0, 300)}`);
      }
      if (!res.ok) throw new ProviderError('server', `Gemini error ${res.status}: ${text.slice(0, 300)}`);

      let data;
      try { data = JSON.parse(text); } catch { throw new ProviderError('server', 'Gemini returned invalid JSON'); }
      if (data.promptFeedback?.blockReason) throw new ProviderError('blocked', 'Gemini blocked the prompt');
      const cand = data.candidates?.[0];
      if (!cand) throw new ProviderError('server', 'Gemini returned no answer');
      if (['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII', 'RECITATION'].includes(cand.finishReason)) {
        throw new ProviderError('blocked', `Gemini stopped: ${cand.finishReason}`);
      }
      const reply = (cand.content?.parts || []).filter((p) => !p.thought && typeof p.text === 'string').map((p) => p.text).join('').trim();
      if (!reply) {
        if (i === 0) continue; // thinking ate the whole budget; retry with more room
        throw new ProviderError('server', 'Gemini returned an empty answer');
      }
      return reply;
    }
    if (!notFound) break;
  }
  throw new ProviderError('config', `Gemini model "${primary}" was not found. Set the GEMINI_MODEL repo variable to a current model.`);
}

// ---------------------------------------------------------------- Claude

async function callClaude(env, { staticPrompt, dynamicPrompt, messages, maxTokens }) {
  if (!env.ANTHROPIC_API_KEY) throw new ProviderError('config', 'ANTHROPIC_API_KEY is not set on the Worker');
  // Retries are handled by the app (it shows "Buddy needs a short break" first).
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 0, timeout: 30_000 });
  let msg;
  try {
    msg = await client.messages.create({
      model: env.CLAUDE_MODEL || 'claude-haiku-5-5',
      max_tokens: maxTokens,
      // Short spoken replies: no extended thinking needed.
      thinking: { type: 'disabled' },
      system: [
        // The tutor prompt is identical on every request, so it is cached.
        { type: 'text', text: staticPrompt, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: dynamicPrompt },
      ],
      messages,
    });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      const ra = Number(err.headers?.get?.('retry-after'));
      throw new ProviderError('rate_limit', 'Claude rate limit', Number.isFinite(ra) ? ra : undefined);
    }
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
      throw new ProviderError('auth', 'Anthropic rejected the API key (check ANTHROPIC_API_KEY)');
    }
    if (err instanceof Anthropic.APIError && (err.status === 529 || err.status === 503)) {
      throw new ProviderError('rate_limit', 'Claude is overloaded');
    }
    if (err instanceof Anthropic.APIError) {
      throw new ProviderError('server', `Claude error ${err.status}: ${String(err.message).slice(0, 300)}`);
    }
    throw new ProviderError('server', `Could not reach Claude: ${err?.message || err}`);
  }
  if (msg.stop_reason === 'refusal') throw new ProviderError('blocked', 'Claude declined');
  const reply = (msg.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
  if (!reply) throw new ProviderError('server', 'Claude returned an empty answer');
  return reply;
}
