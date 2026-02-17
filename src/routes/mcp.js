/**
 * MCP HTTP endpoint: GET (info) and POST (transport).
 */

import { randomUUID } from 'crypto';
import { config } from '../config.js';
import { runWithRequestContext } from '../requestContext.js';

export function mountMcpRoutes(app, handleMcpTransport) {
  app.post('/mcp', async (req, res) => {
    res.setTimeout(0);
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`[${new Date().toISOString()}] 📨 MCP POST Request received`);
      console.log(` Path: ${req.path}  Method: ${req.method}`);
      console.log(`${'='.repeat(60)}\n`);

      await runWithRequestContext(
        { authorization: req.headers.authorization },
        () => handleMcpTransport(req, res)
      );

      console.log(`\n✅ [MCP] Response sent successfully\n`);
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
      privacy_policy_url: config.PRIVACY_POLICY_URL,
      support_email: config.SUPPORT_EMAIL,
    });
  });
}
