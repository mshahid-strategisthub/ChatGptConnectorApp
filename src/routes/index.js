/**
 * Mount all HTTP routes on the Express app.
 */

import { mountAuthRoutes } from '../authServer.js';
import { mountWidgetRoutes } from './widget.js';
import { mountDiscoveryRoutes } from './discovery.js';
import { mountMcpRoutes } from './mcp.js';

export function mountRoutes(app, handlers) {
  const { handleMcpTransport } = handlers;

  mountWidgetRoutes(app);
  mountAuthRoutes(app, '/auth');
  mountMcpRoutes(app, handleMcpTransport);
  mountDiscoveryRoutes(app);
}
