import React from "react";

export default function SuccessScreen() {
  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-3xl border border-white/10 bg-black/35 backdrop-blur-md p-6 text-white">
        <div className="text-[18px] font-semibold">Success</div>
        <div className="mt-2 text-[13px] text-white/80">
          Nice work. You completed the Quick Processing flow and can return to the chat.
        </div>
      </div>
    </div>
  );
}


