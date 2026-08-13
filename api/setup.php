<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

$cfg = app_config()['app'] ?? [];
if (!($cfg['setup_enabled'] ?? false)) {
    error_response('Setup is disabled.', 404);
}

$providedToken = (string)($_GET['token'] ?? ($_SERVER['HTTP_X_SETUP_TOKEN'] ?? ''));
$expectedToken = (string)($cfg['setup_token'] ?? '');
if ($expectedToken === '' || strlen($expectedToken) < 24 || !hash_equals($expectedToken, $providedToken)) {
    error_response('Invalid setup token.', 403);
}

if (request_method() !== 'POST') {
    error_response('Method not allowed.', 405);
}

$data = input_json();
$username = clean_string($data['username'] ?? $_POST['username'] ?? '', 80);
$displayName = clean_string($data['display_name'] ?? $_POST['display_name'] ?? 'Pishro Admin', 120);
$password = (string)($data['password'] ?? $_POST['password'] ?? '');

if (!preg_match('/^[a-zA-Z0-9._-]{3,80}$/', $username)) {
    error_response('Username must contain 3–80 letters, numbers, dots, underscores, or hyphens.', 422);
}
if (strlen($password) < 12) {
    error_response('Password must contain at least 12 characters.', 422);
}
if (!preg_match('/[a-zA-Z]/', $password) || !preg_match('/[0-9]/', $password)) {
    error_response('Password must contain both letters and numbers.', 422);
}

$schemaPath = dirname(__DIR__) . '/database/schema.sql';
if (!is_file($schemaPath)) {
    error_response('Database schema file is missing.', 500);
}

try {
    $pdo = db();
    $pdo->exec(file_get_contents($schemaPath));
    try {
        $pdo->exec("ALTER TABLE blog_posts ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'training' AFTER excerpt");
    } catch (Throwable $ignored) {
        // The column already exists on an existing installation.
    }
    try {
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS rate_limits (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                action VARCHAR(40) NOT NULL,
                identifier CHAR(64) NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY idx_rate_limits_lookup (action, identifier, created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
    } catch (Throwable $ignored) {
        // The table already exists on an existing installation.
    }
    $seedPath = dirname(__DIR__) . '/database/seed.sql';
    if (is_file($seedPath)) {
        $pdo->exec(file_get_contents($seedPath));
    }
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare(
        'INSERT INTO admins (username, display_name, password_hash) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), password_hash = VALUES(password_hash), is_active = 1'
    );
    $stmt->execute([$username, $displayName, $passwordHash]);
} catch (Throwable $exception) {
    error_response('Database setup failed. Check the database credentials and permissions.', 500);
}

ok_response([
    'message' => 'Database and admin account created. Disable setup_enabled and remove setup.php now.',
]);
