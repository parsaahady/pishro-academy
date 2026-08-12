<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/auth.php';

require_admin();
$method = request_method();

if ($method === 'GET') {
    $stmt = db()->query('SELECT id, name, phone, course, message, status, created_at FROM contact_messages ORDER BY created_at DESC LIMIT 200');
    $messages = array_map(static function (array $message): array {
        $message['id'] = (int)$message['id'];
        return $message;
    }, $stmt->fetchAll());
    ok_response(['messages' => $messages]);
}

if ($method === 'POST') {
    require_csrf();
    $id = (int)($_POST['id'] ?? 0);
    $status = $_POST['status'] ?? '';
    if ($id < 1 || !in_array($status, ['new', 'read', 'archived'], true)) error_response('Invalid message update.', 422);
    $stmt = db()->prepare('UPDATE contact_messages SET status = ? WHERE id = ?');
    $stmt->execute([$status, $id]);
    ok_response();
}

if ($method === 'DELETE') {
    require_csrf();
    $id = (int)($_GET['id'] ?? 0);
    if ($id < 1) error_response('Message id is required.', 422);
    $stmt = db()->prepare('DELETE FROM contact_messages WHERE id = ?');
    $stmt->execute([$id]);
    ok_response();
}

error_response('Method not allowed.', 405);
