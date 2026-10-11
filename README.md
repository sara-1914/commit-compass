# ✳ CommitCompass

**A polished GitHub profile explorer for curious developers.**

CommitCompass turns a public GitHub username into a clean dashboard with profile details, repository cards, star/fork counts, language snapshots, and a few lightweight profile signals.

## ✨ Features

- Search any public GitHub username — no login or API key required.
- Profile card with avatar, bio, location, company, and account age.
- Quick stats: public repositories, followers, following, and stars found.
- Language snapshot based on repository metadata and approximate repository sizes.
- Repository shelf with filtering and sorting by stars, last updated, or name.
- Load more repositories without leaving the page.
- Responsive layout for mobile, tablet, and desktop.
- Accessible labels, useful error messages, and no third-party JavaScript dependencies.

## 🚀 Run it locally

This is a static front-end project, so there is no install step.

1. Download or clone this repository.
2. Open `index.html` in a browser.

For the most reliable local development experience, run a simple static server:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.

## 🌐 Publish with GitHub Pages

1. Create a repository on GitHub named `commitcompass` (or any name you prefer).
2. Upload `index.html`, `style.css`, `app.js`, and this `README.md` to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Choose your main branch and `/ (root)`, then save.
6. Wait for GitHub Pages to publish your site.

## 🧭 How it works

The app calls GitHub's public REST API:

- `GET /users/{username}` for profile details.
- `GET /users/{username}/repos?per_page=100&sort=updated&type=owner` for repository metadata.

The language chart is an estimate based on the repository size values and language labels returned by the API. It is not a byte-accurate language breakdown. GitHub can apply unauthenticated rate limits, so try again later if you hit one.

## 🗂 Project structure

```text
CommitCompass/
├── index.html   # Page structure and content
├── style.css    # Theme, layout, and responsive styling
├── app.js       # GitHub API calls and dashboard behavior
├── README.md    # Setup and publishing guide
└── LICENSE      # MIT license
```

## 🛠 Built with

- HTML5
- CSS3
- Vanilla JavaScript
- GitHub REST API

## 💡 Ideas for future improvements

- Compare two developer profiles side by side.
- Add repository topic chips and pinned project support.
- Cache recent searches locally.
- Add downloadable profile summaries.
- Offer an optional personal access token for higher API limits (never commit tokens to a public repository).

## 📄 License

Released under the MIT License. See `LICENSE`.

---

Made for developers who love exploring how people build things.
