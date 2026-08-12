<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/auth.php';
require_once dirname(__DIR__) . '/helpers.php';

require_admin();

function admin_coach_payload(array $coach): array
{
    $coach['id'] = (int)$coach['id'];
    $coach['years_active'] = (int)$coach['years_active'];
    $coach['is_published'] = (bool)$coach['is_published'];
    $coach['image_url'] = media_public_url($coach['image_path'] ?? null, 'coach');
    unset($coach['image_path']);
    return $coach;
}

function get_admin_coach(int $id): ?array
{
    $stmt = db()->prepare('SELECT * FROM coaches WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

$method = request_method();
if ($method === 'GET') {
    $stmt = db()->query('SELECT * FROM coaches ORDER BY sort_order ASC, updated_at DESC, id DESC');
    ok_response(['coaches' => array_map('admin_coach_payload', $stmt->fetchAll())]);
}

if ($method === 'POST') {
    require_csrf();
    $id = (int)($_POST['id'] ?? 0);
    $name = clean_string($_POST['name'] ?? '', 120);
    $role = clean_string($_POST['role'] ?? '', 120);
    $years = (int)($_POST['years_active'] ?? $_POST['experience'] ?? 0);
    $specialties = clean_string($_POST['specialties'] ?? '', 255);
    $bio = clean_string($_POST['bio'] ?? '', 2000);
    if (strlen($name) < 2) error_response('Coach name is required.', 422);
    if ($years < 0 || $years > 80) error_response('Years of activity must be between 0 and 80.', 422);

    $cfg = app_config()['app'];
    $directory = $cfg['coach_upload_dir'] ?? dirname(__DIR__, 2) . '/uploads/coaches';
    $urlPrefix = $cfg['coach_upload_url'] ?? 'uploads/coaches';
    $maxBytes = (int)($cfg['max_upload_bytes'] ?? 3 * 1024 * 1024);
    $newImage = media_save_upload($_FILES['photo'] ?? null, $directory, $urlPrefix, $maxBytes);
    $old = $id > 0 ? get_admin_coach($id) : null;
    if ($id > 0 && !$old) {
        if ($newImage) media_remove($newImage, $directory);
        error_response('Coach not found.', 404);
    }
    $oldImage = $old['image_path'] ?? null;
    $removeImage = (string)($_POST['remove_image'] ?? '') === '1';
    $imagePath = $newImage ?: ($removeImage ? null : $oldImage);

    try {
        $pdo = db();
        if ($id > 0) {
            $stmt = $pdo->prepare('UPDATE coaches SET name = ?, role = ?, years_active = ?, specialties = ?, bio = ?, image_path = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?');
            $stmt->execute([$name, $role ?: null, $years, $specialties ?: null, $bio ?: null, $imagePath, $id]);
        } else {
            $stmt = $pdo->prepare('INSERT INTO coaches (name, role, years_active, specialties, bio, image_path) VALUES (?, ?, ?, ?, ?, ?)');
            $stmt->execute([$name, $role ?: null, $years, $specialties ?: null, $bio ?: null, $newImage]);
            $id = (int)$pdo->lastInsertId();
        }
    } catch (Throwable $exception) {
        if ($newImage) media_remove($newImage, $directory);
        error_response('Could not save coach.', 500);
    }

    if (($newImage || $removeImage) && $oldImage && $newImage !== $oldImage) media_remove($oldImage, $directory);
    ok_response(['coach' => admin_coach_payload((array)get_admin_coach($id))], 201);
}

if ($method === 'DELETE') {
    require_csrf();
    $id = (int)($_GET['id'] ?? 0);
    $coach = $id > 0 ? get_admin_coach($id) : null;
    if (!$coach) error_response('Coach not found.', 404);
    $stmt = db()->prepare('DELETE FROM coaches WHERE id = ?');
    $stmt->execute([$id]);
    $cfg = app_config()['app'];
    media_remove($coach['image_path'], $cfg['coach_upload_dir'] ?? dirname(__DIR__, 2) . '/uploads/coaches');
    ok_response();
}

error_response('Method not allowed.', 405);
