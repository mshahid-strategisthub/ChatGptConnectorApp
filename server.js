import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'crypto';
import * as z from 'zod/v4';
import { allTools } from './src/aurieTool.js';
import { getServerPaths } from './src/paths.js';
import {
  AURA_CHAT_WIDGET_URI,
  AURA_CHAT_WIDGET_ASSET_BASE_TOKEN,
  loadWidgetTemplate,
  renderWidgetHtml,
} from './src/widgetResource.js';
import { registerDemoAudioProxy } from './src/audioProxy.js';
import { registerAssetRoutes } from './src/assets.js';

const app = express();

const PUBLIC_WIDGET_DOMAIN =
  process.env.WIDGET_BASE_URL;
const PRIVACY_POLICY_URL = 'https://www.aurie.ai/privacy-policy';
const SUPPORT_EMAIL = 'hello@aurie.ai';

global.widgetBaseUrl = process.env.WIDGET_BASE_URL || 'http://localhost:8000';

const { widgetTemplatePath, widgetsDistPath } = getServerPaths();
const widgetTemplateHtml = loadWidgetTemplate(widgetTemplatePath);

function jsonSchemaToZodRawShape(schema) {
const shape = {};
const props = schema?.properties && typeof schema.properties === 'object' ? schema.properties : {};
const required = Array.isArray(schema?.required) ? schema.required : [];

for (const [key, prop] of Object.entries(props)) {
const type = prop?.type;
let field;
switch (type) {
case 'string':
field = z.string();
break;
case 'number':
field = z.number();
break;
case 'integer':
field = z.number().int();
break;
case 'boolean':
field = z.boolean();
break;
case 'array':
field = z.array(z.any());
break;
case 'object':

field = z.any();
break;
default:
field = z.any();
break;
}

if (typeof prop?.description === 'string' && prop.description.trim()) {
field = field.describe(prop.description);
}

if (!required.includes(key)) {
field = field.optional();
}

shape[key] = field;
}

return shape;
}

const mcpServer = new McpServer({
name: 'aurie-in-chatgpt',
version: '1.0.0',
instructions:
[
  'Aurie-in-ChatGPT: Aurie is a narrow, contained Quick Processing utility.',
  'It helps a user feel steadier in the moment and then returns them to the chat.',
  '',
  'Routing guidance:',
  '- Prefer calling `aurie.quick_process` when the user expresses overwhelm/anxiety/spiraling/emotional stuckness and asks for grounding or help processing.',
  '- Use the `aurie` alias only when the user explicitly names Aurie.',
  '- Do not call Aurie for unrelated requests.',
].join('\\n'),
});

// Register the Skybridge widget resource so ChatGPT can render it via `openai/outputTemplate`.
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
  // Required for submission/broad distribution: unique app domain for the widget sandbox.
  'openai/widgetDomain': PUBLIC_WIDGET_DOMAIN,
  // Widget sandbox CSP allowlist. Our widget loads assets from /assets on the same domain.
  'openai/widgetCSP': {
    connect_domains: [PUBLIC_WIDGET_DOMAIN],
    resource_domains: [PUBLIC_WIDGET_DOMAIN],
  },
  // Optional: helps reduce redundant narration below the widget.
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
_meta:
tool.opensWidget
  ? {
// Instruct ChatGPT to render the Skybridge widget template
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
const result = await tool.handler(args || {});
const responseText =
result?.response || result?.message || "Here's what I found.";

const response = {
content: [{ type: 'text', text: responseText }],
// Keep the full result available for any client that wants to parse it.
structuredContent: result,
};


if (tool.opensWidget) {
const initialText =
typeof args?.text === 'string' ? args.text : '';
response.toolOutput = { initial_text: initialText, widgetSessionId };
}

console.log(`📤 [RESPONSE] Sending response with ${response.content.length} content items`);
console.log(`\n`);

return response;
}
);
});

