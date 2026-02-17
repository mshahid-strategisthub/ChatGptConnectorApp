import express from 'express';

export function registerAssetRoutes(app, widgetsDistPath) {
  app.use(
    '/assets',
    (req, res, next) => {
      console.log(`📦 [ASSETS] Request: ${req.method} ${req.path}`);
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Range');
      res.header('Access-Control-Expose-Headers', 'Accept-Ranges, Content-Range, Content-Length, Content-Type');
      next();
    },
    express.static(widgetsDistPath, {
      setHeaders: (res, filePath) => {
        // Set proper content types
        if (filePath.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript');
          console.log(`📦 [ASSETS] Serving JS: ${filePath}`);
        } else if (filePath.endsWith('.html')) {
          res.setHeader('Content-Type', 'text/html');
          console.log(`📦 [ASSETS] Serving HTML: ${filePath}`);
        } else if (filePath.endsWith('.mp3')) {
          res.setHeader('Content-Type', 'audio/mpeg');
        }
        // Add security headers for widgets
        res.setHeader('X-Content-Type-Options', 'nosniff');
      },
    })
  );
}


