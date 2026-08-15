<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/bootstrap.php';

if (request_method() !== 'GET') {
    error_response('Method not allowed.', 405);
}

$id = (int)($_GET['id'] ?? 0);
if ($id < 1) {
    error_response('Player id is required.', 422);
}

$stmt = db()->prepare(
    'SELECT p.id, p.name, p.jersey_number, p.age, p.years_active, p.position,
            p.age_group, p.bio, p.iran_hockey_url, p.image_path, p.created_at, p.updated_at,
            t.slug AS team_slug, t.name AS team_name, t.english_name AS team_english_name,
            t.category_key AS team_category, t.age_range AS team_age_range, t.discipline AS team_discipline
     FROM players p
     INNER JOIN teams t ON t.id = p.team_id
     WHERE p.id = ? AND p.is_published = 1 AND t.is_active = 1
     LIMIT 1'
);
$stmt->execute([$id]);
$player = $stmt->fetch();

if (!$player) {
    error_response('Player not found.', 404);
}

$player['id'] = (int)$player['id'];
$player['jersey_number'] = $player['jersey_number'] !== null ? (int)$player['jersey_number'] : null;
$player['age'] = (int)$player['age'];
$player['years_active'] = (int)$player['years_active'];
$player['iran_hockey_url'] = clean_external_url($player['iran_hockey_url'] ?? '');
$player['image_url'] = $player['image_path']
    ? 'api/public/player-image.php?file=' . rawurlencode(basename((string)$player['image_path']))
    : null;
unset($player['image_path']);

ok_response(['player' => $player]);
