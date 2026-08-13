<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

function current_admin(): ?array
{
    $adminId = $_SESSION['admin_id'] ?? null;
    if (!$adminId || !is_numeric($adminId)) {
        return null;
    }

    $stmt = db()->prepare('SELECT id, username, display_name, is_active FROM admins WHERE id = ? LIMIT 1');
    $stmt->execute([(int)$adminId]);
    $admin = $stmt->fetch();

    if (!$admin || !(bool)$admin['is_active']) {
        unset($_SESSION['admin_id']);
        return null;
    }

    return $admin;
}

function require_admin(): array
{
    $admin = current_admin();
    if (!$admin) {
        error_response('Authentication required.', 401);
    }
    return $admin;
}

const LOGIN_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 8;

/**
 * Persistent (database-backed) login throttle, keyed by client IP and,
 * separately, by the attempted username. This cannot be bypassed by
 * clearing cookies / requesting a fresh session, unlike a purely
 * session-based counter.
 */
function login_rate_limited(string $username = ''): bool
{
    if (rate_limit_hit('login_ip', client_ip(), LOGIN_RATE_LIMIT_MAX_ATTEMPTS, LOGIN_RATE_LIMIT_WINDOW_SECONDS)) {
        return true;
    }
    if ($username !== '' && rate_limit_hit('login_user', strtolower($username), LOGIN_RATE_LIMIT_MAX_ATTEMPTS, LOGIN_RATE_LIMIT_WINDOW_SECONDS)) {
        return true;
    }
    return false;
}

function record_login_failure(string $username = ''): void
{
    record_rate_limit('login_ip', client_ip());
    if ($username !== '') {
        record_rate_limit('login_user', strtolower($username));
    }
}

function clear_login_failures(): void
{
    // Successful logins are not cleared from the persistent throttle on
    // purpose: a single successful login should not reset an in-progress
    // distributed brute-force window against this IP or username.
}
