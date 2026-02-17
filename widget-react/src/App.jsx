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
    step,
    answers,
    draft,
    isSending,
    visible,
    setDraft,
    back,
    send,
    end,
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
          disabled={isSending}
          onBack={back}
        />

        {route === "success" ? (
          <SuccessScreen />
        ) : (
          <>
            <ChatStep
              assistantText={visible.assistant}
              userText={visible.user}
              step={step}
              assetBase={assetBase}
            />

            <Composer
              draft={draft}
              setDraft={setDraft}
              isSending={isSending}
              canEnd={visible.isFinal && !!answers[4]}
              onSend={send}
              onEnd={end}
            />
          </>
        )}
      </div>
    </div>
  );
}


