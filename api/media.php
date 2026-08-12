<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

function media_save_upload(?array $file, string $directory, string $urlPrefix, int $maxBytes): ?string
{
    if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        error_response('Image upload failed.', 422);
    }
    if ((int)$file['size'] > $maxBytes) {
        error_response('Image is too large. Maximum size is 3 MB.', 413);
    }
    if (!is_uploaded_file($file['tmp_name'])) {
        error_response('Invalid upload.', 422);
    }

    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    $extension = match ($mime) {
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        default => '',
    };
    if ($extension === '' || @getimagesize($file['tmp_name']) === false) {
        error_response('Only valid JPG, PNG, or WebP images are allowed.', 422);
    }

    if (!is_dir($directory) && !mkdir($directory, 0750, true) && !is_dir($directory)) {
        error_response('Upload directory is not available.', 500);
    }

    $filename = bin2hex(random_bytes(16)) . '.' . $extension;
    $destination = rtrim($directory, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $filename;
    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        error_response('Could not store image.', 500);
    }
    return rtrim($urlPrefix, '/') . '/' . $filename;
}

function media_remove(?string $path, string $directory): void
{
    if (!$path) return;
    $filename = basename($path);
    if (!preg_match('/^[a-f0-9]{32}\.(jpg|jpeg|png|webp)$/i', $filename)) return;
    $fullPath = rtrim($directory, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $filename;
    if (is_file($fullPath)) @unlink($fullPath);
}

function media_public_url(?string $path, string $kind): ?string
{
    if (!$path) return null;
    if (str_starts_with($path, 'assets/')) return $path;
    return 'api/public/media.php?kind=' . rawurlencode($kind) . '&file=' . rawurlencode(basename($path));
}
