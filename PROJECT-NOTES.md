# Notes for your school project

Use these notes to explain the experiment in your own words. Fill in observations from the school network; do not present the local checks as school-network results.

## Question

Can an externally hosted browser-based proxy load a teacher-listed website that the school network blocks when visited directly?

## Hypothesis

If the filter denies a destination but permits both the proxy address and its WebSocket connection, moving the outgoing connection to an external server may allow the destination to load inside the proxy. If the proxy address, its transport, or the required browser features are blocked, that hypothesis may fail on the tested device.

## Method

1. Deploy the supplied app outside the school network using SETUP.md.
2. Confirm the proxy loads a destination on an unrestricted connection.
3. On the school device, visit a teacher-listed destination directly. Record the visible result.
4. Open the deployed proxy address on the same device and network.
5. Run its connection checks, then open the same destination inside its viewer.
6. Record whether the homepage, navigation, and media work separately. Keep the date and device consistent when comparing results.

## What to record

| Date and device | Destination | Direct visit result | Proxy visit result | Which features worked? | Error / evidence |
|---|---|---|---|---|---|
| Fill in | twitch.tv | Not yet tested at school | Not yet tested at school | Homepage / navigation / video | Fill in |
| Fill in | amazon.com | Not yet tested at school | Not yet tested at school | Homepage / links / search | Fill in |
| Fill in | Another teacher-listed site | Fill in | Fill in | Fill in | Fill in |

## Why new proxy sites keep appearing

Open-source components already implement the difficult parts: rewriting web code and transporting requests. A new operator can combine those components with a small server and another hosting address. A blocklist of previously identified proxy addresses therefore requires continued updates. This experiment examines that pattern; it does not prove every filter is easy to bypass.

## Why some attempts fail

A basic iframe still asks the browser to contact the target directly. Changing its URL or removing one header does not automatically relay all of a page’s scripts, image requests, cookies, and WebSocket connections. A browser proxy needs both the rewrite layer and a working relay, and browser policies or destination-side restrictions can still prevent it from working.

## Possible conclusions

If direct browsing fails while the same page loads inside the proxy, the result demonstrates a successful alternative route for that site, device, network, and time. If both fail, report the diagnostic evidence. Distinguish a blocked relay from a destination that rejects the server’s IP or a page feature the proxy engine cannot handle.

Do not generalize a single success into “all filters can be bypassed.” A useful defensive discussion can cover destination filtering, identification of proxy services, managed browser controls, and reviewing traffic patterns. The appropriate combination depends on the actual filtering system.

## Attribution

The proxy engine is [Scramjet](https://github.com/MercuryWorkshop/scramjet); the relay uses [Wisp](https://github.com/MercuryWorkshop/wisp-js). The app follows the [official example](https://github.com/MercuryWorkshop/Scramjet-App). This project adds a classroom interface, authenticated access, diagnostics, deployment instructions, and a test procedure. Acknowledge the open-source components and any AI assistance according to your class’s rules.
