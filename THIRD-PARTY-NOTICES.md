# Third-party notices

Proxy Lab’s application code is distributed under AGPL-3.0-only; see LICENSE. The service-worker integration and asset/transport arrangement are adapted from the [Mercury Workshop Scramjet example](https://github.com/MercuryWorkshop/Scramjet-App), which is distributed under the GNU Affero General Public License. Changes include a new interface, signed password sessions, origin checks, restricted relay destinations and ports, connection diagnostics, tests, and setup documentation.

Direct components installed from the lockfile:

| Component | Pinned version | Declared license / source |
|---|---|---|
| Scramjet | 1.1.0 release archive | MIT, as declared by this release’s package metadata; [source](https://github.com/MercuryWorkshop/scramjet/tree/v1.1.0) |
| bare-mux | 2.1.9 | MIT; [source](https://github.com/MercuryWorkshop/bare-mux) |
| libcurl-transport | 1.5.2 | AGPL-3.0-only; [source](https://github.com/MercuryWorkshop/libcurl-transport) |
| wisp-js | 0.4.1 | AGPL-3.0, as declared by the installed package; [source](https://github.com/MercuryWorkshop/wisp-js) |
| Fastify | 5.7.4 | MIT; [source](https://github.com/fastify/fastify) |
| @fastify/static | 9.0.0 | MIT; [source](https://github.com/fastify/fastify-static) |
| ws (test dependency) | 8.18.3 | MIT; [source](https://github.com/websockets/ws) |

Each dependency retains its own license and notices in the installed package. The lockfile also includes transitive dependencies, including libcurl.js. Consult those packages for their respective notices. This project does not replace their licenses.

The public `/source.zip` download contains this application’s source, lockfile, notices, and instructions for obtaining the pinned dependencies. It excludes passwords, environment files, and installed dependencies.
