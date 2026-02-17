/**
 * Widget API: in-widget chat calls this (same Aura /ai/dialogue/ask, auth from tool run).
 */

import {
  getWidgetSession,
  getWidgetSessionByConversationId,
  updateWidgetSessionConversation,
} from '../widgetSessionStore.js';
import { callAuraAsk } from '../auraDialogue.js';

export function mountWidgetRoutes(app) {
  app.post('/widget/ask', async (req, res) => {
    const { widgetSessionId, conversationId, message } = req.body || {};
    console.log('[widget/ask] body keys:', {
      widgetSessionId: !!widgetSessionId,
      conversationId: !!conversationId,
      messageLength: typeof message === 'string' ? message.length : 0,
    });

    if ((!widgetSessionId && !conversationId) || typeof message !== 'string' || !message.trim()) {
      console.warn('[widget/ask] 400 bad request:', {
        hasWidgetSessionId: !!widgetSessionId,
        hasConversationId: !!conversationId,
      });
      return res.status(400).json({ error: 'widgetSessionId or conversationId, and message required' });
    }

    let session = widgetSessionId ? getWidgetSession(widgetSessionId) : null;
    if (!session && conversationId) {
      session = getWidgetSessionByConversationId(conversationId);
    }
    if (!session || !session.accessToken) {
      console.warn('[widget/ask] 401 no session or token:', {
        foundSession: !!session,
        hasToken: !!(session && session.accessToken),
      });
      return res.status(401).json({ error: 'session_expired' });
    }

    const sessionIdForUpdate = session.sessionId || widgetSessionId;
    try {
      const result = await callAuraAsk({
        message: message.trim(),
        conversationId: session.conversationId,
        accessToken: session.accessToken,
      });
      if (result.success) {
        if (sessionIdForUpdate) {
          updateWidgetSessionConversation(
            sessionIdForUpdate,
            result.conversationId,
            result.dialogueId
          );
        }
        console.log('[widget/ask] 200 ok, reply length=', result.message?.length);
        return res.json({ message: result.message });
      }
      console.error('[widget/ask] Aura ask failed:', result.error);
      return res.status(502).json({ error: result.error || 'Dialogue ask failed' });
    } catch (e) {
      console.error('[widget/ask] exception:', e.message || e);
      return res.status(500).json({ error: e.message || 'Server error' });
    }
  });
}
