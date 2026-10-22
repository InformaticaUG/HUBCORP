<?php
declare(strict_types=1);

$config = require __DIR__ . '/config.php';
const CONTENT_FILE = __DIR__ . '/content.json';
const UPLOAD_DIR   = __DIR__ . '/../Media/People-Hub/subidas';
const UPLOAD_URL   = 'Media/People-Hub/subidas/';
const ATTEMPTS     = __DIR__ . '/data/attempts.json';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
session_name('phsid');
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Strict']);
session_start();

function out($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function body(): array {
    $d = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($d) ? $d : [];
}
function require_admin(): void {
    if (empty($_SESSION['admin'])) out(['error' => 'No autorizado'], 401);
}
function safe_url(string $u): string {
    $u = trim($u);
    if ($u === '' || strlen($u) > 2000) return '';
    if (preg_match('#^(https?://|mailto:|tel:)#i', $u)) return $u;
    if (preg_match('#^[a-z][a-z0-9+.-]*:#i', $u)) return '';
    if (preg_match('#^(/|\./|\.\./|\#)#', $u) || preg_match('#\.(html|pdf|docx?|xlsx?|pptx?)$#i', $u)) return $u;
    return 'https://' . $u;
}
function clean_block(array $d): ?array {
    $text = is_string($d['text'] ?? null) ? trim(mb_substr($d['text'], 0, 20000)) : '';
    $links = [];
    foreach (array_slice(is_array($d['links'] ?? null) ? $d['links'] : [], 0, 20) as $l) {
        if (!is_array($l)) continue;
        $url = safe_url((string)($l['url'] ?? ''));
        if ($url !== '') $links[] = ['label' => trim(mb_substr((string)($l['label'] ?? ''), 0, 200)), 'url' => $url];
    }
    $images = [];
    foreach (array_slice(is_array($d['images'] ?? null) ? $d['images'] : [], 0, 20) as $p) {
        if (is_string($p) && preg_match('#^Media/People-Hub/subidas/[A-Za-z0-9_-]+\.(jpg|png|webp|gif)$#', $p) && is_file(__DIR__ . '/../' . $p)) $images[] = $p;
    }
    if ($text === '' && !$links && !$images) return null;
    return ['text' => $text, 'images' => $images, 'links' => $links];
}

$action = $_GET['action'] ?? '';

if ($action === 'session') out(['admin' => !empty($_SESSION['admin'])]);

// Resto de acciones: solo POST con cabecera propia (protección CSRF)
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') !== 'PeopleHub') {
    out(['error' => 'Petición no válida'], 400);
}

if ($action === 'login') {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'x';
    $att = is_file(ATTEMPTS) ? (json_decode((string)file_get_contents(ATTEMPTS), true) ?: []) : [];
    $now = time();
    foreach ($att as $k => $v) if ($now - ($v['t'] ?? 0) > 900) unset($att[$k]);
    if (($att[$ip]['n'] ?? 0) >= 5) out(['error' => 'Demasiados intentos. Espera 15 minutos.'], 429);

    $b = body();
    $okUser = hash_equals(strtolower($config['admin_user']), strtolower(trim((string)($b['user'] ?? ''))));
    $okPass = password_verify((string)($b['pass'] ?? ''), $config['admin_pass_hash']);
    if ($okUser && $okPass) {
        unset($att[$ip]);
        @file_put_contents(ATTEMPTS, json_encode($att), LOCK_EX);
        session_regenerate_id(true);
        $_SESSION['admin'] = true;
        out(['ok' => true]);
    }
    usleep(800000);
    $att[$ip] = ['n' => ($att[$ip]['n'] ?? 0) + 1, 't' => $now];
    @file_put_contents(ATTEMPTS, json_encode($att), LOCK_EX);
    out(['error' => 'Usuario o contraseña incorrectos.'], 401);
}

if ($action === 'logout') {
    $_SESSION = [];
    session_destroy();
    out(['ok' => true]);
}

if ($action === 'save') {
    require_admin();
    $b = body();
    $key = $b['key'] ?? null;
    if (!is_string($key) || !preg_match('/^[a-z0-9_-]{1,40}\|.{1,160}$/u', $key)) out(['error' => 'Clave no válida'], 400);
    $block = is_array($b['data'] ?? null) ? clean_block($b['data']) : null;

    $fp = fopen(CONTENT_FILE, 'c+');
    if (!$fp || !flock($fp, LOCK_EX)) out(['error' => 'No se pudo abrir content.json (revisa permisos)'], 500);
    $content = json_decode((string)stream_get_contents($fp), true);
    if (!is_array($content)) $content = [];
    if ($block === null) unset($content[$key]); else $content[$key] = $block;
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($content, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    out(['ok' => true, 'content' => $content]);
}

if ($action === 'upload') {
    require_admin();
    $f = $_FILES['file'] ?? null;
    if (!$f || $f['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) out(['error' => 'Error al subir el archivo'], 400);
    if ($f['size'] > 8 * 1024 * 1024) out(['error' => 'Imagen demasiado grande (máx. 8 MB)'], 413);
    $info = @getimagesize($f['tmp_name']);
    $exts = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
    if (!$info || !isset($exts[$info['mime']])) out(['error' => 'Formato de imagen no permitido'], 415);
    $name = bin2hex(random_bytes(8)) . '.' . $exts[$info['mime']];
    if (!move_uploaded_file($f['tmp_name'], UPLOAD_DIR . '/' . $name)) out(['error' => 'No se pudo guardar (revisa permisos de Media/People-Hub/subidas/)'], 500);
    out(['ok' => true, 'path' => UPLOAD_URL . $name]);
}

out(['error' => 'Acción desconocida'], 404);
