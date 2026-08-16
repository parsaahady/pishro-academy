<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/api/auth.php';

require_admin();

// One-time repair for blog posts whose content_html was saved as a single
// run-on string (line breaks lost by an older sanitizer). We recover the
// structure from the surviving separators (━━ lines) and section-starter
// emoji, then re-store the repaired HTML. Idempotent: already-structured
// content is left untouched, so re-running is safe.
//
// Trigger by visiting  /api/repair-blogs.php  while logged in to the admin
// panel (same browser/session). Returns a JSON report of what changed.

if (request_method() !== 'POST' && request_method() !== 'GET') {
    error_response('Method not allowed.', 405);
}

const SECTION_STARTERS = '🎯🏅📅📍💳🚀☎🏁🗓⏰📞✅';

function repair_glued_text(string $text): string
{
    $parts = preg_split('/(━{2,})/u', $text, -1, PREG_SPLIT_DELIM_CAPTURE);
    $lines = [];
    foreach ($parts as $segment) {
        if (preg_match('/^━+$/u', $segment)) {
            $lines[] = $segment;
            continue;
        }
        $subs = preg_split('/(?=[' . SECTION_STARTERS . '])/u', $segment);
        foreach ($subs as $sub) {
            $bullets = preg_split('/(?=•\s)/u', $sub);
            foreach ($bullets as $bullet) {
                $cleaned = trim($bullet);
                if ($cleaned !== '') {
                    $lines[] = $cleaned;
                }
            }
        }
    }
    return implode("\n", $lines);
}

function repair_content_html(?string $html): ?string
{
    if ($html === null || $html === '') {
        return $html;
    }
    // Already structured (tags) → leave as-is.
    if (preg_match('/<[a-z][^>]*>/i', $html)) {
        return $html;
    }
    // Plain text with newlines → convert to <br>.
    if (preg_match('/[\r\n]/', $html)) {
        return str_replace(["\r\n", "\r", "\n"], '<br>', $html);
    }
    // Glued plain text → recover line structure.
    $repaired = repair_glued_text($html);
    return str_replace(["\r\n", "\r", "\n"], '<br>', $repaired);
}

$stmt = db()->query('SELECT id, slug, title, content_html FROM blog_posts ORDER BY id ASC');
$posts = $stmt->fetchAll();

$changed = [];
$unchanged = 0;
$update = db()->prepare('UPDATE blog_posts SET content_html = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?');

foreach ($posts as $post) {
    $repaired = repair_content_html($post['content_html']);
    if ($repaired === $post['content_html']) {
        $unchanged++;
        continue;
    }
    $update->execute([$repaired, (int)$post['id']]);
    $changed[] = [
        'id' => (int)$post['id'],
        'slug' => $post['slug'],
        'title' => $post['title'],
        'before_chars' => strlen((string)$post['content_html']),
        'after_chars' => strlen($repaired),
    ];
}

ok_response([
    'repaired' => count($changed),
    'unchanged' => $unchanged,
    'posts' => $changed,
]);
