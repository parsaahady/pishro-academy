-- Pishro: optional Iran Hockey (iranicehockey.com) profile link for each player.
-- Run this ONCE after database/schema.sql and 2026-08-team-structure.sql.
-- The column is nullable, so every existing player row stays valid and untouched.

ALTER TABLE players
    ADD COLUMN iran_hockey_url VARCHAR(255) NULL AFTER bio;
