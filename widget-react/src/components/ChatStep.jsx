import React from "react";
import TrackCard from "./TrackCard.jsx";

export default function ChatStep({ assistantText, userText, step, assetBase }) {
  return (
    <div className="flex-1 px-4 pt-4 pb-2 overflow-y-auto">
      <div className="max-w-2xl mx-auto flex flex-col gap-3">
        <div className="self-start max-w-[92%] rounded-2xl border border-white/10 bg-black/35 backdrop-blur-md p-3 text-white">
          <div className="text-[13px] leading-relaxed">{assistantText}</div>
        </div>

        {userText ? (
          <div className="self-end max-w-[92%] rounded-2xl border border-white/10 bg-white/15 backdrop-blur-md p-3 text-white">
            <div className="text-[13px] leading-relaxed">{userText}</div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-1">
            <TrackCard assetBase={assetBase} />
          </div>
        ) : null}
      </div>
    </div>
  );
}


