import { useEffect, useMemo, useState } from "react";
import { STEP_ASSISTANT, STEP_THEME } from "../data/steps.js";

function getAssetBase() {
  const v = window.__AURIE_ASSET_BASE__;
  return typeof v === "string" && v.length ? v : "";
}

function readInitialText() {
  try {
    const t = window.openai?.toolOutput?.initial_text;
    return typeof t === "string" ? t : "";
  } catch {
    return "";
  }
}

export function useStepFlow() {
  const assetBase = useMemo(() => getAssetBase(), []);

  const [route, setRoute] = useState("step");
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState(() => {
    const a = Array(5).fill("");
    const initial = readInitialText();
    if (initial) a[0] = initial;
    return a;
  });
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const handler = () => {
      const initial = readInitialText();
      if (!initial) return;
      setAnswers((prev) => {
        if (prev[0]) return prev;
        const next = [...prev];
        next[0] = initial;
        return next;
      });
    };
    window.addEventListener("openai:set_globals", handler);
    return () => window.removeEventListener("openai:set_globals", handler);
  }, []);

  useEffect(() => {
    const t = STEP_THEME[Math.min(step, 5) - 1];
    document.documentElement.style.setProperty("--sceneSkyA", t.skyA);
    document.documentElement.style.setProperty("--sceneSkyB", t.skyB);
    document.documentElement.style.setProperty("--sunColor", t.sun);
    document.documentElement.style.setProperty(
      "--sunGlow",
      "rgba(255, 210, 125, 0.55)"
    );
    document.documentElement.style.setProperty("--sunY", t.sunY);
    document.documentElement.style.setProperty(
      "--sceneOpacity",
      String(t.sceneOpacity ?? 0.45)
    );
    document.documentElement.style.setProperty(
      "--raysOpacity",
      String(t.raysOpacity ?? 0.22)
    );
  }, [step]);

  const visible = useMemo(() => {
    const idx = step - 1;
    return {
      assistant: STEP_ASSISTANT[idx],
      user: answers[idx] || "",
      idx,
      canBack: step > 1,
      isFinal: step === 5,
    };
  }, [answers, step]);

  const back = () => {
    if (isSending) return;
    setDraft("");
    setStep((s) => Math.max(1, s - 1));
  };

  const send = async () => {
    if (isSending) return;
    const text = draft.trim();
    if (!text) return;

    setIsSending(true);
    setAnswers((prev) => {
      const next = [...prev];
      next[visible.idx] = text;
      return next;
    });
    setDraft("");

    await new Promise((r) => setTimeout(r, 550));

    setIsSending(false);
    if (step < 5) setStep(step + 1);
  };

  const end = () => setRoute("success");

  return {
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
  };
}


