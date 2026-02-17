
# ChatGPT Connector

## How to run

1. **Install dependencies**
   ```bash
   npm i
   ```

2. **Build the widget**
   ```bash
   npm run widget:build
   ```

3. **Start the dev server**
   ```bash
   npm run dev
   ```

4. **Connect in ChatGPT**
   - Run a Cloudflare tunnel pointing to your app.
   - In ChatGPT, use the tunnel URL with `/mcp` (e.g. `https://your-tunnel-url/mcp`) to connect the app.