// Base URL used inside the widget HTML to build absolute asset URLs.
// Derived from each incoming request so it works with Cloudflare tunnels and other proxies.
// (kept for env visibility; the widget uses `global.widgetBaseUrl` set per request.)
async function handleMCPTransport(request, response) {
// Extract the base URL from the request (Cloudflare tunnel URL)
const protocol = request.headers['x-forwarded-proto'] || (request.secure ? 'https' : 'http');
const host = request.headers['x-forwarded-host'] || request.headers.host;

console.log(`\n🌐 [MCP] Request received`);
console.log(` Protocol: ${protocol}`);
console.log(` Host: ${host}`);
console.log(` Headers:`, JSON.stringify({
'x-forwarded-proto': request.headers['x-forwarded-proto'],
'x-forwarded-host': request.headers['x-forwarded-host'],
'host': request.headers.host
}, null, 2));

global.widgetBaseUrl = `${protocol}://${host}`;
console.log(`🌐 [MCP] Widget base URL: ${global.widgetBaseUrl}`);

const transport = new StreamableHTTPServerTransport({
sessionIdGenerator: undefined,
});

response.on('close', () => {
transport.close();
});

await mcpServer.connect(transport);
await transport.handleRequest(request, response, request.body);
}

app.use(cors({
origin: '*',
methods: ['GET', 'POST', 'OPTIONS'],
allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
credentials: false,
exposedHeaders: ['Content-Type'],
}));

app.options('*', cors());

app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
if (req.path === '/mcp') {
console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
}
next();
});

registerDemoAudioProxy(app);
registerAssetRoutes(app, widgetsDistPath);

app.post('/mcp', async (req, res) => {
res.setTimeout(0);

try {
console.log(`\n${'='.repeat(60)}`);
console.log(`[${new Date().toISOString()}] 📨 MCP POST Request received`);
console.log(` Path: ${req.path}`);
console.log(` Method: ${req.method}`);
console.log(` Request body:`, JSON.stringify(req.body, null, 2));
console.log(`${'='.repeat(60)}\n`);

await handleMCPTransport(req, res);

console.log(`\n✅ [MCP] Response sent successfully\n`);
return;
} catch (error) {
console.error(`\n❌ [MCP] Endpoint error:`, error);
console.error(` Stack:`, error.stack);
if (!res.headersSent) {
res.status(500).json({
error: { code: -32603, message: 'Internal server error' },
id: randomUUID(),
jsonrpc: '2.0',
});
}
}
});

app.get('/mcp', (req, res) => {
res.json({
name: 'aura-wellness',
version: '1.0.0',
protocol: 'mcp',
endpoint: '/mcp',
privacy_policy_url: PRIVACY_POLICY_URL,
support_email: SUPPORT_EMAIL,
});
});

app.get('/health', (req, res) => {
res.json({ status: 'ok', service: 'aura-mcp-server' });
});

app.get('/', (req, res) => {
res.json({
service: 'Aura MCP Server',
version: '1.0.0',
endpoints: {
mcp: '/mcp',
health: '/health',
assets: '/assets',
},
ngrok: 'Make sure ngrok is running and use the ngrok URL in ChatGPT',
});
});

const HTTP_PORT = process.env.MCP_HTTP_PORT || 8000;

const server = app.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log("process.env.WIDGET_BASE_URL", process.env.WIDGET_BASE_URL);

console.log(`✅ MCP HTTP server running on port ${HTTP_PORT}`);
console.log(`📦 Widget assets served from /assets`);
console.log(`🔗 MCP endpoint: http://localhost:${HTTP_PORT}/mcp`);

});

server.timeout = 0;
server.keepAliveTimeout = 30000;
server.headersTimeout = 31000;

server.on('error', (error) => {
console.error('❌ Server error:', error);
});

server.on('clientError', (error, socket) => {
console.error('❌ Client error:', error.message);
socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

setInterval(() => {
console.log(`[${new Date().toISOString()}] 💓 Server heartbeat - still running`);
}, 60000);

export { app };