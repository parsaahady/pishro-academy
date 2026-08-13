<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/helpers.php';

if (request_method() !== 'GET') {
    error_response('Method not allowed.', 405);
}

// Oldest profiles are shown first, so every newly added coach appears at the end of the list.
$stmt = db()->query('SELECT id, name, role, years_active, specialties, bio, image_path, created_at, updated_at FROM coaches WHERE is_published = 1 ORDER BY created_at ASC, id ASC');
$coaches = array_map(static function (array $coach): array {
    $coach['id'] = (int)$coach['id'];
    $coach['years_active'] = (int)$coach['years_active'];
    $coach['image_url'] = media_public_url($coach['image_path'], 'coach');
    unset($coach['image_path']);
    return $coach;
}, $stmt->fetchAll());

ok_response(['coaches' => $coaches, 'count' => count($coaches)]);
