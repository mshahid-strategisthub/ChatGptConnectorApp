/**
 * MCP server setup: create server, register widget resource and tools, return transport handler.
 */

import { randomUUID } from 'crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { getServerPaths } from '../paths.js';
import {
  AURA_CHAT_WIDGET_URI,
  loadWidgetTemplate,
  renderWidgetHtml,
} from '../widgetResource.js';
import { allTools } from '../aurieTool.js';
import { jsonSchemaToZodRawShape } from './schema.js';

export function createMcpServer(options) {
  const { widgetDomain } = options;
  const { widgetTemplatePath } = getServerPaths();
  const widgetTemplateHtml = loadWidgetTemplate(widgetTemplatePath);

  const mcpServer = new McpServer({
    name: 'aurie-in-chatgpt',
    version: '1.0.0',
    instructions: [
      'Aurie-in-ChatGPT: Aurie is a narrow, contained Quick Processing utility.',
      'It helps a user feel steadier in the moment and then returns them to the chat.',
      '',
      'Routing guidance:',
      '- Prefer calling `aurie.quick_process` when the user expresses overwhelm/anxiety/spiraling/emotional stuckness and asks for grounding or help processing.',
      '- Use the `aurie` alias only when the user explicitly names Aurie.',
      '- Do not call Aurie for unrelated requests.',
    ].join('\\n'),
  });

  mcpServer.registerResource(
    'aura-chat-widget',
    AURA_CHAT_WIDGET_URI,
    {},
    async () => ({
      contents: [
        {
          uri: AURA_CHAT_WIDGET_URI,
          mimeType: 'text/html+skybridge',
          text: renderWidgetHtml(widgetTemplateHtml, global.widgetBaseUrl),
          _meta: {
            'openai/widgetPrefersBorder': true,
            'openai/widgetDomain': widgetDomain,
            'openai/widgetCSP': {
              connect_domains: [widgetDomain],
              resource_domains: [widgetDomain],
            },
            'openai/widgetDescription':
              'Aurie Quick Processing: a short, contained flow to help a user feel steadier in the moment and return to the chat.',
          },
        },
      ],
    })
  );

  allTools.forEach((tool) => {
    mcpServer.registerTool(
      tool.name,
      {
        title: tool.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        description: tool.description,
        inputSchema: jsonSchemaToZodRawShape(tool.inputSchema),
        _meta: tool.opensWidget
          ? {
              'openai/outputTemplate': AURA_CHAT_WIDGET_URI,
              'openai/resultCanProduceWidget': true,
              'openai/toolInvocation/invoking': 'Opening Aurie…',
              'openai/toolInvocation/invoked': 'Aurie ready.',
            }
          : undefined,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          openWorldHint: false,
        },
      },
      async (args) => {
        console.log(`\n🔧 [TOOL CALL] ${tool.name}`);
        console.log(`📥 Args:`, JSON.stringify(args, null, 2));

        const widgetSessionId = randomUUID();
        const result = await tool.handler(args || {}, { widgetSessionId });
        const responseText = result?.response || result?.message || "Here's what I found.";

        const response = {
          content: [{ type: 'text', text: responseText }],
          structuredContent: result,
        };

        if (tool.opensWidget) {
          const initialText = typeof args?.text === 'string' ? args.text : '';
          response.toolOutput = {
            initial_text: initialText,
            widgetSessionId,
            first_reply: result?.first_reply ?? null,
            conversationId: result?.conversationId ?? null,
            dialogueId: result?.dialogueId ?? null,
            connect_required: result?.connect_required === true,
          };
        }

        console.log(`📤 [RESPONSE] Sending response with ${response.content.length} content items\n`);
        return response;
      }
    );
  });

  async function handleTransport(request, response) {
    const protocol = request.headers['x-forwarded-proto'] || (request.secure ? 'https' : 'http');
    const host = request.headers['x-forwarded-host'] || request.headers.host;

    console.log(`\n🌐 [MCP] Request received  Protocol: ${protocol}  Host: ${host}`);
    global.widgetBaseUrl = `${protocol}://${host}`;
    console.log(`🌐 [MCP] Widget base URL: ${global.widgetBaseUrl}`);

    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    response.on('close', () => transport.close());

    await mcpServer.connect(transport);
    await transport.handleRequest(request, response, request.body);
  }

  return { handleTransport };
}
