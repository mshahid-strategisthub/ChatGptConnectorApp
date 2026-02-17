export function registerDemoAudioProxy(app) {
  app.options('/assets/demo-track.mp3', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Range');
    res.header('Access-Control-Expose-Headers', 'Accept-Ranges, Content-Range, Content-Length, Content-Type');
    res.status(204).end();
  });

  app.get('/assets/demo-track.mp3', async (req, res) => {
    try {
      const upstreamUrl = 'https://audio.cdn.aurahealth.io/1748947538869nathan-williams-i-believe-in-myself_edited.mp3';
      const range = req.headers.range;

      const upstreamRes = await fetch(upstreamUrl, {
        headers: range ? { Range: range } : undefined,
      });

      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Range');
      res.header('Access-Control-Expose-Headers', 'Accept-Ranges, Content-Range, Content-Length, Content-Type');

      const ct = upstreamRes.headers.get('content-type') || 'audio/mpeg';
      const cl = upstreamRes.headers.get('content-length');
      const cr = upstreamRes.headers.get('content-range');
      const ar = upstreamRes.headers.get('accept-ranges') || 'bytes';

      res.status(upstreamRes.status);
      res.setHeader('Content-Type', ct);
      res.setHeader('Accept-Ranges', ar);
      if (cl) res.setHeader('Content-Length', cl);
      if (cr) res.setHeader('Content-Range', cr);
      res.setHeader('X-Content-Type-Options', 'nosniff');

      if (!upstreamRes.body) {
        res.end();
        return;
      }

      const reader = upstreamRes.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
      res.end();
    } catch (e) {
      res.header('Access-Control-Allow-Origin', '*');
      res.status(502).send('Failed to fetch demo audio');
    }
  });
}


