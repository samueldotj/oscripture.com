// Step 1 of "Sign In with GitHub" for the admin panel (/admin).
// Runs as a free Vercel serverless function. Needs two environment variables in
// Vercel: GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET (from a GitHub OAuth App whose
// callback URL is https://oscripture.com/api/callback).
const crypto = require("crypto");

module.exports = (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    res.status(500).send('GitHub sign-in is not set up yet. Close this window and use "Sign In with Token".');
    return;
  }

  const state = crypto.randomBytes(16).toString("hex");
  res.setHeader(
    "Set-Cookie",
    `osm_oauth_state=${state}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  );

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  // The repository is public, so write access to public repos is all that is needed.
  url.searchParams.set("scope", "public_repo");
  url.searchParams.set("state", state);
  res.redirect(302, url.toString());
};
