<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/bootstrap.php';

if (request_method() !== 'GET') {
    error_response('Method not allowed.', 405);
}

$filename = basename((string)($_GET['file'] ?? ''));
if ($filename === '' || !preg_match('/^[a-f0-9]{32}\.(jpg|jpeg|png|webp)$/i', $filename)) {
    error_response('Image not found.', 404);
}

$relativePath = 'uploads/players/' . $filename;
$stmt = db()->prepare('SELECT id FROM players WHERE image_path = ? AND is_published = 1 LIMIT 1');
$stmt->execute([$relativePath]);
if (!$stmt->fetch()) {
    error_response('Image not found.', 404);
}

$uploadDir = rtrim((string)app_config()['app']['upload_dir'], DIRECTORY_SEPARATOR);
$baseDir = realpath($uploadDir);
$filePath = realpath($uploadDir . DIRECTORY_SEPARATOR . $filename);
if (!$baseDir || !$filePath || !str_starts_with($filePath, $baseDir . DIRECTORY_SEPARATOR) || !is_file($filePath)) {
    error_response('Image not found.', 404);
}

$mime = (new finfo(FILEINFO_MIME_TYPE))->file($filePath);
$allowed = ['image/jpeg', 'image/png', 'image/webp'];
if (!in_array($mime, $allowed, true)) {
    error_response('Image not found.', 404);
}

header('Content-Type: ' . $mime);
header('Cache-Control: public, max-age=31536000, immutable');
header('Content-Length: ' . (string)filesize($filePath));
readfile($filePath);
exit;
