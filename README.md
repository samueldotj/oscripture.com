# scripture-translation-ministry-website
## Updating photos and Field News (admins)

Go to **https://oscripture.com/admin**, sign in, and pick **Website → Photo Gallery** or **Website → Field News**.
Click **Save** and the site updates in about a minute. Any photo size is fine: it is shrunk before upload
and cropped to fit the design automatically.

- Photos live in `img/`; the list of gallery photos is `data/gallery.json`.
- News posts live in `data/news.json` (the story is Markdown). The section is hidden while there are no posts.
- `.github/workflows/optimize-images.yml` shrinks any photo over 1600 px or 350 KB that reaches `img/`
  by another route (for example, an upload on github.com).

### One-time setup (site owner)

1. **Give each admin access:** GitHub repo → Settings → Collaborators → add their GitHub account (Write role).
2. **Optional "Sign In with GitHub" button** (otherwise admins use "Sign In Using Access Token"):
   - GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
     Homepage URL `https://oscripture.com`, callback URL `https://oscripture.com/api/callback`.
   - In Vercel → Project → Settings → Environment Variables, add `GITHUB_CLIENT_ID` and
     `GITHUB_CLIENT_SECRET` from that app, then redeploy.
