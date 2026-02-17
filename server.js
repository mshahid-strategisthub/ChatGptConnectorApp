import 'dotenv/config';

import express from 'express';
import cors from 'cors';

import { config } from './src/config.js';
import { getServerPaths } from './src/paths.js';
import { mountRoutes } from './src/routes/index.js';
import { createMcpServer } from './src/mcp/index.js';
import { registerDemoAudioProxy } from './src/audioProxy.js';
import { registerAssetRoutes } from './src/assets.js';

const app = express();
const { widgetsDistPath } = getServerPaths();

global.widgetBaseUrl = config.WIDGET_BASE_URL;

const { handleTransport } = createMcpServer({
  widgetDomain: process.env.WIDGET_BASE_URL,
});

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: false,
    exposedHeaders: ['Content-Type'],
  })
);
app.options('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use((req, res, next) => {
  if (req.path === '/mcp') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

registerDemoAudioProxy(app);
registerAssetRoutes(app, widgetsDistPath);

mountRoutes(app, { handleMcpTransport: handleTransport });

const server = app.listen(config.HTTP_PORT, '0.0.0.0', () => {
  console.log(`process.env.WIDGET_BASE_URL`, process.env.WIDGET_BASE_URL);
  console.log(`✅ MCP HTTP server running on port ${config.HTTP_PORT}`);
  console.log(`📦 Widget assets served from /assets`);
  console.log(`🔗 MCP endpoint: http://localhost:${config.HTTP_PORT}/mcp`);
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
