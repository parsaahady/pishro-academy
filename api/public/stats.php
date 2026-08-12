<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/bootstrap.php';

if (request_method() !== 'GET') {
    error_response('Method not allowed.', 405);
}

$stmt = db()->query(
    'SELECT t.slug, t.name, COUNT(p.id) AS player_count
     FROM teams t
     LEFT JOIN players p ON p.team_id = t.id AND p.is_published = 1
     WHERE t.is_active = 1
     GROUP BY t.id
     ORDER BY t.sort_order ASC, t.id ASC'
);
$teams = $stmt->fetchAll();
$total = 0;
foreach ($teams as &$team) {
    $team['player_count'] = (int)$team['player_count'];
    $total += $team['player_count'];
}
unset($team);

ok_response(['total_players' => $total, 'teams' => $teams]);
