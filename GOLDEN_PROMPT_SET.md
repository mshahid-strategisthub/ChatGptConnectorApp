# Aurie Golden Prompt Set (Direct / Indirect / Negative)

Purpose: a labelled dataset you can replay in ChatGPT Developer Mode to measure:
- Precision: did ChatGPT pick the correct tool?
- Recall: did ChatGPT call the tool when it should?

This follows OpenAI’s guidance in “Optimize Metadata”:
- Direct prompts: user explicitly names the app/tool
- Indirect prompts: user intent implies the tool
- Negative prompts: the tool should NOT be called

Reference: https://developers.openai.com/apps-sdk/guides/optimize-metadata

---

## How to use this (quick)

1) Enable your connector in ChatGPT Developer Mode.
2) Start a fresh chat (to reduce caching/memory effects).
3) Paste prompts one-by-one (don’t batch multiple prompts in one message).
4) For each prompt, record:
   - Was a tool called?
   - Which tool name was called?
   - Were arguments correct (especially `text`)?
   - Did the widget render?
5) Iterate metadata one change at a time, re-run the same prompt set.

---

## Expected tool mapping (current)

- Preferred for “messy feelings / grounding” intent:
  - Tool: `aurie.quick_process`
- Preferred for explicit naming of Aurie (direct invocation):
  - Tool: `aurie` (alias)
- For unrelated prompts:
  - Expected: no Aurie tool call

---

## A) Direct prompts (should call Aurie alias)

Expected tool: `aurie`

1. “Aurie, I feel overwhelmed.”
2. “Aurie help me calm down.”
3. “Open Aurie. I’m spiraling.”
4. “Use Aurie for quick processing: I’m anxious.”
5. “Aurie — I need grounding right now.”
6. “Aurie please. My chest feels tight.”
7. “Aurie, I’m panicky.”
8. “Aurie, I feel emotionally stuck.”

---

## B) Indirect prompts (should call aurie.quick_process)

Expected tool: `aurie.quick_process`

Overwhelm / anxiety / spiraling:
1. “I feel overwhelmed.”
2. “I’m anxious and I can’t calm down.”
3. “I can’t stop spiraling.”
4. “My chest feels tight and I can’t think clearly.”
5. “I feel panicky.”
6. “I feel flooded right now.”

Uncertainty / emotional stuckness:
7. “I don’t know why I feel this way.”
8. “Everything feels heavy but I can’t explain it.”
9. “I feel emotionally stuck.”
10. “I feel dysregulated.”

Grounding / settling requests:
11. “I need grounding right now.”
12. “Help me settle down.”
13. “Can you help me calm my nervous system?”
14. “Help me process this.”

Stress / pressure (common user language):
15. “I’m feeling really stressed.”
16. “Work stress is making me panic.”
17. “I feel on edge and I can’t relax.”

---

## C) Negative prompts (should NOT call Aurie)

Expected: no Aurie tool call (ChatGPT should respond normally)

Unrelated general chat:
1. “Tell me a joke.”
2. “Write an email asking for a refund.”
3. “What’s the capital of France?”
4. “Explain React hooks.”
5. “Summarize this article: …”

Shopping / travel:
6. “Find me a hotel in New York.”
7. “What’s the best laptop under $1500?”

Coding:
8. “Fix this TypeScript error: …”
9. “Generate a Prisma schema for these tables: …”

Health info (not quick processing / not emotional regulation):
10. “What are the symptoms of pneumonia?”
11. “What medication should I take for a headache?”

---

## D) Borderline prompts (track disagreements + decide policy)

Goal: decide whether Aurie should trigger here, then update metadata accordingly.

1. “I can’t sleep lately.”
2. “I feel unmotivated and lazy.”
3. “I’m sad.”
4. “I’m having relationship problems.”
5. “I want self-improvement tips.”

Recommendation: keep Aurie narrow (quick processing / grounding). If you want broader “wellness chat” coverage, add a separate tool with separate metadata so you don’t dilute precision for `aurie.quick_process`.


