<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/media.php';

function make_slug(string $value): string
{
    $value = trim($value);
    $transliterated = function_exists('iconv') ? iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value) : $value;
    $slug = strtolower((string)$transliterated);
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
    $slug = trim($slug, '-');
    return $slug !== '' ? substr($slug, 0, 180) : 'post-' . bin2hex(random_bytes(8));
}

function safe_blog_html(string $html): string
{
    $allowedTags = '<p><h2><h3><h4><strong><em><b><i><ul><ol><li><blockquote><a><br><hr>';

    // The contenteditable editor wraps each typed line in <div> and uses <br>
    // for soft breaks. <div> is not an allowed tag, so convert the line
    // structure to <br> (a real line break) BEFORE sanitisation strips the
    // divs. Doing it as tags (not newlines) means line breaks survive even
    // when the content also contains inline tags like <b> or block tags like
    // <blockquote>.
    $html = preg_replace('/<div[^>]*>/i', '', $html) ?? $html;
    $html = preg_replace('/<\/div>/i', '<br>', $html) ?? $html;

    $html = strip_tags($html, $allowedTags);
    $html = preg_replace('/<(script|style|iframe|object|embed|form|input|button)[^>]*>.*?<\/\1>/is', '', $html) ?? $html;
    $html = preg_replace_callback('/<([a-z0-9]+)([^>]*)>/i', static function (array $match): string {
        $tag = strtolower($match[1]);
        if ($tag === 'br' || $tag === 'hr') return '<' . $tag . '>';
        if ($tag === 'a') {
            preg_match('/href\s*=\s*["\']([^"\']+)["\']/i', $match[2], $hrefMatch);
            $href = $hrefMatch[1] ?? '#';
            if (!preg_match('/^(https?:\/\/|mailto:|#)/i', $href)) $href = '#';
            return '<a href="' . htmlspecialchars($href, ENT_QUOTES, 'UTF-8') . '" target="_blank" rel="noopener noreferrer">';
        }
        return '<' . $tag . '>';
    }, $html) ?? $html;
    $html = preg_replace('/javascript\s*:/i', '', $html) ?? $html;
    // Plain-text newlines (from a textarea or pasted text) become <br>.
    // Genuine block-structured HTML (p/h2/ul/li/blockquote...) treats any
    // remaining newlines as formatting whitespace, so strip them instead of
    // injecting stray <br>s. Inline tags (<b>, <strong>, <a>...) do NOT count
    // as structure, so text with inline formatting still keeps its line breaks.
    if (preg_match('/<(p|h[2-4]|ul|ol|li|blockquote|hr)\b[^>]*>/i', $html)) {
        $html = preg_replace('/[ \t]*[\r\n]+[ \t]*/', '', $html) ?? $html;
    } else {
        $html = str_replace(["\r\n", "\r", "\n"], '<br>', $html);
    }
    // Tidy up trailing line breaks left by a final </div>.
    $html = preg_replace('/(?:<br>)+$/', '', $html) ?? $html;
    return trim($html);
}

function blog_payload(array $post, bool $includeContent = false): array
{
    $payload = [
        'id' => (int)$post['id'],
        'slug' => $post['slug'],
        'title' => $post['title'],
        'excerpt' => $post['excerpt'],
        'category' => $post['category'] ?? 'training',
        'cover_url' => media_public_url($post['cover_path'] ?? null, 'blog'),
        'status' => $post['status'] ?? 'published',
        'published_at' => $post['published_at'],
        'created_at' => $post['created_at'] ?? null,
        'updated_at' => $post['updated_at'] ?? null,
    ];
    if ($includeContent) $payload['content_html'] = $post['content_html'];
    return $payload;
}
