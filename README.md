<div align="center">
  <img src="assets/pishro-banner.svg" alt="Pishro Hockey Academy" width="100%" />

  # 🐯 Pishro Hockey Academy

  **Skating · Inline Hockey · Ice Hockey**

  <p>A responsive academy website with public team pages, player profiles, galleries, training plans, and a database-backed admin panel.</p>

  <a href="https://github.com/parsaahady/pishro-academy">
    <img src="https://readme-typing-svg.demolab.com?font=Space+Grotesk&weight=700&size=22&pause=900&color=FF6F2F&center=true&vCenter=true&width=760&lines=Welcome+to+Pishro+Academy;Inline+Hockey+%C2%B7+Ice+Hockey;Move+%C2%B7+Control+%C2%B7+Play" alt="Animated Pishro Academy tagline" />
  </a>

  ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
  ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
  ![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=flat-square&logo=javascript&logoColor=111111)
  ![PHP](https://img.shields.io/badge/PHP-8.2%2B-777BB4?style=flat-square&logo=php&logoColor=white)
  ![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=flat-square&logo=mysql&logoColor=white)
</div>

---

## Overview

Pishro Academy is a Persian RTL website for a skating and hockey academy. The project combines a static frontend with a PHP/MySQL backend for roster management, player images, admin authentication, and contact requests.

The public website contains the academy presentation, training programs, pricing plans, teams, achievements, location, equipment consultation, FAQ, and team galleries. The private admin panel manages player records stored in MySQL.

## Features

### Public website

- Responsive RTL layout for desktop, tablet, and mobile
- Pishro tiger branding and academy logo
- Animated hero banner and page transitions
- Homepage quick navigation
- Beginner skating, inline hockey, and ice hockey programs
- Training plans and pricing section
- Team directory and dedicated team pages
- Public player profiles with:
  - Name
  - Age
  - Years of activity
  - Jersey number
  - Position
  - Age group
  - Biography
  - Player image
- Player search
- Team and match photo galleries
- Location section for the outdoor rink near Al-Ghadir Stadium
- Consultation and contact forms
- Homepage roster preview loaded from the backend API

### Admin panel

- Server-side login using PHP sessions
- Password verification with `password_hash()` / `password_verify()`
- CSRF protection for admin write requests
- Login rate limiting per session
- Secure player creation, editing, and deletion
- Server-side input validation
- JPG, PNG, and WebP image validation
- Maximum upload size enforcement
- Randomized image filenames
- Upload directory protected against script execution
- Team-based roster management
- Player image preview and removal
- Database-backed roster statistics

## Project Structure

```text
pishro-academy/
├── index.html
├── teams.html
├── team.html
├── admin.html
├── styles.css
├── api-client.js
├── app.js
├── teams.js
├── team-page.js
├── admin.js
├── api/
│   ├── config.example.php
│   ├── bootstrap.php
│   ├── auth.php
│   ├── setup.php
│   ├── auth/
│   │   ├── login.php
│   │   ├── logout.php
│   │   └── me.php
│   ├── public/
│   │   ├── teams.php
│   │   ├── players.php
│   │   ├── stats.php
│   │   ├── contact.php
│   │   └── player-image.php
│   └── admin/
│       └── players.php
├── database/
│   ├── schema.sql
│   └── .htaccess
├── uploads/
│   └── players/
│       └── .htaccess
├── assets/
│   ├── pishro-banner.svg
│   └── gallery/
└── README.md
```

## Requirements

- PHP 8.2 or newer
- PDO MySQL extension
- MySQL 5.7+ or MariaDB 10.4+
- Apache or Nginx
- HTTPS in production
- Writable `uploads/players` directory

## Local Development

The frontend can be viewed with a static server, but the admin panel and database API require PHP and MySQL.

### Frontend preview only

```bash
python -m http.server 5500
```

Open:

```text
http://localhost:5500
```

### Backend development

Use a PHP-enabled local environment such as XAMPP, Laragon, MAMP, Docker, or a PHP development server.

The database must be created and `api/config.php` must be configured before using the admin panel.

## Server Setup

### 1. Create the database

Create a MySQL database and database user in cPanel or your hosting panel. Grant the user full permissions for the new database.

### 2. Configure the API

Copy the example configuration:

```text
api/config.example.php → api/config.php
```

Edit `api/config.php`:

```php
return [
    'db' => [
        'host' => 'localhost',
        'name' => 'your_database_name',
        'user' => 'your_database_user',
        'pass' => 'your_database_password',
        'charset' => 'utf8mb4',
    ],
    'app' => [
        'cookie_secure' => true,
        'max_upload_bytes' => 3 * 1024 * 1024,
        'upload_dir' => dirname(__DIR__) . '/uploads/players',
        'upload_url' => 'uploads/players',
        'setup_enabled' => true,
        'setup_token' => 'replace-with-a-long-random-token',
    ],
];
```

`api/config.php` is ignored by Git and must not be committed to a public repository.

### 3. Upload the project

Upload the contents of the project to the document root of the domain, usually:

```text
public_html/
```

The following files must be directly inside the document root:

```text
public_html/index.html
public_html/admin.html
public_html/api/
public_html/assets/
```

### 4. Create the tables and first admin

The schema is available at:

```text
database/schema.sql
```

You can import it through phpMyAdmin. Alternatively, use the one-time setup endpoint after configuring `api/config.php`:

```bash
curl -X POST "https://your-domain.com/api/setup.php?token=YOUR_SETUP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","display_name":"Pishro Admin","password":"replace-with-a-strong-password"}'
```

After setup succeeds:

1. Set `setup_enabled` to `false` in `api/config.php`.
2. Delete `api/setup.php` from the server.
3. Keep the admin password private.

### 5. Set upload permissions

The web server must be able to write to:

```text
uploads/players/
```

The directory should not allow PHP or other scripts to execute. The included `.htaccess` file blocks common script extensions.

## Admin Panel

Open:

```text
https://your-domain.com/admin.html
```

The login is checked by the PHP backend. The browser does not contain the admin password.

From the panel, an administrator can:

1. Select a team.
2. Add a player.
3. Upload a JPG, PNG, or WebP image.
4. Edit player information.
5. Remove a player or player image.
6. Search the current roster.

The public team pages read the same data from the API, so changes made in the admin panel are visible to all visitors.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/login.php` | Admin login |
| `POST` | `/api/auth/logout.php` | End admin session |
| `GET` | `/api/auth/me.php` | Check current session |
| `GET` | `/api/public/teams.php` | List active teams |
| `GET` | `/api/public/players.php?team=kids` | Public team roster |
| `GET` | `/api/public/stats.php` | Roster statistics |
| `POST` | `/api/public/contact.php` | Store consultation request |
| `GET` | `/api/admin/players.php?team=kids` | Admin roster |
| `POST` | `/api/admin/players.php` | Create or update player |
| `DELETE` | `/api/admin/players.php?id=123` | Delete player |

Admin write requests require an authenticated session and a valid CSRF token.

## GitHub Pages

GitHub Pages can host the public static frontend, but it cannot run the PHP API or MySQL database.

For the complete version with a working admin panel, deploy the project to a PHP/MySQL host. GitHub can remain the source-code repository.

If you only want to publish the public frontend on GitHub Pages:

1. Push the project files to a GitHub repository.
2. Open **Settings → Pages**.
3. Select **Deploy from a branch**.
4. Select the `main` branch and `/ (root)`.
5. Save the configuration.

Expected URL for `parsaahady/pishro-academy`:

```text
https://parsaahady.github.io/pishro-academy/
```

The backend endpoints will not work on GitHub Pages.

## Security Notes

- Do not commit `api/config.php`.
- Do not use the setup token after installation.
- Delete `api/setup.php` after creating the first admin.
- Use HTTPS in production and set `cookie_secure` to `true`.
- Use a strong, unique admin password.
- Keep the database user password private.
- Keep the upload directory protected from script execution.
- Take regular database and upload backups.

## Technology

- HTML5
- CSS3
- Vanilla JavaScript
- PHP 8.2+
- PDO MySQL
- MySQL / MariaDB
- SVG
- Session-based authentication
- GitHub Pages compatible frontend

## License

No open-source license has been added yet. Add a license before distributing or reusing the project publicly.

<div align="center">
  <br />
  <strong>🐯 Pishro Hockey Academy</strong>
  <br />
  <sub>Move · Control · Play</sub>
</div>
