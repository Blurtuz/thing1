import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import WebSocket from 'ws';

let server, origin, cookie;
const password = 'integration-test-password-4927';
before(async () => {
  server = spawn(process.execPath, ['server.mjs'], {
    cwd: new URL('../', import.meta.url),
    env: { ...process.env, PORT: '0', PROXY_PASSWORD: password },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  origin = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Server startup timed out')), 10000);
    server.stdout.on('data', data => {
      const match = String(data).match(/http:\/\/localhost:\d+/);
      if (match) { clearTimeout(timer); resolve(match[0]); }
    });
    server.once('exit', code => { clearTimeout(timer); reject(new Error(`Server exited: ${code}`)); });
  });
});
after(async () => {
  if (server && server.exitCode === null) { server.kill('SIGTERM'); await once(server, 'exit'); }
});

test('health check and prebuilt browser assets are served with isolation headers', async () => {
  for (const path of ['/healthz', '/', '/scram/scramjet.all.js', '/scram/scramjet.wasm.wasm', '/libcurl/index.mjs', '/baremux/worker.js', '/sw.js']) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get('cross-origin-opener-policy'), 'same-origin');
    assert.equal(response.headers.get('cross-origin-embedder-policy'), 'require-corp');
    if (path.endsWith('.wasm')) assert.match(response.headers.get('content-type'), /application\/wasm/);
    await response.arrayBuffer();
  }
});
test('login rejects the wrong password and foreign origins', async () => {
  for (const [requestOrigin, candidate, expected] of [[origin, 'wrong', 401], ['https://other.invalid', password, 403]]) {
    const response = await fetch(origin + '/api/login', { method: 'POST', headers: { origin: requestOrigin, 'content-type': 'application/json' }, body: JSON.stringify({ password: candidate }) });
    assert.equal(response.status, expected);
  }
});
test('login creates an authenticated HttpOnly session', async () => {
  const response = await fetch(origin + '/api/login', { method: 'POST', headers: { origin, 'content-type': 'application/json', 'x-forwarded-proto': 'https' }, body: JSON.stringify({ password }) });
  assert.equal(response.status, 200);
  const setCookie = response.headers.get('set-cookie');
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=Strict/);
  assert.match(setCookie, /Secure/);
  cookie = setCookie.split(';')[0];
  const session = await fetch(origin + '/api/session', { headers: { cookie } });
  assert.equal((await session.json()).authenticated, true);
});
async function rejectedSocket(headers, expected) {
  await new Promise((resolve, reject) => {
    const socket = new WebSocket(origin.replace('http:', 'ws:') + '/wisp/', { headers });
    socket.once('open', () => { socket.close(); reject(new Error('Unexpectedly accepted relay connection')); });
    socket.once('unexpected-response', (request, response) => {
      response.resume(); request.destroy();
      try { assert.equal(response.statusCode, expected); resolve(); } catch (error) { reject(error); }
    });
    socket.on('error', () => {});
  });
}
test('the relay rejects unauthenticated and foreign-origin connections', { timeout: 10000 }, async () => {
  await rejectedSocket({ origin }, 403);
  await rejectedSocket({ origin: 'https://other.invalid', cookie }, 403);
});
test('authenticated Wisp works and refuses server-local destinations', { timeout: 10000 }, async () => {
  const socket = new WebSocket(origin.replace('http:', 'ws:') + '/wisp/', { headers: { origin, cookie } });
  await new Promise((resolve, reject) => {
    let sent = false;
    socket.on('error', reject);
    socket.on('message', packet => {
      if (packet[0] === 3 && !sent) {
        sent = true;
        const host = Buffer.from('localhost');
        const connect = Buffer.alloc(8 + host.length);
        connect[0] = 1; connect.writeUInt32LE(1, 1); connect[5] = 1; connect.writeUInt16LE(80, 6); host.copy(connect, 8);
        socket.send(connect);
      }
      if (packet[0] === 4 && packet.readUInt32LE(1) === 1) {
        try { assert.equal(packet[5], 0x48); resolve(); } catch (error) { reject(error); }
      }
    });
  });
  socket.close();
});
test('locking clears the cookie and closes established relay sockets', { timeout: 10000 }, async () => {
  const socket = new WebSocket(origin.replace('http:', 'ws:') + '/wisp/', { headers: { origin, cookie } });
  await once(socket, 'open');
  const closed = once(socket, 'close');
  const response = await fetch(origin + '/api/logout', { method: 'POST', headers: { origin, cookie } });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie'), /Max-Age=0/);
  await closed;
});
