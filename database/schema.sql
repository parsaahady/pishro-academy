CREATE TABLE IF NOT EXISTS admins (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    username VARCHAR(80) NOT NULL,
    display_name VARCHAR(120) NOT NULL DEFAULT 'Pishro Admin',
    password_hash VARCHAR(255) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    last_login_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_admins_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS teams (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    slug VARCHAR(50) NOT NULL,
    category_key VARCHAR(30) NULL,
    gender ENUM('women','men') NULL,
    name VARCHAR(100) NOT NULL,
    english_name VARCHAR(100) NOT NULL,
    age_range VARCHAR(100) NOT NULL,
    discipline VARCHAR(160) NOT NULL,
    image_path VARCHAR(255) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_teams_slug (slug),
    KEY idx_teams_active_order (is_active, sort_order),
    KEY idx_teams_category_gender (category_key, gender, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS team_gallery_images (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    team_id INT UNSIGNED NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    caption VARCHAR(280) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_team_gallery (team_id, sort_order, id),
    CONSTRAINT fk_team_gallery_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS players (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    team_id INT UNSIGNED NOT NULL,
    name VARCHAR(120) NOT NULL,
    jersey_number TINYINT UNSIGNED NULL,
    age TINYINT UNSIGNED NOT NULL,
    years_active TINYINT UNSIGNED NOT NULL DEFAULT 0,
    position VARCHAR(80) NULL,
    age_group VARCHAR(80) NULL,
    bio TEXT NULL,
    image_path VARCHAR(255) NULL,
    is_published TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_players_team_published (team_id, is_published, updated_at),
    CONSTRAINT fk_players_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coaches (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    role VARCHAR(120) NULL,
    years_active TINYINT UNSIGNED NOT NULL DEFAULT 0,
    specialties VARCHAR(255) NULL,
    bio TEXT NULL,
    image_path VARCHAR(255) NULL,
    is_published TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_coaches_published (is_published, sort_order, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blog_posts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    slug VARCHAR(180) NOT NULL,
    title VARCHAR(220) NOT NULL,
    excerpt VARCHAR(500) NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'training',
    content_html MEDIUMTEXT NOT NULL,
    cover_path VARCHAR(255) NULL,
    status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
    author_id INT UNSIGNED NULL,
    published_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_blog_slug (slug),
    KEY idx_blog_status_published (status, published_at),
    CONSTRAINT fk_blog_author FOREIGN KEY (author_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blog_images (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    post_id BIGINT UNSIGNED NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    alt_text VARCHAR(180) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_blog_images_post (post_id, sort_order),
    CONSTRAINT fk_blog_images_post FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS comments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    post_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NULL,
    body TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    ip_hash CHAR(64) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_comments_post_status (post_id, status, created_at),
    KEY idx_comments_status (status, created_at),
    CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contact_messages (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(40) NOT NULL,
    course VARCHAR(120) NULL,
    message TEXT NULL,
    status ENUM('new', 'read', 'archived') NOT NULL DEFAULT 'new',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_contact_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO teams (slug, category_key, gender, name, english_name, age_range, discipline, image_path, sort_order)
VALUES
    ('novice-women','novice','women','نونهالان بانوان','NOVICE / WOMEN','نونهالان','اسکیت و هاکی','assets/gallery/team-kids.png',101), ('novice-men','novice','men','نونهالان آقایان','NOVICE / MEN','نونهالان','اسکیت و هاکی','assets/gallery/team-kids.png',102),
    ('teen-women','teen','women','نوجوانان بانوان','TEEN / WOMEN','نوجوانان','اسکیت و هاکی','assets/gallery/team-junior-action.jpg',201), ('teen-men','teen','men','نوجوانان آقایان','TEEN / MEN','نوجوانان','اسکیت و هاکی','assets/gallery/team-junior-action.jpg',202),
    ('youth-women','youth','women','جوانان بانوان','YOUTH / WOMEN','جوانان','اسکیت و هاکی','assets/gallery/team-women.png',301), ('youth-men','youth','men','جوانان آقایان','YOUTH / MEN','جوانان','اسکیت و هاکی','assets/gallery/team-champions.jpg',302),
    ('adult-women','adult','women','بزرگسالان بانوان','ADULT / WOMEN','بزرگسالان','اسکیت و هاکی','assets/gallery/team-women.png',401), ('adult-men','adult','men','بزرگسالان آقایان','ADULT / MEN','بزرگسالان','اسکیت و هاکی','assets/gallery/team-champions.jpg',402),
    ('new-women','new','women','ورزشکاران تازه بانوان','NEW ATHLETES / WOMEN','ورزشکاران تازه','اسکیت و هاکی','assets/gallery/open-rink.jpg',501), ('new-men','new','men','ورزشکاران تازه آقایان','NEW ATHLETES / MEN','ورزشکاران تازه','اسکیت و هاکی','assets/gallery/open-rink.jpg',502)
ON DUPLICATE KEY UPDATE name=VALUES(name), english_name=VALUES(english_name), age_range=VALUES(age_range), discipline=VALUES(discipline), image_path=VALUES(image_path), sort_order=VALUES(sort_order);

CREATE TABLE IF NOT EXISTS rate_limits (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    action VARCHAR(40) NOT NULL,
    identifier CHAR(64) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_rate_limits_lookup (action, identifier, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create the first admin through api/setup.php or insert a password_hash
-- generated with PHP password_hash('your-password', PASSWORD_DEFAULT).
