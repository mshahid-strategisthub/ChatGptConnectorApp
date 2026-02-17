import { useEffect, useMemo, useState, useCallback } from "react";

const MAX_USER_MESSAGES = 10;

function getAssetBase() {
  const v = window.__AURIE_ASSET_BASE__;
  return typeof v === "string" && v.length ? v : "";
}

// Widget runs inside ChatGPT's sandbox; window.location.origin is OpenAI's domain.
// Our server URL is in __AURIE_ASSET_BASE__ (e.g. https://your-tunnel.com/assets). Use that origin for API calls.
function getWidgetApiBase() {
  const assetBase = getAssetBase();
  if (!assetBase) return "";
  return assetBase.replace(/\/assets\/?$/, "") || assetBase;
}

// Host may inject tool result under different keys; try all likely locations.
function getToolOutputRaw() {
  try {
    const openai = window.openai || window.__openai;
    if (!openai || typeof openai !== "object") return null;
    return (
      openai.toolOutput ||
      openai.tool_output ||
      openai.toolResult ||
      openai.tool_result ||
      openai.result
    );
  } catch {
    return null;
  }
}

function readToolOutput() {
  try {
    const out = getToolOutputRaw();
    console.log("[Aurie widget] readToolOutput raw:", out ? Object.keys(out) : "null");
    if (!out || typeof out !== "object") return {};
    const getStr = (v) => (typeof v === "string" && v.length ? v : null);
    const parsed = {
      initial_text: getStr(out.initial_text) || "",
      first_reply: getStr(out.first_reply) || null,
      connect_required: out.connect_required === true,
      widgetSessionId:
        getStr(out.widgetSessionId) ||
        getStr(out.widget_session_id) ||
        getStr(out.sessionId) ||
        getStr(out.session_id) ||
        null,
      conversationId:
        getStr(out.conversationId) ||
        getStr(out.conversation_id) ||
        null,
    };
    console.log("[Aurie widget] readToolOutput parsed:", {
      ...parsed,
      widgetSessionId: parsed.widgetSessionId ? "[set]" : null,
      conversationId: parsed.conversationId ? "[set]" : null,
    });
    return parsed;
  } catch (e) {
    console.warn("[Aurie widget] readToolOutput error:", e);
    return {};
  }
}

const CONNECT_REQUIRED_MESSAGE =
  "Connect your Aurie account to use Quick Processing. In ChatGPT, add this app and choose OAuth to link your account.";

