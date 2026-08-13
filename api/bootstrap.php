<?php
declare(strict_types=1);

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => false,
        'error' => 'Server configuration is missing. Copy api/config.example.php to api/config.php and configure the database.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$config = require $configPath;

ini_set('display_errors', '0');
error_reporting(E_ALL);

$secureCookie = (bool)($config['app']['cookie_secure'] ?? false);
session_name('pishro_session');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => $secureCookie,
    'httponly' => true,
    'samesite' => 'Lax',
]);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
if ($secureCookie) {
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
}

set_exception_handler(static function (Throwable $exception): void {
    error_log($exception->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'An internal server error occurred.'], JSON_UNESCAPED_UNICODE);
    exit;
});

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function app_config(): array
{
    global $config;
    return $config;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $cfg = app_config()['db'];
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=%s',
        $cfg['host'],
        $cfg['name'],
        $cfg['charset'] ?? 'utf8mb4'
    );

    $pdo = new PDO($dsn, $cfg['user'], $cfg['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}

function json_response(array $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function ok_response(array $data = [], int $status = 200): never
{
    json_response(['ok' => true] + $data, $status);
}

function error_response(string $message, int $status = 400, array $extra = []): never
{
    json_response(['ok' => false, 'error' => $message] + $extra, $status);
}

function request_method(): string
{
    return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
}

function input_json(): array
{
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function request_value(string $key, mixed $default = null): mixed
{
    if (array_key_exists($key, $_POST)) {
        return $_POST[$key];
    }
    if (array_key_exists($key, $_GET)) {
        return $_GET[$key];
    }
    $json = input_json();
    return $json[$key] ?? $default;
}

function clean_string(mixed $value, int $maxLength = 255): string
{
    $value = trim((string)$value);
    return function_exists('mb_substr') ? mb_substr($value, 0, $maxLength) : substr($value, 0, $maxLength);
}

/**
 * Normalise an optional, user-supplied external profile link (e.g. Iran Hockey).
 * Returns null when empty or when the value is not a safe http(s) URL, so that
 * javascript:, data: and other scheme-based injections can never be stored.
 */
function clean_external_url(mixed $value, int $maxLength = 255): ?string
{
    $url = trim((string)$value);
    if ($url === '') {
        return null;
    }
    if (!preg_match('~^https?://~i', $url)) {
        $url = 'https://' . ltrim($url, '/');
    }
    // Reject control characters and whitespace that could break an href attribute.
    if (preg_match('/[\x00-\x20\x7F"\'<>\\\\^`{|}]/u', $url)) {
        return null;
    }
    // VARCHAR(255) on a utf8mb4 column counts characters, so measure characters.
    if ((function_exists('mb_strlen') ? mb_strlen($url) : strlen($url)) > $maxLength) {
        return null;
    }
    // NOTE: FILTER_VALIDATE_URL is deliberately NOT used here. Iran Hockey profile
    // links contain Persian slugs (e.g. /player-profile/ناصر-رستمی/) and the filter
    // rejects any non-ASCII character, which would drop perfectly valid links.
    $parts = parse_url($url);
    if ($parts === false || empty($parts['host'])) {
        return null;
    }
    $host = strtolower((string)$parts['host']);
    if (!preg_match('/^(?:[a-z0-9\x{0080}-\x{FFFF}](?:[a-z0-9\x{0080}-\x{FFFF}-]*[a-z0-9\x{0080}-\x{FFFF}])?\.)+[a-z\x{0080}-\x{FFFF}]{2,}$/u', $host)) {
        return null;
    }
    return $url;
}

function valid_slug(string $slug): bool
{
    return (bool)preg_match('/^[a-z0-9-]{2,50}$/', $slug);
}

function csrf_token(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function require_csrf(): void
{
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($_POST['_csrf'] ?? '');
    if (!is_string($token) || $token === '' || !hash_equals((string)($_SESSION['csrf_token'] ?? ''), $token)) {
        error_response('Invalid or missing CSRF token.', 419);
    }
}

function client_ip(): string
{
    // Intentionally trusts only REMOTE_ADDR. Client-supplied headers such as
    // X-Forwarded-For are trivially spoofable and must never be trusted here
    // unless this app sits behind a known, correctly configured reverse proxy
    // that overwrites (not appends to) that header.
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

/**
 * Persistent, database-backed rate limiter. Unlike a session-based counter,
 * this cannot be bypassed by dropping cookies / requesting a fresh session,
 * since it is keyed on server-observed identifiers (e.g. IP address).
 */
function rate_limit_hit(string $action, string $identifier, int $maxAttempts, int $windowSeconds): bool
{
    $hashed = hash('sha256', $identifier);
    $cutoff = gmdate('Y-m-d H:i:s', time() - $windowSeconds);
    $stmt = db()->prepare(
        'SELECT COUNT(*) FROM rate_limits WHERE action = ? AND identifier = ? AND created_at > ?'
    );
    $stmt->execute([$action, $hashed, $cutoff]);
    return (int)$stmt->fetchColumn() >= $maxAttempts;
}

function record_rate_limit(string $action, string $identifier): void
{
    $hashed = hash('sha256', $identifier);
    $stmt = db()->prepare('INSERT INTO rate_limits (action, identifier) VALUES (?, ?)');
    $stmt->execute([$action, $hashed]);

    // Opportunistic cleanup so the table doesn't grow unbounded.
    if (random_int(1, 50) === 1) {
        db()->exec('DELETE FROM rate_limits WHERE created_at < (UTC_TIMESTAMP() - INTERVAL 1 DAY)');
    }
}
