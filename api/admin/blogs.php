<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/auth.php';
require_once dirname(__DIR__) . '/helpers.php';

$admin = require_admin();

function admin_blog_payload(array $post, bool $withContent = true): array
{
    $payload = blog_payload($post, $withContent);
    $payload['author_id'] = $post['author_id'] !== null ? (int)$post['author_id'] : null;
    $payload['author_name'] = $post['author_name'] ?? null;
    return $payload;
}

function get_admin_blog(int $id): ?array
{
    $stmt = db()->prepare('SELECT bp.*, a.display_name AS author_name FROM blog_posts bp LEFT JOIN admins a ON a.id = bp.author_id WHERE bp.id = ? LIMIT 1');
    $stmt->execute([$id]);
    $post = $stmt->fetch();
    if (!$post) return null;
    $gallery = db()->prepare('SELECT id, image_path, alt_text, sort_order FROM blog_images WHERE post_id = ? ORDER BY sort_order ASC, id ASC');
    $gallery->execute([$id]);
    $post['gallery'] = array_map(static function (array $image): array {
        return ['id' => (int)$image['id'], 'url' => media_public_url($image['image_path'], 'blog'), 'alt' => $image['alt_text'], 'sort_order' => (int)$image['sort_order'], '_path' => $image['image_path']];
    }, $gallery->fetchAll());
    return $post;
}

function upload_many(array $files, string $directory, string $urlPrefix, int $maxBytes): array
{
    $saved = [];
    if (!isset($files['name']) || !is_array($files['name'])) return $saved;
    foreach ($files['name'] as $index => $name) {
        $file = [
            'name' => $files['name'][$index] ?? '',
            'type' => $files['type'][$index] ?? '',
            'tmp_name' => $files['tmp_name'][$index] ?? '',
            'error' => $files['error'][$index] ?? UPLOAD_ERR_NO_FILE,
            'size' => $files['size'][$index] ?? 0,
        ];
        if ($file['error'] === UPLOAD_ERR_NO_FILE) continue;
        $saved[] = media_save_upload($file, $directory, $urlPrefix, $maxBytes);
    }
    return array_values(array_filter($saved));
}

function delete_blog_assets(array $post): void
{
    $cfg = app_config()['app'];
    media_remove($post['cover_path'] ?? null, $cfg['blog_upload_dir'] ?? dirname(__DIR__, 2) . '/uploads/blogs');
    foreach (($post['gallery'] ?? []) as $image) {
        media_remove($image['_path'] ?? null, $cfg['blog_upload_dir'] ?? dirname(__DIR__, 2) . '/uploads/blogs');
    }
}

$method = request_method();
if ($method === 'GET') {
    $stmt = db()->query('SELECT bp.*, a.display_name AS author_name FROM blog_posts bp LEFT JOIN admins a ON a.id = bp.author_id ORDER BY bp.updated_at DESC, bp.id DESC');
    $posts = [];
    foreach ($stmt->fetchAll() as $post) {
        $full = get_admin_blog((int)$post['id']);
        $payload = admin_blog_payload($full, true);
        $payload['gallery'] = array_map(static fn(array $image): array => array_diff_key($image, ['_path' => true]), $full['gallery']);
        $posts[] = $payload;
    }
    ok_response(['posts' => $posts]);
}

