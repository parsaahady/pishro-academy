<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/auth.php';

if (request_method() !== 'POST') {
    error_response('Method not allowed.', 405);
}

require_admin();
require_csrf();

$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'] ?? '', (bool)$params['secure'], (bool)$params['httponly']);
}
session_destroy();

ok_response();
