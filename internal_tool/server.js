// ─── DEV SERVER ──────────────────────────────────────────────────────────────
// Usage:
//   node server.js          (default port 8000)
//   PORT=3000 node server.js

import http   from 'http';
import fs     from 'fs';
import path   from 'path';
import url    from 'url';

// ── Load .env ───────────────────────────────

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

function loadEnv(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {
    console.warn('⚠  No .env file found — keys will be empty strings.');
  }
}

loadEnv(path.join(__dirname, '.env'));

// ── MIME types ────────────────────────────────────────────────────────────────

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
};

// ── Server ────────────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT) || 8000;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  const pathname  = parsedUrl.pathname;

  // ── GET /api/config — return keys to the browser ──────────────────────────
  if (pathname === '/api/config' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      GEMINI_API_KEY:     process.env.GEMINI_API_KEY     || '',
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
    }));
    return;
  }

  // ── Static file serving ───────────────────────────────────────────────────
  let filePath = path.join(__dirname, pathname === '/' ? 'app.html' : pathname);

  // Prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
      return;
    }
    const ext  = path.extname(filePath);
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n  VLM Annotator running at http://localhost:${PORT}\n`);
});
