const baseInputSchema = {
  type: 'object',
  properties: {
    text: {
      type: 'string',
      description:
        [
          "The user's current message (what they're feeling right now).",
          'Include the full text (even if messy).',
          'Examples:',
          '- "I feel overwhelmed and I can’t focus."',
          '- "My chest feels tight and I’m spiraling."',
          '- "I need grounding right now."',
        ].join('\n'),
    },
  },
  required: ['text'],
};

export const aurieQuickProcessTool = {
  name: 'aurie.quick_process',
  opensWidget: true,
  description: [
    'Use this when the user is emotionally flooded or dysregulated and wants quick grounding / settling in the moment.',
    '',
    'This opens the Aurie Quick Processing widget (a short, contained flow) and returns the user back to the chat.',
    '',
    'Use for prompts like:',
    '- "I feel overwhelmed."',
    '- "I’m anxious and can’t calm down."',
    '- "I can’t stop spiraling."',
    '- "I feel emotionally stuck."',
    '- "I don’t know why I feel this way."',
    '- "Everything feels heavy but I can’t explain it."',
    '- "I need grounding right now."',
    '- "Help me process this."',
    '- "My chest feels tight and I can’t think clearly."',
    '',
    'Do NOT use for:',
    '- general life coaching / long plans / habit tracking',
    '- medical advice, diagnosis, or treatment',
    '- unrelated requests (jokes, coding, shopping, etc.)',
    '',
    'Important: pass the user message through as `text` exactly as written.',
  ].join('\n'),
  inputSchema: baseInputSchema,
  handler: async (args) => {
    const text = typeof args?.text === 'string' ? args.text : '';
    return {
      response: 'Opening Aurie Quick Processing…',
      initial_text: text,
    };
  },
};

export const aurieAliasTool = {
  name: 'aurie',
  opensWidget: true,
  description: [
    'Aurie (alias) — opens Aurie Quick Processing.',
    '',
    'Use this when the user explicitly names Aurie, like:',
    '- "Aurie, I feel overwhelmed."',
    '- "Open Aurie — I’m spiraling."',
    '- "Aurie help me calm down."',
    '',
    'If the user does not explicitly name Aurie, prefer `aurie.quick_process`.',
  ].join('\n'),
  inputSchema: baseInputSchema,
  handler: aurieQuickProcessTool.handler,
};

export const allTools = [aurieQuickProcessTool, aurieAliasTool];


