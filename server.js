const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff'
};

const handler = (req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  // Search in both __dirname and process.cwd()
  let candidates = [
    path.join(__dirname, reqPath),
    path.join(process.cwd(), reqPath)
  ];

  // If no extension, add .html candidates
  if (!path.extname(reqPath)) {
    candidates.unshift(
      path.join(__dirname, reqPath + '.html'),
      path.join(process.cwd(), reqPath + '.html')
    );
  }

  let finalPath = candidates.find(p => {
    try {
      return fs.existsSync(p) && fs.statSync(p).isFile();
    } catch (_) {
      return false;
    }
  });

  if (!finalPath) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
    return res.end('<h1>404 Not Found</h1><p><a href="/">Return to Apex Athletics</a></p>');
  }

  const ext = path.extname(finalPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  res.writeHead(200, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*'
  });

  fs.createReadStream(finalPath).pipe(res);
};

const server = http.createServer(handler);

if (require.main === module || !process.env.VERCEL) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Apex Athletics server running at http://localhost:${PORT}/`);
  });
}

module.exports = handler;
