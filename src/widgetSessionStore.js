/**
 * In-memory store for widget sessions so follow-up messages in the widget
 * can call Aura /ai/dialogue/ask with the same conversation and token.
 * Sessions are keyed by widgetSessionId and also by conversationId so the
 * widget can send either identifier (host may not pass widgetSessionId).
 */

const WIDGET_SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

const sessions = new Map();
const byConversationId = new Map();

function prune() {
  const now = Date.now();
  for (const [id, data] of sessions.entries()) {
    if (now - data.createdAt > WIDGET_SESSION_TTL_MS) {
      sessions.delete(id);
      if (data.conversationId) byConversationId.delete(data.conversationId);
    }
  }
}

export function setWidgetSession(sessionId, data) {
  if (!sessionId || typeof sessionId !== 'string') return;
  const record = {
    conversationId: data.conversationId ?? null,
    dialogueId: data.dialogueId ?? null,
    accessToken: data.accessToken ?? null,
    createdAt: Date.now(),
  };
  sessions.set(sessionId, record);
  if (record.conversationId) {
    byConversationId.set(record.conversationId, { sessionId, ...record });
  }
  prune();
}

export function getWidgetSession(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') return null;
  const data = sessions.get(sessionId);
  if (!data) return null;
  if (Date.now() - data.createdAt > WIDGET_SESSION_TTL_MS) {
    sessions.delete(sessionId);
    if (data.conversationId) byConversationId.delete(data.conversationId);
    return null;
  }
  return data;
}

export function getWidgetSessionByConversationId(conversationId) {
  if (!conversationId || typeof conversationId !== 'string') return null;
  const entry = byConversationId.get(conversationId);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > WIDGET_SESSION_TTL_MS) {
    byConversationId.delete(conversationId);
    if (entry.sessionId) sessions.delete(entry.sessionId);
    return null;
  }
  return entry;
}

export function updateWidgetSessionConversation(sessionId, conversationId, dialogueId) {
  const data = sessions.get(sessionId);
  if (!data) return;
  const oldCid = data.conversationId;
  if (conversationId != null) data.conversationId = conversationId;
  if (dialogueId != null) data.dialogueId = dialogueId;
  if (oldCid) byConversationId.delete(oldCid);
  if (data.conversationId) {
    byConversationId.set(data.conversationId, { sessionId, ...data });
  }
}
