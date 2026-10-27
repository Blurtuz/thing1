'use strict';
const $ = id => document.getElementById(id);
let controller, connection, frame, initialized;
function status(message, error = false) {
  $('status').textContent = message;
  $('status').classList.toggle('error', error);
}
function showSession(authenticated) {
  $('login').hidden = authenticated;
  $('workspace').hidden = !authenticated;
  $('logout').hidden = !authenticated;
  $('intro').hidden = authenticated;
}
function destination(input) {
  const value = input.trim();
  if (!value || /\s/.test(value)) throw new Error('Enter a website address, for example twitch.tv.');
  const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Enter an HTTP or HTTPS website address.');
  return url.href;
}
async function initialize() {
  if (initialized) return initialized;
  initialized = (async () => {
    if (!isSecureContext) throw new Error('Use your server’s HTTPS address. HTTP works only on localhost.');
    if (!navigator.serviceWorker) throw new Error('This browser does not allow service workers, which this proxy needs.');
    if (!crossOriginIsolated) throw new Error('Cross-origin isolation is unavailable. Check the COOP/COEP response headers.');
    if (!window.SharedWorker) throw new Error('This browser does not allow SharedWorker, which this version needs.');
    if (typeof $scramjetLoadController !== 'function' || !window.BareMux) throw new Error('Proxy engine files did not load. Check the server build logs.');
    const { ScramjetController } = $scramjetLoadController();
    controller = new ScramjetController({
      prefix: '/service/',
      files: { wasm: '/scram/scramjet.wasm.wasm', all: '/scram/scramjet.all.js', sync: '/scram/scramjet.sync.js' },
    });
    await controller.init();
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('The service worker did not take control. Reload this page.')), 12000);
      navigator.serviceWorker.addEventListener('controllerchange', () => { clearTimeout(timer); resolve(); }, { once: true });
    });
    connection = new BareMux.BareMuxConnection('/baremux/worker.js');
    const relay = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/wisp/`;
    await connection.setTransport('/libcurl/index.mjs', [{ websocket: relay }]);
  })();
  try { await initialized; }
  catch (error) { initialized = null; throw error; }
}
async function navigate(input) {
  $('go').disabled = true;
  try {
    const url = destination(input);
    $('address').value = url;
    status('Preparing the proxy connection…');
    await initialize();
    if (!frame) {
      frame = controller.createFrame();
      frame.frame.title = 'Proxied website';
      frame.frame.allow = 'fullscreen; autoplay; encrypted-media; picture-in-picture';
      // A frame load is not proof that the target page worked: report that distinction.
      frame.frame.addEventListener('load', () => status('The frame loaded. Check its contents to confirm the destination worked.'));
      $('viewer').replaceChildren(frame.frame);
    }
    frame.go(url);
    status(`Opening ${new URL(url).hostname} through the relay…`);
  } catch (error) { status(error.message, true); }
  finally { $('go').disabled = false; }
}
$('login').addEventListener('submit', async event => {
  event.preventDefault();
  const button = $('login').querySelector('button');
  button.disabled = true;
  try {
    const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: $('password').value }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not sign in.');
    $('password').value = '';
    showSession(true);
    status('Lab unlocked. Start with Example.com, then try a site from your project list.');
    $('address').focus();
  } catch (error) { status(error.message, true); }
  finally { button.disabled = false; }
});
$('navigate').addEventListener('submit', event => { event.preventDefault(); navigate($('address').value); });
document.querySelectorAll('[data-url]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.url)));
$('back').addEventListener('click', () => { if (frame) frame.back(); });
$('reload').addEventListener('click', () => { if (frame) frame.reload(); });
$('logout').addEventListener('click', async () => {
  // Closing the tab also closes any relay connections already established by this page.
  await fetch('/api/logout', { method: 'POST' });
  location.reload();
});
async function diagnose() {
  $('diagnose').disabled = true;
  const lines = [
    `Secure context: ${isSecureContext ? 'yes' : 'NO — use HTTPS'}`,
    `Service workers: ${'serviceWorker' in navigator ? 'available' : 'unavailable'}`,
    `Cross-origin isolated: ${crossOriginIsolated ? 'yes' : 'NO — check response headers'}`,
    `SharedWorker: ${window.SharedWorker ? 'available' : 'unavailable'}`,
  ];
  $('diagnostics').open = true;
  try {
    const response = await fetch('/api/session');
    const session = await response.json();
    lines.push(`Signed-in session: ${session.authenticated ? 'yes' : 'NO — unlock again'}`);
    await new Promise((resolve, reject) => {
      const socket = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/wisp/`);
      const timer = setTimeout(() => { socket.close(); reject(new Error('timed out')); }, 10000);
      socket.onmessage = () => { clearTimeout(timer); socket.close(); resolve(); };
      socket.onerror = () => { clearTimeout(timer); reject(new Error('connection failed or was blocked')); };
    });
    lines.push('Relay WebSocket handshake and Wisp greeting: passed');
    await initialize();
    lines.push('Proxy engine and transport initialized: passed');
    lines.push('Destination test: open Example.com and inspect the page.');
    status('Connection checks finished. The destination page is a separate test.');
  } catch (error) { lines.push(`Check failed: ${error.message}`); status(error.message, true); }
  finally { $('report').textContent = lines.join('\n'); $('diagnose').disabled = false; }
}
$('diagnose').addEventListener('click', diagnose);
(async () => {
  try {
    const response = await fetch('/api/session');
    if (!response.ok) throw new Error('The server did not respond.');
    const session = await response.json();
    showSession(session.authenticated);
    status(session.authenticated ? 'Lab unlocked. Choose a destination.' : 'Enter the project password you set on the server.');
  } catch (error) { status(error.message, true); }
})();