export function useStepFlow() {
  const assetBase = useMemo(() => getAssetBase(), []);

  const [toolOutput, setToolOutput] = useState(readToolOutput);
  const [route, setRoute] = useState("step"); // "step" | "success"
  const [messages, setMessages] = useState(() => {
    const out = readToolOutput();
    const user = out.initial_text || "";
    const assistant =
      out.first_reply || (out.connect_required ? CONNECT_REQUIRED_MESSAGE : "");
    if (user || assistant) return [{ user, assistant }];
    return [];
  });
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);

  const applyToolOutput = useCallback((out) => {
    setToolOutput(out);
    setMessages((prev) => {
      if (prev.length > 0) return prev;
      const user = out.initial_text || "";
      const assistant =
        out.first_reply || (out.connect_required ? CONNECT_REQUIRED_MESSAGE : "");
      if (user || assistant) return [{ user, assistant }];
      return [];
    });
  }, []);

  useEffect(() => {
    applyToolOutput(readToolOutput());
  }, [applyToolOutput]);

  useEffect(() => {
    const handler = () => applyToolOutput(readToolOutput());
    window.addEventListener("openai:set_globals", handler);
    const t1 = setTimeout(() => applyToolOutput(readToolOutput()), 100);
    const t2 = setTimeout(() => applyToolOutput(readToolOutput()), 500);
    return () => {
      window.removeEventListener("openai:set_globals", handler);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [applyToolOutput]);

  const initial_text = toolOutput.initial_text || "";
  const first_reply = toolOutput.first_reply;
  const connect_required = toolOutput.connect_required;
  const widgetSessionId = toolOutput.widgetSessionId || null;
  const conversationId = toolOutput.conversationId || null;
  const hasSession = Boolean(widgetSessionId || conversationId);

  const userMessageCount = messages.length;

  const send = useCallback(
    async (textOverride) => {
      const text = ((textOverride !== undefined ? textOverride : draft) || "").trim();
      if (!text || isSending || connect_required) return;
      if (userMessageCount >= MAX_USER_MESSAGES) return;

      setIsSending(true);
      setDraft("");
      setMessages((prev) => [...prev, { user: text, assistant: "" }]);

      if (!hasSession) {
        console.warn("[Aurie widget] send: no session (widgetSessionId=", widgetSessionId, "conversationId=", conversationId, ")");
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.user === text && last.assistant === "") {
            next[next.length - 1] = {
              ...last,
              assistant: "Unable to send. Please start a new conversation.",
            };
          }
          return next;
        });
        setIsSending(false);
        return;
      }

      const apiBase = getWidgetApiBase();
      const url = apiBase ? `${apiBase}/widget/ask` : "/widget/ask";
      if (!apiBase) {
        console.warn("[Aurie widget] no API base (__AURIE_ASSET_BASE__ not set); request may hit wrong host");
      }
      const body = { message: text };
      if (widgetSessionId) body.widgetSessionId = widgetSessionId;
      if (conversationId) body.conversationId = conversationId;

      console.log("[Aurie widget] send: url=", url, "body=", { ...body, message: "[redacted]" });
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        let data = null;
        try {
          data = await res.json();
        } catch (_) {
          console.warn("[Aurie widget] send: response not JSON, status=", res.status);
        }
        console.log("[Aurie widget] send: status=", res.status, "data=", data);

        let reply;
        if (res.ok && data && data.message) {
          reply = data.message;
        } else {
          const errMsg = (data && data.error) || `Request failed (${res.status})`;
          console.error("[Aurie widget] send error:", errMsg, "full data:", data);
          reply = errMsg;
        }
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.user === text && last.assistant === "") {
            next[next.length - 1] = { ...last, assistant: reply };
          }
          return next;
        });
      } catch (e) {
        const errMsg = e && (e.message || String(e));
        console.error("[Aurie widget] send exception:", errMsg, e);
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.user === text && last.assistant === "") {
            next[next.length - 1] = {
              ...last,
              assistant: errMsg || "Something went wrong. Try again.",
            };
          }
          return next;
        });
      } finally {
        setIsSending(false);
      }
    },
    [draft, isSending, connect_required, hasSession, widgetSessionId, conversationId, userMessageCount]
  );

  // Single exchange: user message (from ChatGPT) + AI reply (from /ask). One theme.
  useEffect(() => {
    document.documentElement.style.setProperty("--sceneSkyA", "#0d1630");
    document.documentElement.style.setProperty("--sceneSkyB", "#2a3f7a");
    document.documentElement.style.setProperty("--sunColor", "#ffcc7a");
    document.documentElement.style.setProperty(
      "--sunGlow",
      "rgba(255, 210, 125, 0.55)"
    );
    document.documentElement.style.setProperty("--sunY", "62%");
    document.documentElement.style.setProperty("--sceneOpacity", "0.38");
    document.documentElement.style.setProperty("--raysOpacity", "0.18");
  }, []);

  const canEnd =
    Boolean(first_reply) &&
    !connect_required &&
    userMessageCount >= MAX_USER_MESSAGES;

  const back = () => {};
  const end = () => setRoute("success");

  const visible = {
    canBack: false,
    isFinal: canEnd && userMessageCount >= MAX_USER_MESSAGES,
  };

  return {
    assetBase,
    route,
    initial_text,
    first_reply,
    connect_required,
    messages,
    canEnd,
    maxUserMessages: MAX_USER_MESSAGES,
    userMessageCount,
    back,
    send,
    end,
    setDraft,
    draft,
    isSending,
    visible,
  };
}
