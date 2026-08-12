<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/auth.php';

$admin = current_admin();
if (!$admin) {
    ok_response(['authenticated' => false]);
}

ok_response([
    'authenticated' => true,
    'admin' => $admin,
    'csrf_token' => csrf_token(),
]);
