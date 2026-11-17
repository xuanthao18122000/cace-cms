// Server production cho CMS (không cần thư viện ngoài): phục vụ thư mục dist/ (SPA, mọi đường dẫn lạ → index.html)
// và chuyển tiếp /api, /uploads sang cace-api cùng origin — giống proxy của Vite lúc dev, để cookie refresh (path /api/auth) đi kèm.
// Biến môi trường: PORT (mặc định 5180), HOST (mặc định 0.0.0.0), API_URL (mặc định http://127.0.0.1:4000), UPLOAD_URL (mặc định http://127.0.0.1:4002).
import { createReadStream, statSync } from 'node:fs'
import http from 'node:http'
import { extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = Number(process.env.PORT || 5180)
const HOST = process.env.HOST || '0.0.0.0'
const API_URL = new URL(process.env.API_URL || 'http://127.0.0.1:4000')
const UPLOAD_URL = new URL(process.env.UPLOAD_URL || 'http://127.0.0.1:4002')
const DIST = join(fileURLToPath(new URL('.', import.meta.url)), 'dist')

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
}

/** Thứ tự quan trọng: upload trước /api (giống vite.config.ts) */
function targetFor(url) {
  if (url.startsWith('/api/uploads') || url.startsWith('/uploads')) return UPLOAD_URL
  if (url === '/api' || url.startsWith('/api/')) return API_URL
  return null
}

function proxy(req, res, target) {
  const upstream = http.request(
    {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port,
      method: req.method,
      path: req.url,
      headers: {
        ...req.headers,
        host: target.host,
        'x-forwarded-host': req.headers['x-forwarded-host'] || req.headers.host || '',
        'x-forwarded-proto': req.headers['x-forwarded-proto'] || 'http',
        'x-forwarded-for': [req.headers['x-forwarded-for'], req.socket.remoteAddress].filter(Boolean).join(', '),
      },
    },
    (up) => {
      res.writeHead(up.statusCode || 502, up.headers)
      up.pipe(res)
    },
  )
  upstream.on('error', () => {
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ statusCode: 502, code: 'CACE_BAD_GATEWAY', message: 'Không kết nối được máy chủ API' }))
  })
  req.pipe(upstream)
}

function fileIn(pathname) {
  const decoded = decodeURIComponent(pathname)
  const full = normalize(join(DIST, decoded))
  if (full !== DIST && !full.startsWith(DIST + sep)) return null // chặn ../
  try {
    return statSync(full).isFile() ? full : null
  } catch {
    return null
  }
}

function sendFile(res, file, method) {
  const isAsset = file.includes(`${sep}assets${sep}`)
  res.writeHead(200, {
    'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
    // File trong assets/ có hash trong tên → cache lâu; index.html luôn lấy mới
    'cache-control': isAsset ? 'public, max-age=31536000, immutable' : 'no-cache',
    'x-content-type-options': 'nosniff',
  })
  if (method === 'HEAD') return res.end()
  createReadStream(file).pipe(res)
}

const server = http.createServer((req, res) => {
  const url = req.url || '/'
  const target = targetFor(url)
  if (target) return proxy(req, res, target)

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405).end()
    return
  }
  const pathname = url.split('?')[0]
  let file = null
  try {
    file = fileIn(pathname)
  } catch {
    res.writeHead(400).end()
    return
  }
  // Không phải file tĩnh → trả index.html cho router phía client
  sendFile(res, file || join(DIST, 'index.html'), req.method)
})

server.listen(PORT, HOST, () => {
  console.log(`CACE CMS: http://${HOST}:${PORT} · /api → ${API_URL.origin} · /uploads → ${UPLOAD_URL.origin}`)
})

for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => server.close(() => process.exit(0)))
