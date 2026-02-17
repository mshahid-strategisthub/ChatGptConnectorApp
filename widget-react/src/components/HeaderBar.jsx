import React from "react";

export default function HeaderBar({ canBack, disabled, onBack }) {
  return (
    <div className="px-4 pt-4 flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        disabled={!canBack || disabled}
        className={`text-[12px] px-3 py-2 rounded-full border border-white/15 bg-white/10 text-white/90 transition ${
          !canBack || disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-white/15"
        }`}
      >
        Back
      </button>
      <div className="text-[12px] text-white/70">Aurie — Quick Processing</div>
      <div className="w-[56px]" />
    </div>
  );
}


