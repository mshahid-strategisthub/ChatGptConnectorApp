import React from "react";
import Scene from "./components/Scene.jsx";
import HeaderBar from "./components/HeaderBar.jsx";
import SuccessScreen from "./components/SuccessScreen.jsx";
import ChatStep from "./components/ChatStep.jsx";
import Composer from "./components/Composer.jsx";
import { useStepFlow } from "./hooks/useStepFlow.js";

export default function App() {
  const {
    assetBase,
    route,
    initial_text,
    first_reply,
    connect_required,
    messages,
    canEnd,
    end,
    visible,
    draft,
    setDraft,
    isSending,
    send,
  } = useStepFlow();

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{
        backgroundImage: assetBase
          ? `url(${assetBase}/Background/Background-C7gW5saQ.png)`
          : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Scene />

      <div className="relative z-10 h-full flex flex-col">
        <HeaderBar
          canBack={visible.canBack && route === "step"}
          disabled={false}
          onBack={() => {}}
        />

        {route === "success" ? (
          <SuccessScreen />
        ) : (
          <>
            <ChatStep messages={messages} assetBase={assetBase} />

            {connect_required ? (
              <div className="px-4 pb-4 text-center text-white/80 text-sm">
                Link your account in ChatGPT settings to continue.
              </div>
            ) : (
              <Composer
                draft={draft}
                setDraft={setDraft}
                isSending={isSending}
                canEnd={canEnd}
                onSend={send}
                onEnd={end}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
