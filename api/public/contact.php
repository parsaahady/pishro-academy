<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/bootstrap.php';

if (request_method() !== 'POST') {
    error_response('Method not allowed.', 405);
}

$lastContact = (int)($_SESSION['last_contact_at'] ?? 0);
if ($lastContact && time() - $lastContact < 20) {
    error_response('Please wait before sending another request.', 429);
}

$data = input_json();
$name = clean_string($data['name'] ?? $_POST['name'] ?? '', 120);
$phone = clean_string($data['phone'] ?? $_POST['phone'] ?? '', 40);
$course = clean_string($data['course'] ?? $_POST['course'] ?? '', 120);
$message = clean_string($data['message'] ?? $_POST['message'] ?? '', 2000);

if ($name === '' || $phone === '') {
    error_response('Name and phone are required.', 422);
}
if (strlen($phone) < 7) {
    error_response('Please provide a valid phone number.', 422);
}

$stmt = db()->prepare('INSERT INTO contact_messages (name, phone, course, message) VALUES (?, ?, ?, ?)');
$stmt->execute([$name, $phone, $course !== '' ? $course : null, $message !== '' ? $message : null]);
$_SESSION['last_contact_at'] = time();

ok_response(['message' => 'Your request has been received.'], 201);
