import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { server as wisp, logging } from '@mercuryworkshop/wisp-js/server';
import { scramjetPath } from '@mercuryworkshop/scramjet/path';
import { libcurlPath } from '@mercuryworkshop/libcurl-transport';
import { baremuxPath } from '@mercuryworkshop/bare-mux/node';

const password = process.env.PROXY_PASSWORD || '';
if (password.length < 16 || password.includes('replace-this')) {
  console.error('Set PROXY_PASSWORD to your own password of at least 16 characters. See README.md.');
  process.exit(1);
}
const cookieName = 'proxy_lab_session';
const hash = value => createHash('sha256').update(value).digest();
const sign = value => createHmac('sha256', password).update(value).digest('hex');
function authorized(req) {
  const token = (req.headers.cookie || '').split(';').map(s => s.trim())
    .find(s => s.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
  if (!token) return false;
  const [expires, signature, extra] = token.split('.');
  if (extra || !/^\d+$/.test(expires) || !/^[a-f0-9]{64}$/.test(signature || '')) return false;
  return Number(expires) > Date.now() && timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(sign(expires), 'hex'));
}
function sameOrigin(req) {
  try { return new URL(req.headers.origin).host === req.headers.host; }
  catch { return false; }
}
function sessionCookie(req, value, maxAge) {
  const secure = req.socket.encrypted || req.headers['x-forwarded-proto'] === 'https';
  return `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

// Public web ports only. The relay cannot connect to its own machine or private networks.
logging.set_level(logging.ERROR);
Object.assign(wisp.options, {
  allow_udp_streams: false,
  allow_direct_ip: false,
  allow_private_ips: false,
  allow_loopback_ips: false,
  port_whitelist: [80, 443],
  stream_limit_total: 128,
  // wisp-js 0.4.1 has a broken per-host limiter; keep it disabled.
  stream_limit_per_host: -1,
  dns_result_order: 'ipv4first',
});

const app = Fastify({ logger: false, bodyLimit: 4096 });
app.addHook('onSend', async (request, reply) => {
  reply.header('Cross-Origin-Opener-Policy', 'same-origin');
  reply.header('Cross-Origin-Embedder-Policy', 'require-corp');
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('Referrer-Policy', 'same-origin');
  reply.header('Cache-Control', 'no-store');
});

// The homepage/assets are public; every usable relay connection requires a signed session.
app.get('/healthz', async () => ({ status: 'ok' }));
app.get('/api/session', async request => ({ authenticated: authorized(request.raw) }));
const attempts = new Map();
const limitTimer = setInterval(() => {
  for (const [ip, state] of attempts) if (state.until < Date.now()) attempts.delete(ip);
}, 60_000).unref();
app.post('/api/login', async (request, reply) => {
  if (!sameOrigin(request.raw)) return reply.code(403).send({ error: 'Open this page on the proxy’s own address.' });
  const ip = request.raw.socket.remoteAddress;
  let state = attempts.get(ip);
  if (!state || state.until < Date.now()) state = { count: 0, until: Date.now() + 600_000 };
  if (state.count >= 10) return reply.code(429).send({ error: 'Too many attempts. Wait ten minutes and try again.' });
  state.count++;
  attempts.set(ip, state);
  const candidate = typeof request.body?.password === 'string' ? request.body.password : '';
  if (!timingSafeEqual(hash(candidate), hash(password))) return reply.code(401).send({ error: 'That password did not match.' });
  attempts.delete(ip);
  const expires = String(Date.now() + 8 * 60 * 60 * 1000);
  reply.header('Set-Cookie', sessionCookie(request.raw, `${expires}.${sign(expires)}`, 28800));
  return { authenticated: true };
});
app.post('/api/logout', async (request, reply) => {
  if (!sameOrigin(request.raw)) return reply.code(403).send({ error: 'Invalid origin.' });
  for (const [socket, cookie] of sockets) if (cookie === request.raw.headers.cookie) socket.destroy();
  reply.header('Set-Cookie', sessionCookie(request.raw, '', 0));
  return { authenticated: false };
});

for (const [root, prefix] of [
  [fileURLToPath(new URL('./public/', import.meta.url)), '/'],
  [scramjetPath, '/scram/'], [libcurlPath, '/libcurl/'], [baremuxPath, '/baremux/'],
]) {
  app.register(fastifyStatic, { root, prefix, decorateReply: prefix === '/' });
}

const sockets = new Map();
app.server.on('upgrade', (req, socket, head) => {
  if (req.url !== '/wisp/') return socket.end('HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n');
  if (!authorized(req) || !sameOrigin(req)) return socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
  sockets.set(socket, req.headers.cookie);
  socket.on('error', () => socket.destroy());
  socket.once('close', () => sockets.delete(socket));
  try { wisp.routeRequest(req, socket, head); }
  catch { socket.destroy(); }
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => {
  clearInterval(limitTimer);
  for (const socket of sockets.keys()) socket.destroy();
  await app.close();
});

try {
  await app.listen({ port: Number(process.env.PORT || 8080), host: '0.0.0.0' });
  console.log(`Proxy Lab: http://localhost:${app.server.address().port}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
