/**
 * Call Aura backend /ai/dialogue/ask (same as AuraCompanion).
 * Used so the first user message (from ChatGPT) gets a real AI reply.
 */

import { createHmac } from 'crypto';

const AURA_SERVICES =
  process.env.AURA_SERVICES_URL || 'https://services.aurahealth.io';

export async function callAuraAsk({ message, conversationId, accessToken }) {
  if (!accessToken || typeof accessToken !== 'string') {
    return { success: false, error: 'Missing access token' };
  }
  if (!message || typeof message !== 'string') {
    return { success: false, error: 'Missing message' };
  }

  const body = {
    message: message.trim(),
    prompterName: 'quickProcessing',
    platform: 'chatgpt',
    withMarkup: true,
  };
  if (conversationId) body.conversationId = conversationId;

  const res = await fetch(`${AURA_SERVICES}/ai/dialogue/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let errBody = null;
    try {
      errBody = await res.json();
    } catch {}
    const errMsg =
      errBody?.error?.message || errBody?.error || `Dialogue ask failed (${res.status})`;
    return { success: false, error: errMsg };
  }

  const data = await res.json();
  const conversationIdFromHeader =
    res.headers.get('x-conversation-id') || data.conversationId;
  const dialogueId = res.headers.get('x-dialogue-id') || data.id;
  const reply = data.message || '';

  return {
    success: true,
    message: reply,
    conversationId: conversationIdFromHeader,
    dialogueId,
    payload: data.payload || null,
  };
}

/**
 * Extract Bearer token from Authorization header.
 */
export function bearerFromHeader(authorization) {
  if (!authorization || typeof authorization !== 'string') return null;
  const m = authorization.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

const JWT_SECRET = process.env.JWT_SECRET || 'aurie-mcp-jwt-secret-change-in-production';

/**
 * If the token is our auth server's JWT (signed with JWT_SECRET), verify and return payload.
 * Payload may contain aura_token (token to use for /ai/dialogue/ask). Otherwise returns null.
 */
export function decodeOurJwt(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payloadJson = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const payload = JSON.parse(payloadJson);
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    const sig = createHmac('sha256', JWT_SECRET).update(`${parts[0]}.${parts[1]}`).digest('base64url').replace(/=+$/, '');
    if (sig !== parts[2]) return null;
    return payload;
  } catch {
    return null;
  }
}
