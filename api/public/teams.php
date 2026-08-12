<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/bootstrap.php';

if (request_method() !== 'GET') {
    error_response('Method not allowed.', 405);
}

$stmt = db()->query(
    'SELECT slug, name, english_name, age_range, discipline, image_path
     FROM teams
     WHERE is_active = 1
     ORDER BY sort_order ASC, id ASC'
);

ok_response(['teams' => $stmt->fetchAll()]);
