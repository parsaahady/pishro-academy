<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/bootstrap.php';
require_once dirname(__DIR__) . '/media.php';
if (request_method() !== 'GET') error_response('Method not allowed.', 405);
$slug = clean_string($_GET['team'] ?? '', 50);
if (!valid_slug($slug)) error_response('Invalid team.', 422);
$stmt = db()->prepare('SELECT g.id, g.caption, g.sort_order, g.created_at, g.image_path FROM team_gallery_images g INNER JOIN teams t ON t.id = g.team_id WHERE t.slug = ? AND t.is_active = 1 ORDER BY g.sort_order ASC, g.id ASC');
$stmt->execute([$slug]);
$images = array_map(static function(array $image): array { $image['id'] = (int)$image['id']; $image['image_url'] = media_public_url($image['image_path'] ?? null, 'team'); unset($image['image_path']); return $image; }, $stmt->fetchAll());
ok_response(['images' => $images]);
