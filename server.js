const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = process.cwd();

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

  let filePath = path.join(ROOT, reqPath);

  // Auto clean URL resolution (e.g. /pricing -> /pricing.html)
  if (!path.extname(filePath)) {
    if (fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
      filePath = path.join(filePath, 'index.html');
    }
  }

  // Fallback to __dirname if not found in process.cwd()
  if (!fs.existsSync(filePath)) {
    let altPath = path.join(__dirname, reqPath);
    if (!path.extname(altPath)) {
      if (fs.existsSync(altPath + '.html')) {
        altPath = altPath + '.html';
      } else if (fs.existsSync(path.join(altPath, 'index.html'))) {
        altPath = path.join(altPath, 'index.html');
      }
    }
    if (fs.existsSync(altPath)) {
      filePath = altPath;
    }
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
      return res.end('<h1>404 Not Found</h1><p><a href="/">Return Home</a></p>');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });

    fs.createReadStream(filePath).pipe(res);
  });
};

const server = http.createServer(handler);

if (require.main === module || !process.env.VERCEL) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Apex Athletics server running at http://localhost:${PORT}/`);
  });
}

module.exports = handler;
