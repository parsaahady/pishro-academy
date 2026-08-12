<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/bootstrap.php';

if (request_method() !== 'GET') {
    error_response('Method not allowed.', 405);
}

$teamSlug = clean_string($_GET['team'] ?? '', 50);
$limit = (int)($_GET['limit'] ?? 100);
$limit = max(1, min($limit, 100));

$where = ['p.is_published = 1', 't.is_active = 1'];
$params = [];
if ($teamSlug !== '') {
    if (!valid_slug($teamSlug)) {
        error_response('Invalid team slug.', 422);
    }
    $where[] = 't.slug = ?';
    $params[] = $teamSlug;
}

$sql = 'SELECT p.id, p.name, p.jersey_number, p.age, p.years_active, p.position,
               p.age_group, p.bio, p.image_path, p.created_at, p.updated_at,
               t.slug AS team_slug, t.name AS team_name, t.english_name AS team_english_name,
               t.age_range AS team_age_range, t.discipline AS team_discipline
        FROM players p
        INNER JOIN teams t ON t.id = p.team_id
        WHERE ' . implode(' AND ', $where) . '
        ORDER BY p.updated_at DESC, p.sort_order ASC, p.id DESC
        LIMIT ' . $limit;

$stmt = db()->prepare($sql);
$stmt->execute($params);
$players = $stmt->fetchAll();

$players = array_map(static function (array $player): array {
    $player['id'] = (int)$player['id'];
    $player['jersey_number'] = $player['jersey_number'] !== null ? (int)$player['jersey_number'] : null;
    $player['age'] = (int)$player['age'];
    $player['years_active'] = (int)$player['years_active'];
    $player['image_url'] = $player['image_path']
        ? 'api/public/player-image.php?file=' . rawurlencode(basename((string)$player['image_path']))
        : null;
    unset($player['image_path']);
    return $player;
}, $players);

ok_response([
    'players' => $players,
    'count' => count($players),
]);
