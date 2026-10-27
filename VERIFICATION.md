# Verification record

Checked locally on October 27, 2026, using Node.js 24.22.1 and the Codex in-app Chromium browser. The app was running at `http://localhost:8080`; localhost permits the required worker features without a production TLS certificate.

## Automated checks

`npm test`: **6 passed, 0 failed**.

- Health endpoint and browser engine assets return HTTP 200.
- COOP/COEP headers are present; the WebAssembly asset uses the correct MIME type.
- Wrong-password and foreign-origin login attempts are rejected.
- Login produces a signed HttpOnly session cookie, with Secure on the HTTPS deployment path.
- Unauthenticated and foreign-origin relay connections are rejected.
- Authenticated Wisp communicates and rejects a request to server-local `localhost:80`.
- Locking the lab clears its cookie and closes matching open relay sockets.

The checks above are grouped into six automated test cases.

A separate fresh installation also passed using the hosting commands `npm ci --omit=dev --ignore-scripts` and `npm start`. The health endpoint and automatically generated source ZIP both returned HTTP 200.

## Browser checks

| Check | Observed result |
|---|---|
| Login | Password accepted; address bar and viewer displayed. |
| Connection checks | Secure context, service workers, cross-origin isolation, SharedWorker, signed-in session, relay greeting, and transport initialization all passed. |
| Example.com over HTTPS | Destination content rendered inside a rewritten `/service/…` URL on the proxy origin. |
| Amazon homepage | Amazon navigation, search field, categories, and homepage content rendered inside the proxy viewer. Some resource rendering can vary. No account sign-in, purchase, or checkout tested. |
| Twitch homepage | Homepage, channel links, and player controls rendered in the viewer. |
| Twitch video | The video element was playing (`paused: false`, `readyState: 4`), at about 24 seconds, with 1280×720 video dimensions. This establishes local playback during the check, not reliable playback on all networks. |

## Configuration fix discovered during testing

`wisp-js` 0.4.1’s optional per-host stream limiter attempted to iterate an object as an array and crashed when enabled. The project keeps that optional setting disabled and retains a total per-connection stream limit of 128. The successful browser checks above used the corrected configuration.

## Not verified

- A hosted deployment on a user-owned Render account.
- Whether the school permits the future hosting address or its WebSocket connection.
- Whether the school device allows the required service worker and SharedWorker features.
- The identity or configuration of a filter called “ckf01.”
- Account sign-in, CAPTCHA flows, protected media, purchases, or every page on either destination.
- Docker image execution; a compatible Docker runtime was not available for this check.

The supplied code is runnable and fetched real destination content locally. The school-network comparison remains an experiment to perform and document after deployment.
