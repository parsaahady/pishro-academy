<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/auth.php';

if (request_method() !== 'POST') {
    error_response('Method not allowed.', 405);
}
$data = input_json();
$username = clean_string($data['username'] ?? $_POST['username'] ?? '', 80);
$password = (string)($data['password'] ?? $_POST['password'] ?? '');

if (login_rate_limited($username)) {
    error_response('Too many login attempts. Try again later.', 429);
}

if ($username === '' || $password === '') {
    record_login_failure($username);
    error_response('Username and password are required.', 422);
}

$stmt = db()->prepare('SELECT id, username, display_name, password_hash, is_active FROM admins WHERE username = ? LIMIT 1');
$stmt->execute([$username]);
$admin = $stmt->fetch();

// Always run password_verify(), even when the username doesn't exist, using
// a constant dummy hash. This keeps response timing consistent so an
// attacker cannot use timing differences to enumerate valid usernames.
$dummyHash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
$passwordValid = password_verify($password, $admin['password_hash'] ?? $dummyHash);

if (!$admin || !(bool)$admin['is_active'] || !$passwordValid) {
    record_login_failure($username);
    usleep(250000);
    error_response('Invalid username or password.', 401);
}

session_regenerate_id(true);
$_SESSION['admin_id'] = (int)$admin['id'];
$_SESSION['csrf_token'] = bin2hex(random_bytes(32));
clear_login_failures();

$update = db()->prepare('UPDATE admins SET last_login_at = UTC_TIMESTAMP() WHERE id = ?');
$update->execute([(int)$admin['id']]);

ok_response([
    'admin' => [
        'id' => (int)$admin['id'],
        'username' => $admin['username'],
        'display_name' => $admin['display_name'],
    ],
    'csrf_token' => $_SESSION['csrf_token'],
]);
