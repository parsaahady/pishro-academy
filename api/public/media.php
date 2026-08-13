<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/bootstrap.php';

if (request_method() !== 'GET') {
    error_response('Method not allowed.', 405);
}

$kind = clean_string($_GET['kind'] ?? '', 20);
$filename = basename((string)($_GET['file'] ?? ''));
if (!in_array($kind, ['blog', 'coach', 'team'], true) || !preg_match('/^[a-f0-9]{32}\.(jpg|jpeg|png|webp)$/i', $filename)) {
    error_response('Image not found.', 404);
}

$isAdmin = !empty($_SESSION['admin_id']);
if ($kind === 'blog') {
    $paths = ['uploads/blogs/' . $filename];
    $blogVisibility = $isAdmin ? '' : ' AND status = "published"';
    $galleryVisibility = $isAdmin ? '' : ' AND bp.status = "published"';
    $stmt = db()->prepare(
        'SELECT id FROM blog_posts WHERE cover_path = ?' . $blogVisibility . '
         UNION ALL
         SELECT bi.id FROM blog_images bi INNER JOIN blog_posts bp ON bp.id = bi.post_id
         WHERE bi.image_path = ?' . $galleryVisibility . ' LIMIT 1'
    );
    $stmt->execute([$paths[0], $paths[0]]);
    $directory = app_config()['app']['blog_upload_dir'] ?? dirname(__DIR__, 2) . '/uploads/blogs';
} elseif ($kind === 'team') {
    $paths = ['uploads/teams/' . $filename];
    $stmt = db()->prepare('SELECT g.id FROM team_gallery_images g INNER JOIN teams t ON t.id = g.team_id WHERE g.image_path = ?' . ($isAdmin ? '' : ' AND t.is_active = 1') . ' LIMIT 1');
    $stmt->execute([$paths[0]]);
    $directory = app_config()['app']['team_gallery_upload_dir'] ?? dirname(__DIR__, 2) . '/uploads/teams';
} else {
    $paths = ['uploads/coaches/' . $filename];
    $visibility = $isAdmin ? '' : ' AND is_published = 1';
    $stmt = db()->prepare('SELECT id FROM coaches WHERE image_path = ?' . $visibility . ' LIMIT 1');
    $stmt->execute([$paths[0]]);
    $directory = app_config()['app']['coach_upload_dir'] ?? dirname(__DIR__, 2) . '/uploads/coaches';
}

if (!$stmt->fetch()) {
    error_response('Image not found.', 404);
}

$baseDir = realpath($directory);
$filePath = realpath(rtrim($directory, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $filename);
if (!$baseDir || !$filePath || !str_starts_with($filePath, $baseDir . DIRECTORY_SEPARATOR) || !is_file($filePath)) {
    error_response('Image not found.', 404);
}

$mime = (new finfo(FILEINFO_MIME_TYPE))->file($filePath);
if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)) {
    error_response('Image not found.', 404);
}

header('Content-Type: ' . $mime);
header('Cache-Control: public, max-age=31536000, immutable');
header('Content-Length: ' . (string)filesize($filePath));
readfile($filePath);
exit;
