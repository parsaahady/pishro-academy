<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/auth.php';

require_admin();

function admin_team(string $slug): array
{
    if (!valid_slug($slug)) {
        error_response('Invalid team slug.', 422);
    }
    $stmt = db()->prepare('SELECT id, slug, name, age_range, discipline FROM teams WHERE slug = ? AND is_active = 1 LIMIT 1');
    $stmt->execute([$slug]);
    $team = $stmt->fetch();
    if (!$team) {
        error_response('Team not found.', 404);
    }
    return $team;
}

function player_image_url(?string $imagePath): ?string
{
    if (!$imagePath) {
        return null;
    }
    return 'api/public/player-image.php?file=' . rawurlencode(basename($imagePath));
}

function admin_player_payload(array $player): array
{
    $player['id'] = (int)$player['id'];
    $player['team_id'] = (int)$player['team_id'];
    $player['age'] = (int)$player['age'];
    $player['years_active'] = (int)$player['years_active'];
    $player['jersey_number'] = $player['jersey_number'] !== null ? (int)$player['jersey_number'] : null;
    $player['is_published'] = (bool)$player['is_published'];
    $player['image_url'] = player_image_url($player['image_path'] ?? null);
    unset($player['image_path']);
    return $player;
}

function image_extension(string $mime): string
{
    return match ($mime) {
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        default => '',
    };
}

function save_player_image(?array $file): ?string
{
    if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        error_response('Player image upload failed.', 422);
    }

    $cfg = app_config()['app'];
    $maxBytes = (int)($cfg['max_upload_bytes'] ?? 3 * 1024 * 1024);
    if ((int)$file['size'] > $maxBytes) {
        error_response('Player image is too large. Maximum size is 3 MB.', 413);
    }
    if (!is_uploaded_file($file['tmp_name'])) {
        error_response('Invalid upload.', 422);
    }

    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    $extension = image_extension($mime);
    if ($extension === '' || @getimagesize($file['tmp_name']) === false) {
        error_response('Only valid JPG, PNG, or WebP images are allowed.', 422);
    }

    $directory = rtrim((string)$cfg['upload_dir'], DIRECTORY_SEPARATOR);
    if (!is_dir($directory) && !mkdir($directory, 0750, true) && !is_dir($directory)) {
        error_response('Upload directory is not available.', 500);
    }

    $filename = bin2hex(random_bytes(16)) . '.' . $extension;
    $destination = $directory . DIRECTORY_SEPARATOR . $filename;
    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        error_response('Could not store player image.', 500);
    }

    return rtrim((string)$cfg['upload_url'], '/') . '/' . $filename;
}

