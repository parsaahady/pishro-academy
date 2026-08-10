<div align="center">
  <img src="assets/pishro-banner.svg" alt="Pishro Hockey Academy" width="100%" />

  # 🐯 Pishro Hockey Academy

  **Skating · Inline Hockey · Ice Hockey**

  <p>A responsive website for Pishro Hockey Academy, including public team pages, player profiles, photo galleries, training plans, and an admin roster panel.</p>

  <a href="https://github.com/parsaahady/pishro-academy">
    <img src="https://readme-typing-svg.demolab.com?font=Space+Grotesk&weight=700&size=22&pause=900&color=FF6F2F&center=true&vCenter=true&width=760&lines=Welcome+to+Pishro+Academy;Inline+Hockey+%C2%B7+Ice+Hockey;Move+%C2%B7+Control+%C2%B7+Play" alt="Animated Pishro Academy tagline" />
  </a>

  ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
  ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
  ![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=flat-square&logo=javascript&logoColor=111111)
  ![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-222222?style=flat-square&logo=github)
</div>

---

## 📌 Overview

Pishro Academy is a static, RTL website built for an ice and inline hockey academy. The site presents the academy's training programs, pricing plans, team structure, achievements, location, equipment consultation, and official player rosters.

The project is built with plain HTML, CSS, and JavaScript. It does not require a framework, package manager, or build step.

## ✨ Main Features

- Responsive RTL layout for Persian content
- Modern sports interface with orange, blue, navy, glass, and chrome-inspired styling
- Pishro tiger branding and academy logo
- Animated hero banner and scroll effects
- Homepage quick navigation cards
- Training programs for:
  - Beginner skating
  - Inline hockey
  - Ice hockey
- Training plans and pricing section
- Team directory with dedicated team pages
- Public player profiles with:
  - Name
  - Age
  - Years of activity
  - Jersey number
  - Position
  - Age group
  - Biography
  - Player image
- Player search on public team pages
- Admin roster management panel
- Player image upload with client-side compression and preview
- Homepage roster preview using the latest registered players
- Team and match photo galleries
- Location section for the outdoor rink near Al-Ghadir Stadium
- FAQ and consultation forms
- GitHub Pages compatible

## 🗂️ Project Structure

```text
pishro-academy/
├── index.html              # Main homepage
├── teams.html              # Public team directory
├── team.html               # Public team/player page
├── admin.html              # Admin login and roster management
├── styles.css              # Global styles and responsive layout
├── app.js                  # Homepage interactions and roster preview
├── teams.js                # Team directory interactions
├── team-page.js            # Public team page logic
├── admin.js                # Admin panel logic
├── admin-config.js         # Local admin credentials
├── assets/
│   ├── pishro-banner.svg   # Animated README banner
│   └── gallery/             # Logos and academy/team photos
└── README.md
```

## 🚀 Run Locally

### Using VS Code Live Server

1. Open the project folder in Visual Studio Code.
2. Install the **Live Server** extension.
3. Right-click `index.html`.
4. Select **Open with Live Server**.

### Using Python

Run this command from the project directory:

```bash
python -m http.server 5500
```

Open the site at:

```text
http://localhost:5500
```

> Run the project through a local HTTP server instead of opening `index.html` directly with `file://`. This provides more reliable navigation, browser storage, and file upload behavior.

## 🔐 Admin Panel

Open the admin panel at:

```text
http://localhost:5500/admin.html
```

Default local credentials:

```text
Username: admin
Password: PishroAdmin!1405
```

To change them, edit `admin-config.js`:

```javascript
const PISHRO_ADMIN_CONFIG = {
  username: 'admin',
  password: 'your-new-password'
};
```

### Managing a Player

1. Sign in to the admin panel.
2. Select a team.
3. Click **Add Player**.
4. Enter the player's details.
5. Upload an optional image.
6. Review the preview.
7. Save the profile.

The player will be available on the selected team's public page and in the roster preview on the homepage.

## 💾 Data Storage

The current version stores player records and compressed player images in the browser's `localStorage`.

As a result:

- Data is stored separately for each browser and device.
- Data is not shared between different users or devices.
- Clearing browser storage removes the stored rosters.
- The current login system is client-side and intended for demonstration/local use.

## 🌐 Deploy with GitHub Pages

1. Create a GitHub repository.
2. Upload the project files to the repository root.
3. Make sure `index.html` is in the root of the repository.
4. Open **Settings → Pages**.
5. Set:
   - **Source:** Deploy from a branch
   - **Branch:** `main`
   - **Folder:** `/ (root)`
6. Click **Save**.

After GitHub finishes the deployment, the site will be available at:

```text
https://<github-username>.github.io/<repository-name>/
```

For `parsaahady/pishro-academy`, the expected URL is:

```text
https://parsaahady.github.io/pishro-academy/
```

The first deployment may take a few minutes.

## ⚠️ Production Notes

GitHub Pages is suitable for the public static website, but it does not provide a secure backend for the admin panel.

For a production deployment, replace the client-side roster system with:

- Server-side authentication
- Password hashing and secure sessions
- A database for teams and players
- Server or cloud storage for player images
- An API for roster management

Do not use the default admin password on a public deployment, and do not store real credentials in a public repository.

## 🛠️ Technology

- HTML5
- CSS3
- Vanilla JavaScript
- SVG
- LocalStorage
- Responsive design
- GitHub Pages

## 📄 License

No open-source license has been added yet. Add a license file before distributing or reusing the project publicly.

<div align="center">
  <br />
  <strong>🐯 Pishro Hockey Academy</strong>
  <br />
  <sub>Move · Control · Play</sub>
</div>
