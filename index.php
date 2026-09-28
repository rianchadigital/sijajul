<?php
/**
 * SI JAJUL - Puskesmas Kecamatan Kepulauan Seribu Selatan
 * Hostinger Production Bridge - Menyajikan aplikasi SI JAJUL langsung tanpa perantara
 */

$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

// Bersihkan prefix /dist/ jika ada
$cleanPath = preg_replace('#^/dist/#', '/', $requestUri);

// Cek apakah request untuk file statis di dalam dist/
$targetFile = __DIR__ . '/dist' . $cleanPath;

if ($cleanPath !== '/' && file_exists($targetFile) && !is_dir($targetFile)) {
    $ext = strtolower(pathinfo($targetFile, PATHINFO_EXTENSION));
    $mimes = [
        'js'    => 'application/javascript',
        'mjs'   => 'application/javascript',
        'css'   => 'text/css',
        'json'  => 'application/json',
        'svg'   => 'image/svg+xml',
        'png'   => 'image/png',
        'jpg'   => 'image/jpeg',
        'jpeg'  => 'image/jpeg',
        'gif'   => 'image/gif',
        'webp'  => 'image/webp',
        'ico'   => 'image/x-icon',
        'woff'  => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf'   => 'font/ttf',
    ];

    $contentType = $mimes[$ext] ?? 'application/octet-stream';
    header('Content-Type: ' . $contentType);
    header('Cache-Control: public, max-age=31536000');
    readfile($targetFile);
    exit;
}

// Sajikan index.html dari folder dist
$distIndex = __DIR__ . '/dist/index.html';
if (file_exists($distIndex)) {
    header('Content-Type: text/html; charset=UTF-8');
    readfile($distIndex);
    exit;
}

// Fallback langsung render index.html di root jika ada
$rootIndex = __DIR__ . '/index.html';
if (file_exists($rootIndex)) {
    header('Content-Type: text/html; charset=UTF-8');
    readfile($rootIndex);
    exit;
}

http_response_code(404);
echo "Aplikasi SI JAJUL sedang disiapkan.";
exit;
