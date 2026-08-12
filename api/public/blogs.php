<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/helpers.php';

if (request_method() !== 'GET') {
    error_response('Method not allowed.', 405);
}

$slug = clean_string($_GET['slug'] ?? '', 180);
if ($slug !== '') {
    $stmt = db()->prepare('SELECT * FROM blog_posts WHERE slug = ? AND status = "published" LIMIT 1');
    $stmt->execute([$slug]);
    $post = $stmt->fetch();
    if (!$post) error_response('Blog post not found.', 404);

    $payload = blog_payload($post, true);
    $images = db()->prepare('SELECT image_path, alt_text FROM blog_images WHERE post_id = ? ORDER BY sort_order ASC, id ASC');
    $images->execute([(int)$post['id']]);
    $payload['gallery'] = array_map(static fn(array $image): array => [
        'url' => media_public_url($image['image_path'], 'blog'),
        'alt' => $image['alt_text'],
    ], $images->fetchAll());

    $comments = db()->prepare('SELECT id, name, body, created_at FROM comments WHERE post_id = ? AND status = "approved" ORDER BY created_at DESC');
    $comments->execute([(int)$post['id']]);
    $payload['comments'] = array_map(static function (array $comment): array {
        $comment['id'] = (int)$comment['id'];
        return $comment;
    }, $comments->fetchAll());
    ok_response(['post' => $payload]);
}

$limit = max(1, min((int)($_GET['limit'] ?? 12), 50));
$stmt = db()->query('SELECT * FROM blog_posts WHERE status = "published" ORDER BY published_at DESC, id DESC LIMIT ' . $limit);
$posts = array_map(static fn(array $post): array => blog_payload($post), $stmt->fetchAll());
ok_response(['posts' => $posts, 'count' => count($posts)]);
