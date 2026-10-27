# Proxy Lab

A runnable browser-based proxy for a school network experiment. It uses a pinned Scramjet 1.1.0 engine, libcurl transport, bare-mux, and a Wisp relay. The interface and authenticated server wrapper are provided in this project. It is based on the architecture in the [maintainers’ example application](https://github.com/MercuryWorkshop/Scramjet-App), rather than pretending that an iframe by itself is a proxy.

**Start with SETUP.md for the exact hosting steps.** You need your own GitHub and Render accounts to get a public HTTPS address. This download is not already deployed.

## How it works

```text
School browser → your hosted lab (HTTPS + WSS) → destination website
                 Scramjet + Wisp                 Amazon / Twitch / etc.
```

1. The browser downloads the lab from your server.
2. Scramjet registers a service worker and rewrites destination pages, including their scripts and resource URLs.
3. bare-mux connects Scramjet to the libcurl transport. libcurl runs in the browser and sends traffic through the Wisp WebSocket connection to your server.
4. Wisp opens the outgoing connection from the server’s network. Responses return over the same connection.

If a network blocks direct access to a destination but allows your lab address and its connection, this route can allow the destination page to load. It does not guarantee success: the lab domain can be blocked, WebSockets can be denied, managed browser policies can disable workers, and the destination can reject the hosting provider’s IP address. URL encoding is not encryption. A managed device can still inspect browser activity.

I could not identify a specific filter product from the name “ckf01.” This project does not claim a product-specific exploit.

## Run on your own computer

Install Node.js 24 from [nodejs.org](https://nodejs.org/en/download). Open a terminal in this folder, then:

```sh
npm ci --ignore-scripts
```

Copy `.env.example` to `.env` and replace the example password with your own password of at least 16 characters. On macOS/Linux you can copy it with `cp .env.example .env`; on Windows Command Prompt use `copy .env.example .env`. Then:

```sh
npm start
```

Open **http://localhost:8080** and enter that password. Start with the Example.com button. The app uses HTTPS automatically when hosted. A school computer cannot reach `localhost` on your home computer; use the hosted HTTPS address described in SETUP.md.

The prebuilt Scramjet package includes a pnpm-only installation guard. `--ignore-scripts` avoids that guard; the required browser bundles and WebAssembly files are already built. No build step is needed for this app. The lockfile pins the installed dependencies.

## Tests

```sh
npm test
```

Tests start a separate server automatically. They verify asset delivery, the required response headers, rejected logins, session cookies, protected WebSocket upgrades, rejection of server-local destinations, and closing relay connections on logout. These do not simulate your school filter. Browser checks and their limits are recorded in VERIFICATION.md.

## Files

- `server.mjs`: HTTP server, password sessions, static engine assets, and Wisp relay.
- `public/app.js`: browser initialization, address bar, and connection checks.
- `public/sw.js`: Scramjet service worker.
- `render.yaml`: optional Render Blueprint configuration.
- `Dockerfile`: alternative container deployment.
- `SETUP.md`: account-to-browser hosting instructions and troubleshooting.
- `PROJECT-NOTES.md`: explanation and an experiment table for your report.
- `THIRD-PARTY-NOTICES.md` and `LICENSE`: attribution and licensing.

The password is required so the deployed relay is not open to everyone. Sessions last eight hours. The relay permits public HTTP/HTTPS ports only and rejects private/loopback destinations and direct IP literals. Application request logging is disabled; your hosting provider can still retain infrastructure logs. Avoid using personal shopping or payment accounts during the demonstration.

`npm start` refreshes the public source download before starting the server. It includes project files and excludes `.env` and installed dependencies. Restart after editing application source to refresh that download.

## Sources

Checked October 27, 2026:

- [Scramjet official repository](https://github.com/MercuryWorkshop/scramjet)
- [Scramjet example application and pinned package](https://github.com/MercuryWorkshop/Scramjet-App)
- [Wisp JavaScript server API](https://github.com/MercuryWorkshop/wisp-js)
- [bare-mux repository](https://github.com/MercuryWorkshop/bare-mux) — archived; deliberately retained for compatibility with this pinned Scramjet release, rather than mixing incompatible major versions.
- [libcurl transport](https://github.com/MercuryWorkshop/libcurl-transport)
- [Render Node deployment](https://render.com/docs/deploy-node-express-app)
- [Render WebSockets](https://render.com/docs/websocket)
- [Render free service limits](https://render.com/docs/free)

This is a project built using existing open-source proxy components, not a claim to have invented the underlying proxy engine. Credit those components and describe your own experiment in your school submission.
