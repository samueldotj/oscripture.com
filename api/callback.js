// Step 2 of "Sign In with GitHub": GitHub sends the admin back here with a code.
// We swap it for a token and hand the token to the /admin window that opened this
// popup, using the message format Sveltia/Decap CMS expects. The token is only ever
// sent to this site's own origin, never to another website.

function readCookie(req, name) {
  const header = req.headers.cookie || "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return "";
}

function page(status, payload) {
  // JSON-encode and stop "</script>" from ending the script block early.
  const data = JSON.stringify({ status, payload }).replace(/</g, "\\u003c");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Signing in…</title></head>
<body><p>Signing in… you can close this window if it stays open.</p>
<script>
(function () {
  var d = ${data};
  var host = location.hostname.replace(/^www\\./, "");
  var allowed = ["https://" + host, "https://www." + host];
  if (location.protocol === "http:") allowed.push(location.origin);
  var msg = "authorization:github:" + d.status + ":" + JSON.stringify(d.payload);
  function receive(e) {
    if (allowed.indexOf(e.origin) === -1) return;
    window.removeEventListener("message", receive);
    window.opener.postMessage(msg, e.origin);
  }
  if (!window.opener) { document.body.textContent = "Please start sign-in from the admin page."; return; }
  window.addEventListener("message", receive, false);
  window.opener.postMessage("authorizing:github", "*");
})();
</script></body></html>`;
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  // Clear the one-time state cookie.
  res.setHeader("Set-Cookie", "osm_oauth_state=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0");

  const { code, state } = req.query || {};
  const expected = readCookie(req, "osm_oauth_state");
  if (!code || !state || !expected || state !== expected) {
    res.status(400).send(page("error", { message: "Sign-in expired or was not started here. Please try again." }));
    return;
  }

  try {
    const r = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const data = await r.json();
    if (!data.access_token) {
      res.status(401).send(page("error", { message: data.error_description || "GitHub did not return a token." }));
      return;
    }
    res.status(200).send(page("success", { token: data.access_token, provider: "github" }));
  } catch (e) {
    res.status(500).send(page("error", { message: "Could not reach GitHub. Please try again." }));
  }
};
