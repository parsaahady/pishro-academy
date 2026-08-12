<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/bootstrap.php';

if (request_method() !== 'POST') {
    error_response('Method not allowed.', 405);
}

$data = input_json();
if (($data['website'] ?? $_POST['website'] ?? '') !== '') {
    ok_response(['message' => 'Comment received.'], 201);
}

$lastComment = (int)($_SESSION['last_comment_at'] ?? 0);
if ($lastComment && time() - $lastComment < 30) {
    error_response('Please wait before sending another comment.', 429);
}

$slug = clean_string($data['slug'] ?? $_POST['slug'] ?? '', 180);
$name = clean_string($data['name'] ?? $_POST['name'] ?? '', 120);
$email = clean_string($data['email'] ?? $_POST['email'] ?? '', 190);
$body = clean_string($data['body'] ?? $_POST['body'] ?? '', 2000);

if ($slug === '' || $name === '' || $body === '') {
    error_response('Post, name, and comment are required.', 422);
}
if (strlen($name) < 2 || strlen($body) < 3) {
    error_response('Please provide a valid name and comment.', 422);
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    error_response('Please provide a valid email address.', 422);
}

$post = db()->prepare('SELECT id FROM blog_posts WHERE slug = ? AND status = "published" LIMIT 1');
$post->execute([$slug]);
$post = $post->fetch();
if (!$post) error_response('Blog post not found.', 404);

$stmt = db()->prepare('INSERT INTO comments (post_id, name, email, body, status, ip_hash) VALUES (?, ?, ?, ?, "pending", ?)');
$stmt->execute([(int)$post['id'], $name, $email !== '' ? $email : null, $body, hash('sha256', client_ip() . session_id())]);
$_SESSION['last_comment_at'] = time();

ok_response(['message' => 'Your comment is awaiting moderation.'], 201);
