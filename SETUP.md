# Setup: get an HTTPS address you can open at school

Do the setup on a computer where GitHub and Render are accessible. You need an account on each service. The school computer only needs to visit the deployed website afterward; it does not need Node.js, an extension, or proxy settings.

## 1. Extract the download

Unzip `proxy-lab.zip`. Open the resulting `proxy-lab` folder. You should see `package.json`, `package-lock.json`, `server.mjs`, `public`, and this guide. Upload the extracted contents, not the ZIP file itself.

## 2. Put the project in GitHub

1. Sign in to [GitHub](https://github.com).
2. Create a repository named `school-proxy-lab`. You can keep it private.
3. In the repository’s upload screen, drag in the files and folders **inside** the extracted `proxy-lab` folder. If you already initialized the repository, choose **Add file → Upload files**. A new empty repository also offers an upload link.
4. Make sure `package.json` is at the top level of the repository, alongside `server.mjs`. Keep the `public` and `test` folders intact. Do not upload `node_modules` or a real `.env` file.
5. Commit the upload. If your file picker hides dotfiles, that is okay for the Render steps below: the build command explicitly disables install scripts, and you will set the Node version in Render.

Reference: [GitHub’s file upload instructions](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository).

## 3. Create the hosting service

1. Sign in to [Render](https://dashboard.render.com).
2. Select **New → Web Service**.
3. Connect your GitHub account if needed and select the `school-proxy-lab` repository.
4. Use these settings:

| Setting | Value |
|---|---|
| Name | An available name of your choice |
| Branch | The branch containing your upload, normally `main` |
| Root Directory | Leave blank if `package.json` is at the repository root |
| Language / Runtime | **Node** |
| Build Command | `npm ci --omit=dev --ignore-scripts` |
| Start Command | `npm start` |
| Instance Type | **Free**, if available for your account |
| Health Check Path | `/healthz`, if the option is shown |

5. Under environment variables, add:

| Key | Value |
|---|---|
| `NODE_VERSION` | `24.22.1` |
| `PROXY_PASSWORD` | Your own password, at least 16 characters long |

Choose the password yourself. Do not use a school, email, or shopping-account password, and do not paste it into GitHub. Leave `PORT` unset; the app reads the port supplied by Render.

6. Select **Create Web Service** or **Deploy Web Service**, whichever your dashboard shows.
7. Wait for the deployment to report **Live**. The logs should show `Proxy Lab: http://localhost:...`; this is an internal listening address. Use the **https://...onrender.com** address shown at the top of the service page to visit your website.

These settings follow [Render’s Node guide](https://render.com/docs/deploy-node-express-app). Its [WebSocket documentation](https://render.com/docs/websocket) confirms support for the connection used by the relay. A Static Site service cannot run this server.

Alternative: `render.yaml` contains the same configuration for Render’s Blueprint flow. The manual flow above is sufficient; do not create both services.

## 4. Check it outside school first

1. Open the service’s HTTPS address.
2. Enter your `PROXY_PASSWORD` in the lab’s password field.
3. Select **Check connection**. The details should show a secure context, available workers, cross-origin isolation, a signed-in session, and a successful relay handshake.
4. Select **Example.com**. Inspect the actual page in the large viewer. A “frame loaded” message alone is not a successful destination test; the frame can also display an error.
5. Try **Twitch** and **Amazon**, and record whether the homepage, links, and any media you test work. Success loading a homepage does not establish that video, sign-in, or checkout works.

## 5. Run the classroom comparison

1. On the school computer, visit a teacher-listed destination directly and record the result.
2. Open **your deployed lab’s HTTPS address** in another tab.
3. Unlock it, run **Check connection**, and enter the same destination in the lab’s address field.
4. Record what actually appears, the date, and any error. Repeat for the other teacher-listed sites. Use the table in PROJECT-NOTES.md.

The proxy only affects browsing inside its viewer. Entering `twitch.tv` in the browser’s normal address bar still makes a direct connection.

## Troubleshooting

| Symptom | What to check |
|---|---|
| Build says `only-allow pnpm` | The build command must include `--ignore-scripts`. |
| Start says to set a password | Set `PROXY_PASSWORD` to a unique value of at least 16 characters; replace the example text. Then redeploy. |
| Render cannot find `package.json` | Upload the inner project files at the repository root, or set Root Directory to the folder containing them. |
| Page takes a while to open | A free Render service sleeps after 15 minutes without traffic and may take about a minute to wake. See [Render’s free-service limits](https://render.com/docs/free). |
| Service worker unavailable | Use HTTPS. Managed browser policies can also disable service workers. |
| Cross-origin isolation fails | Check that the server’s COOP/COEP headers reach the browser. The supplied server sends them automatically. |
| Relay handshake fails | Confirm the session is unlocked. The network must allow the site’s secure WebSocket connection. |
| Lab itself shows the school block page | The network is blocking the lab’s address. This build cannot guarantee access through that policy. Record that result. |
| Example.com works, another site fails | The destination may reject a hosting IP, require a CAPTCHA, use unsupported browser features, or have a proxy-engine compatibility issue. Read the frame’s error rather than assuming the school caused it. |
| Video fails but homepage works | Media can use separate hosts or protected playback features. A homepage test does not establish video support. |

Free Render resources have bandwidth and outgoing-traffic limits. Use a short demonstration rather than a prolonged livestream, and inspect the dashboard’s usage page. Check current limits before selecting any paid option.

## Optional: Docker

On a computer or server with Docker installed, create your `.env` file as described in README.md, then run from the project folder:

```sh
docker build -t school-proxy-lab .
docker run --rm -p 8080:8080 --env-file .env school-proxy-lab
```

Visit `http://localhost:8080` on that same computer. Hosting this container for other computers requires an HTTPS endpoint that supports WebSocket upgrades. The Render steps above provide that without configuring a reverse proxy yourself.

## Finish

When the demonstration is over, lock the lab and suspend or delete the Render service if you no longer need it. Keep your source and results for the submission. The lab’s **Project source** link provides its application source and notices for attribution.
