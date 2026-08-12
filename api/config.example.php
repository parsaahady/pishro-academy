<?php
declare(strict_types=1);

/*
 * Copy this file to api/config.php on the server and fill in the values
 * supplied by your hosting provider.
 */
return [
    'db' => [
        'host' => 'localhost',
        'name' => 'pishro_database',
        'user' => 'pishro_db_user',
        'pass' => 'CHANGE_THIS_DATABASE_PASSWORD',
        'charset' => 'utf8mb4',
    ],
    'app' => [
        // Set to true after the site is served over HTTPS.
        'cookie_secure' => false,
        'max_upload_bytes' => 3 * 1024 * 1024,
        'upload_dir' => dirname(__DIR__) . '/uploads/players',
        'upload_url' => 'uploads/players',
        'blog_upload_dir' => dirname(__DIR__) . '/uploads/blogs',
        'blog_upload_url' => 'uploads/blogs',
        'coach_upload_dir' => dirname(__DIR__) . '/uploads/coaches',
        'coach_upload_url' => 'uploads/coaches',
        // Use a long random value. Disable setup after creating the first admin.
        'setup_enabled' => true,
        'setup_token' => 'CHANGE_THIS_TO_A_LONG_RANDOM_SETUP_TOKEN',
    ],
];
