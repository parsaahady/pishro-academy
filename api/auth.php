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

function login_rate_limited(): bool
{
    $now = time();
    $window = 15 * 60;
    $attempts = $_SESSION['login_attempts'] ?? [];
    $attempts = array_values(array_filter($attempts, static fn($time): bool => ($now - (int)$time) < $window));
    $_SESSION['login_attempts'] = $attempts;
    return count($attempts) >= 8;
}

function record_login_failure(): void
{
    $_SESSION['login_attempts'][] = time();
}

function clear_login_failures(): void
{
    unset($_SESSION['login_attempts']);
}