function remove_player_image(?string $imagePath): void
{
    if (!$imagePath) {
        return;
    }
    $filename = basename($imagePath);
    if (!preg_match('/^[a-f0-9]{32}\.(jpg|jpeg|png|webp)$/i', $filename)) {
        return;
    }
    $path = rtrim((string)app_config()['app']['upload_dir'], DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $filename;
    if (is_file($path)) {
        @unlink($path);
    }
}

function validated_player_fields(array $data): array
{
    $name = clean_string($data['name'] ?? '', 120);
    $age = (int)($data['age'] ?? 0);
    $yearsActive = (int)($data['experience'] ?? $data['years_active'] ?? 0);
    $jerseyValue = trim((string)($data['number'] ?? $data['jersey_number'] ?? ''));
    $jerseyNumber = $jerseyValue === '' ? null : (int)$jerseyValue;
    $position = clean_string($data['position'] ?? '', 80);
    $ageGroup = clean_string($data['ageGroup'] ?? $data['age_group'] ?? '', 80);
    $bio = clean_string($data['bio'] ?? '', 2000);

    $nameLength = function_exists('mb_strlen') ? mb_strlen($name) : strlen($name);
    if ($nameLength < 2) {
        error_response('Player name is required.', 422);
    }
    if ($age < 3 || $age > 100) {
        error_response('Player age must be between 3 and 100.', 422);
    }
    if ($yearsActive < 0 || $yearsActive > 80) {
        error_response('Years of activity must be between 0 and 80.', 422);
    }
    if ($jerseyNumber !== null && ($jerseyNumber < 0 || $jerseyNumber > 99)) {
        error_response('Jersey number must be between 0 and 99.', 422);
    }

    return [$name, $jerseyNumber, $age, $yearsActive, $position !== '' ? $position : null, $ageGroup !== '' ? $ageGroup : null, $bio !== '' ? $bio : null];
}

function get_admin_players(string $teamSlug): array
{
    $stmt = db()->prepare(
        'SELECT p.id, p.team_id, p.name, p.jersey_number, p.age, p.years_active,
                p.position, p.age_group, p.bio, p.image_path, p.is_published,
                p.created_at, p.updated_at, t.slug AS team_slug, t.name AS team_name
         FROM players p INNER JOIN teams t ON t.id = p.team_id
         WHERE t.slug = ? ORDER BY p.sort_order ASC, p.updated_at DESC, p.id DESC'
    );
    $stmt->execute([$teamSlug]);
    return array_map('admin_player_payload', $stmt->fetchAll());
}

$method = request_method();
if ($method === 'GET') {
    $teamSlug = clean_string($_GET['team'] ?? '', 50);
    if ($teamSlug === '') {
        error_response('Team is required.', 422);
    }
    ok_response(['players' => get_admin_players($teamSlug)]);
}

if ($method === 'POST') {
    require_csrf();
    $teamSlug = clean_string($_POST['team'] ?? '', 50);
    $team = admin_team($teamSlug);
    [$name, $jerseyNumber, $age, $yearsActive, $position, $ageGroup, $bio] = validated_player_fields($_POST);
    $id = (int)($_POST['id'] ?? 0);
    $newImagePath = save_player_image($_FILES['photo'] ?? null);
    $oldImagePath = null;
    $removeImage = false;

    try {
        $pdo = db();
        $pdo->beginTransaction();
        if ($id > 0) {
            $existingStmt = $pdo->prepare('SELECT image_path FROM players WHERE id = ? LIMIT 1');
            $existingStmt->execute([$id]);
            $existing = $existingStmt->fetch();
            if (!$existing) {
                $pdo->rollBack();
                if ($newImagePath) remove_player_image($newImagePath);
                error_response('Player not found.', 404);
            }
            $oldImagePath = $existing['image_path'];
            $removeImage = (string)($_POST['remove_image'] ?? '') === '1';
            $imagePath = $newImagePath ?: ($removeImage ? null : $oldImagePath);
            $stmt = $pdo->prepare(
                'UPDATE players SET team_id = ?, name = ?, jersey_number = ?, age = ?, years_active = ?,
                 position = ?, age_group = ?, bio = ?, image_path = ?, updated_at = UTC_TIMESTAMP()
                 WHERE id = ?'
            );
            $stmt->execute([$team['id'], $name, $jerseyNumber, $age, $yearsActive, $position, $ageGroup, $bio, $imagePath, $id]);
        } else {
            $stmt = $pdo->prepare(
                'INSERT INTO players (team_id, name, jersey_number, age, years_active, position, age_group, bio, image_path)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([$team['id'], $name, $jerseyNumber, $age, $yearsActive, $position, $ageGroup, $bio, $newImagePath]);
            $id = (int)$pdo->lastInsertId();
        }
        $pdo->commit();
    } catch (Throwable $exception) {
        if (db()->inTransaction()) db()->rollBack();
        if ($newImagePath) remove_player_image($newImagePath);
        error_response('Could not save player.', 500);
    }

    if (($newImagePath || $removeImage) && $oldImagePath && $newImagePath !== $oldImagePath) {
        remove_player_image($oldImagePath);
    }

    $stmt = db()->prepare(
        'SELECT p.id, p.team_id, p.name, p.jersey_number, p.age, p.years_active,
                p.position, p.age_group, p.bio, p.image_path, p.is_published,
                p.created_at, p.updated_at, t.slug AS team_slug, t.name AS team_name
         FROM players p INNER JOIN teams t ON t.id = p.team_id WHERE p.id = ? LIMIT 1'
    );
    $stmt->execute([$id]);
    ok_response(['player' => admin_player_payload((array)$stmt->fetch())], 201);
}

if ($method === 'DELETE') {
    require_csrf();
    $id = (int)($_GET['id'] ?? 0);
    if ($id < 1) {
        error_response('Player id is required.', 422);
    }
    $stmt = db()->prepare('SELECT image_path FROM players WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $player = $stmt->fetch();
    if (!$player) {
        error_response('Player not found.', 404);
    }
    $delete = db()->prepare('DELETE FROM players WHERE id = ?');
    $delete->execute([$id]);
    remove_player_image($player['image_path']);
    ok_response();
}

error_response('Method not allowed.', 405);
