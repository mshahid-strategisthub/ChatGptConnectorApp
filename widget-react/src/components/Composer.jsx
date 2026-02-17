import React from "react";

export default function Composer({
  draft,
  setDraft,
  isSending,
  canEnd,
  onSend,
  onEnd,
}) {
  return (
    <div className="px-4 pb-4">
      <div className="max-w-2xl mx-auto">
        {canEnd ? (
          <button
            type="button"
            onClick={onEnd}
            className="w-full rounded-2xl bg-white text-black py-3 text-[13px] font-semibold hover:bg-white/90 transition"
          >
            End conversation
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend(draft);
                }
              }}
              placeholder="Type your response…"
              className="flex-1 rounded-2xl bg-black/35 border border-white/10 px-4 py-3 text-[13px] text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-white/20"
              disabled={isSending}
            />
            <button
              type="button"
              onClick={() => onSend(draft)}
              disabled={isSending || !draft.trim()}
              className={`rounded-2xl px-4 py-3 text-[13px] font-semibold transition ${
                isSending || !draft.trim()
                  ? "bg-white/20 text-white/60 cursor-not-allowed"
                  : "bg-white text-black hover:bg-white/90"
              }`}
            >
              {isSending ? "…" : "Send"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


