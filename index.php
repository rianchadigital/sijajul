<?php
/**
 * SI JAJUL - Puskesmas Kecamatan Kepulauan Seribu Selatan
 * Hostinger Production Direct Launcher
 * Menjamin aset CSS, JS, dan HTML disajikan dengan MIME type yang tepat tanpa layar putih (blank).
 */

$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$filename = basename($requestUri);
$ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

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

// 1. Cek jika request adalah file aset statis berdasarkan ekstensi
if (!empty($ext) && isset($mimes[$ext])) {
    $candidate1 = __DIR__ . '/dist/assets/' . $filename;
    $candidate2 = __DIR__ . '/assets/' . $filename;
    $candidate3 = __DIR__ . '/dist/' . ltrim($requestUri, '/');
    $candidate4 = __DIR__ . '/' . ltrim($requestUri, '/');

    $fileToServe = null;
    if (file_exists($candidate1) && !is_dir($candidate1)) {
        $fileToServe = $candidate1;
    } elseif (file_exists($candidate2) && !is_dir($candidate2)) {
        $fileToServe = $candidate2;
    } elseif (file_exists($candidate3) && !is_dir($candidate3)) {
        $fileToServe = $candidate3;
    } elseif (file_exists($candidate4) && !is_dir($candidate4)) {
        $fileToServe = $candidate4;
    }

    if ($fileToServe) {
        header('Content-Type: ' . $mimes[$ext]);
        header('Cache-Control: public, max-age=31536000');
        readfile($fileToServe);
        exit;
    }
}

// 2. Untuk semua request halaman aplikasi, sajikan dist/index.html
$distIndex = __DIR__ . '/dist/index.html';
if (file_exists($distIndex)) {
    header('Content-Type: text/html; charset=UTF-8');
    readfile($distIndex);
    exit;
}

$rootIndex = __DIR__ . '/index.html';
if (file_exists($rootIndex)) {
    header('Content-Type: text/html; charset=UTF-8');
    readfile($rootIndex);
    exit;
}

http_response_code(500);
echo "SI JAJUL: File index.html produksi tidak ditemukan.";
exit;
