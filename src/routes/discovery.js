/**
 * Discovery, health, and root routes.
 * OAuth: GET /.well-known/oauth-protected-resource tells ChatGPT where the auth server is (used for "link account").
 */

import { config } from '../config.js';

export function mountDiscoveryRoutes(app) {
  app.get('/.well-known/oauth-protected-resource', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const body = {
      resource: config.MCP_PUBLIC_URL.replace(/\/$/, ''),
      authorization_servers: config.AUTH_SERVER_URL
        ? [config.AUTH_SERVER_URL.replace(/\/$/, '')]
        : [],
      scopes_supported: ['openid', 'aurie:quick_process'],
    };
    if (config.AUTH_SERVER_URL) body.resource_documentation = 'https://www.aurie.ai';
    res.json(body);
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'aura-mcp-server' });
  });

  app.get('/', (req, res) => {
    res.json({
      service: 'Aura MCP Server',
      version: '1.0.0',
      endpoints: { mcp: '/mcp', health: '/health', assets: '/assets' },
    });
  });
}
