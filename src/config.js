/**
 * Server config from env. Single place for ports, URLs, and constants.
 */

const HTTP_PORT = process.env.MCP_HTTP_PORT || 8000;
const WIDGET_BASE_URL = process.env.WIDGET_BASE_URL || `http://localhost:${HTTP_PORT}`;
const MCP_PUBLIC_URL = process.env.MCP_PUBLIC_URL || WIDGET_BASE_URL;
const AUTH_SERVER_URL =
  process.env.AUTH_SERVER_URL || (MCP_PUBLIC_URL ? `${MCP_PUBLIC_URL.replace(/\/$/, '')}/auth` : null);

export const config = {
  HTTP_PORT,
  WIDGET_BASE_URL,
  MCP_PUBLIC_URL,
  AUTH_SERVER_URL,
  PRIVACY_POLICY_URL: 'https://www.aurie.ai/privacy-policy',
  SUPPORT_EMAIL: 'hello@aurie.ai',
};
