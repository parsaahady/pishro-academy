-- Pishro: five age/team categories, each split into women and men.
-- Run this ONCE after database/schema.sql. Existing teams and players are intentionally untouched.

ALTER TABLE teams ADD COLUMN category_key VARCHAR(30) NULL AFTER slug;
ALTER TABLE teams ADD COLUMN gender ENUM('women','men') NULL AFTER category_key;
ALTER TABLE teams ADD KEY idx_teams_category_gender (category_key, gender, is_active);

INSERT INTO teams (slug, category_key, gender, name, english_name, age_range, discipline, image_path, sort_order, is_active) VALUES
('novice-women','novice','women','نونهالان بانوان','NOVICE / WOMEN','نونهالان','اسکیت و هاکی','assets/gallery/team-kids.png',101,1),
('novice-men','novice','men','نونهالان آقایان','NOVICE / MEN','نونهالان','اسکیت و هاکی','assets/gallery/team-kids.png',102,1),
('teen-women','teen','women','نوجوانان بانوان','TEEN / WOMEN','نوجوانان','اسکیت و هاکی','assets/gallery/team-junior-action.jpg',201,1),
('teen-men','teen','men','نوجوانان آقایان','TEEN / MEN','نوجوانان','اسکیت و هاکی','assets/gallery/team-junior-action.jpg',202,1),
('youth-women','youth','women','جوانان بانوان','YOUTH / WOMEN','جوانان','اسکیت و هاکی','assets/gallery/team-women.png',301,1),
('youth-men','youth','men','جوانان آقایان','YOUTH / MEN','جوانان','اسکیت و هاکی','assets/gallery/team-champions.jpg',302,1),
('adult-women','adult','women','بزرگسالان بانوان','ADULT / WOMEN','بزرگسالان','اسکیت و هاکی','assets/gallery/team-women.png',401,1),
('adult-men','adult','men','بزرگسالان آقایان','ADULT / MEN','بزرگسالان','اسکیت و هاکی','assets/gallery/team-champions.jpg',402,1),
('new-women','new','women','ورزشکاران تازه بانوان','NEW ATHLETES / WOMEN','ورزشکاران تازه','اسکیت و هاکی','assets/gallery/open-rink.jpg',501,1),
('new-men','new','men','ورزشکاران تازه آقایان','NEW ATHLETES / MEN','ورزشکاران تازه','اسکیت و هاکی','assets/gallery/open-rink.jpg',502,1)
ON DUPLICATE KEY UPDATE name=VALUES(name), age_range=VALUES(age_range), discipline=VALUES(discipline), image_path=VALUES(image_path), sort_order=VALUES(sort_order), is_active=VALUES(is_active);

CREATE TABLE team_gallery_images (
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