if ($method === 'POST') {
    require_csrf();
    $id = (int)($_POST['id'] ?? 0);
    $title = clean_string($_POST['title'] ?? '', 220);
    $slug = make_slug(clean_string($_POST['slug'] ?? $title, 180));
    $excerpt = clean_string($_POST['excerpt'] ?? '', 500);
    $category = $_POST['category'] ?? 'training';
    if (!in_array($category, ['rules', 'gear', 'skates', 'training', 'news'], true)) $category = 'training';
    $content = safe_blog_html((string)($_POST['content_html'] ?? ''));
    $status = ($_POST['status'] ?? 'draft') === 'published' ? 'published' : 'draft';
    if ($title === '' || strlen($title) < 3) error_response('Blog title is required.', 422);
    if (strlen($content) < 10) error_response('Blog content is too short.', 422);
    $slugCheck = db()->prepare('SELECT id FROM blog_posts WHERE slug = ? AND id <> ? LIMIT 1');
    $slugCheck->execute([$slug, $id]);
    if ($slugCheck->fetch()) error_response('This blog slug is already in use.', 422);

    $cfg = app_config()['app'];
    $blogDir = $cfg['blog_upload_dir'] ?? dirname(__DIR__, 2) . '/uploads/blogs';
    $blogUrl = $cfg['blog_upload_url'] ?? 'uploads/blogs';
    $maxBytes = (int)($cfg['max_upload_bytes'] ?? 3 * 1024 * 1024);
    $newCover = media_save_upload($_FILES['cover'] ?? null, $blogDir, $blogUrl, $maxBytes);
    $newGallery = upload_many($_FILES['gallery'] ?? [], $blogDir, $blogUrl, $maxBytes);
    $oldPost = $id > 0 ? get_admin_blog($id) : null;
    if ($id > 0 && !$oldPost) {
        if ($newCover) media_remove($newCover, $blogDir);
        foreach ($newGallery as $path) media_remove($path, $blogDir);
        error_response('Blog post not found.', 404);
    }

    $oldCover = $oldPost['cover_path'] ?? null;
    $coverPath = $newCover ?: ($oldCover ?: null);
    $removeCover = (string)($_POST['remove_cover'] ?? '') === '1';
    if (!$newCover && $removeCover) $coverPath = null;
    $replaceGallery = (string)($_POST['replace_gallery'] ?? '') === '1';

    try {
        $pdo = db();
        $pdo->beginTransaction();
        if ($id > 0) {
            $stmt = $pdo->prepare(
                'UPDATE blog_posts SET slug = ?, title = ?, excerpt = ?, category = ?, content_html = ?, cover_path = ?, status = ?,
                 published_at = CASE WHEN ? = "published" AND published_at IS NULL THEN UTC_TIMESTAMP() WHEN ? = "draft" THEN NULL ELSE published_at END,
                 updated_at = UTC_TIMESTAMP() WHERE id = ?'
            );
            $stmt->execute([$slug, $title, $excerpt !== '' ? $excerpt : null, $category, $content, $coverPath, $status, $status, $status, $id]);
        } else {
            $stmt = $pdo->prepare(
                'INSERT INTO blog_posts (slug, title, excerpt, category, content_html, cover_path, status, author_id, published_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = "published" THEN UTC_TIMESTAMP() ELSE NULL END)'
            );
            $stmt->execute([$slug, $title, $excerpt !== '' ? $excerpt : null, $category, $content, $coverPath, $status, $admin['id'], $status]);
            $id = (int)$pdo->lastInsertId();
        }
        if ($replaceGallery && $oldPost) {
            $deleteGallery = $pdo->prepare('DELETE FROM blog_images WHERE post_id = ?');
            $deleteGallery->execute([$id]);
        }
        if ($newGallery) {
            $insertImage = $pdo->prepare('INSERT INTO blog_images (post_id, image_path, alt_text, sort_order) VALUES (?, ?, ?, ?)');
            $offset = $replaceGallery ? 0 : count($oldPost['gallery'] ?? []);
            foreach ($newGallery as $index => $path) $insertImage->execute([$id, $path, $title, $offset + $index + 1]);
        }
        $pdo->commit();
    } catch (Throwable $exception) {
        if (db()->inTransaction()) db()->rollBack();
        if ($newCover) media_remove($newCover, $blogDir);
        foreach ($newGallery as $path) media_remove($path, $blogDir);
        error_response('Could not save blog post.', 500);
    }

    if (($newCover || $removeCover) && $oldCover && $newCover !== $oldCover) media_remove($oldCover, $blogDir);
    if ($replaceGallery && $oldPost) {
        foreach (($oldPost['gallery'] ?? []) as $image) media_remove($image['_path'] ?? null, $blogDir);
    }
    $saved = get_admin_blog($id);
    $payload = admin_blog_payload($saved, true);
    $payload['gallery'] = array_map(static fn(array $image): array => array_diff_key($image, ['_path' => true]), $saved['gallery']);
    ok_response(['post' => $payload], 201);
}

if ($method === 'DELETE') {
    require_csrf();
    $id = (int)($_GET['id'] ?? 0);
    $post = $id > 0 ? get_admin_blog($id) : null;
    if (!$post) error_response('Blog post not found.', 404);
    $stmt = db()->prepare('DELETE FROM blog_posts WHERE id = ?');
    $stmt->execute([$id]);
    delete_blog_assets($post);
    ok_response();
}

error_response('Method not allowed.', 405);
