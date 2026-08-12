<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/auth.php';

require_admin();
$method = request_method();

if ($method === 'GET') {
    $stmt = db()->query('SELECT c.id, c.post_id, c.name, c.email, c.body, c.status, c.created_at, bp.title AS post_title, bp.slug AS post_slug FROM comments c INNER JOIN blog_posts bp ON bp.id = c.post_id ORDER BY c.created_at DESC LIMIT 200');
    $comments = array_map(static function (array $comment): array {
        $comment['id'] = (int)$comment['id'];
        $comment['post_id'] = (int)$comment['post_id'];
        return $comment;
    }, $stmt->fetchAll());
    ok_response(['comments' => $comments]);
}

if ($method === 'POST') {
    require_csrf();
    $id = (int)($_POST['id'] ?? 0);
    $status = $_POST['status'] ?? '';
    if ($id < 1 || !in_array($status, ['pending', 'approved', 'rejected'], true)) error_response('Invalid comment update.', 422);
    $stmt = db()->prepare('UPDATE comments SET status = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?');
    $stmt->execute([$status, $id]);
    ok_response();
}

if ($method === 'DELETE') {
    require_csrf();
    $id = (int)($_GET['id'] ?? 0);
    if ($id < 1) error_response('Comment id is required.', 422);
    $stmt = db()->prepare('DELETE FROM comments WHERE id = ?');
    $stmt->execute([$id]);
    ok_response();
}

error_response('Method not allowed.', 405);
