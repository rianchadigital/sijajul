<?php
/**
 * SI JAJUL - Puskesmas Kecamatan Kepulauan Seribu Selatan
 * Hostinger Production Direct Launcher & Asset Bridge
 * 
 * Fungsi:
 * 1. Menjamin seluruh file JavaScript (.js), CSS, dan font disajikan dengan MIME-type yang benar.
 * 2. Mencegah layar blank (putih) di server Apache / LiteSpeed Hostinger.
 * 3. Otomatis melayani file bundel produksi (dist/) baik saat deploy via Hostinger Git maupun FTP.
 */

// Matikan error display yang bisa merusak payload JS/JSON
ini_set('display_errors', '0');
error_reporting(0);

$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$filename = basename($requestUri);
$ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

// Daftar MIME type resmi
$mimes = [
    'js'    => 'application/javascript; charset=UTF-8',
    'mjs'   => 'application/javascript; charset=UTF-8',
    'css'   => 'text/css; charset=UTF-8',
    'json'  => 'application/json; charset=UTF-8',
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
    'map'   => 'application/json',
];

// 1. Tangani request file aset statis (JS, CSS, Gambar, Font)
if (!empty($ext) && isset($mimes[$ext])) {
    $cleanPath = ltrim($requestUri, '/');
    
    // Hilangkan prefix direktori jika aplikasi berada di subfolder
    $cleanPath = preg_replace('#^(public_html|dist)/#', '', $cleanPath);

    $candidates = [
        __DIR__ . '/dist/assets/' . $filename,
        __DIR__ . '/assets/' . $filename,
        __DIR__ . '/dist/' . $cleanPath,
        __DIR__ . '/' . $cleanPath,
        __DIR__ . '/public/' . $cleanPath,
    ];

    $servedFile = null;
    foreach ($candidates as $cand) {
        if (file_exists($cand) && is_file($cand)) {
            $servedFile = $cand;
            break;
        }
    }

    // Jika file JS/CSS spesifik hash tidak ditemukan, cari alternatif terbaru
    if (!$servedFile && in_array($ext, ['js', 'css'])) {
        $searchDirs = [__DIR__ . '/dist/assets', __DIR__ . '/assets'];
        foreach ($searchDirs as $dir) {
            if (is_dir($dir)) {
                $matches = glob($dir . '/*.' . $ext);
                if (!empty($matches)) {
                    // Ambil file yang paling baru dimodifikasi
                    usort($matches, function($a, $b) {
                        return filemtime($b) - filemtime($a);
                    });
                    $servedFile = $matches[0];
                    break;
                }
            }
        }
    }

    if ($servedFile && file_exists($servedFile)) {
        header('Content-Type: ' . $mimes[$ext]);
        header('X-Content-Type-Options: nosniff');
        header('Cache-Control: public, max-age=31536000');
        header('Content-Length: ' . filesize($servedFile));
        readfile($servedFile);
        exit;
    }

    // Jika aset statis benar-benar tidak ditemukan
    http_response_code(404);
    header('Content-Type: text/plain; charset=UTF-8');
    echo "Asset not found: " . htmlspecialchars($filename);
    exit;
}

// 2. Tangani request halaman aplikasi utama (SPA Frontend)
// Prioritas A: dist/index.html hasil build produksi
$distIndex = __DIR__ . '/dist/index.html';
if (file_exists($distIndex) && filesize($distIndex) > 0) {
    header('Content-Type: text/html; charset=UTF-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('X-Frame-Options: SAMEORIGIN');
    readfile($distIndex);
    exit;
}

// Prioritas B: index.html di root (hanya jika sudah terkompilasi dan memuat /assets/)
$rootIndex = __DIR__ . '/index.html';
if (file_exists($rootIndex)) {
    $content = file_get_contents($rootIndex);
    // Jika root index.html bukan file dev mentah (tidak merujuk ke /src/main.tsx)
    if (strpos($content, '/src/main.tsx') === false) {
        header('Content-Type: text/html; charset=UTF-8');
        header('Cache-Control: no-cache, no-store, must-revalidate');
        echo $content;
        exit;
    }
}

// Prioritas C: Render dinamis mandiri dari file bundel yang ada di assets/
$bundleJs = null;
$bundleCss = null;

$scanDirs = [__DIR__ . '/dist/assets', __DIR__ . '/assets'];
foreach ($scanDirs as $sDir) {
    if (is_dir($sDir)) {
        $jsFiles = glob($sDir . '/index-*.js');
        if (empty($jsFiles)) {
            $jsFiles = glob($sDir . '/*.js');
        }
        if (!empty($jsFiles) && !$bundleJs) {
            usort($jsFiles, function($a, $b) { return filemtime($b) - filemtime($a); });
            $bundleJs = basename($jsFiles[0]);
        }

        $cssFiles = glob($sDir . '/index-*.css');
        if (empty($cssFiles)) {
            $cssFiles = glob($sDir . '/*.css');
        }
        if (!empty($cssFiles) && !$bundleCss) {
            usort($cssFiles, function($a, $b) { return filemtime($b) - filemtime($a); });
            $bundleCss = basename($cssFiles[0]);
        }
    }
}

if ($bundleJs) {
    header('Content-Type: text/html; charset=UTF-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    ?>
<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>SI JAJUL | Sistem Informasi Jaga Stok dan Jalur Logistik Puskesmas Kepulauan Seribu Selatan</title>
    <meta name="description" content="SI JAJUL - Sistem Informasi Jaga Stok dan Jalur Logistik Puskesmas Kepulauan Seribu Selatan" />
    <meta name="theme-color" content="#0f766e" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
    <script type="module" crossorigin src="./assets/<?php echo htmlspecialchars($bundleJs); ?>"></script>
    <?php if ($bundleCss): ?>
    <link rel="stylesheet" crossorigin href="./assets/<?php echo htmlspecialchars($bundleCss); ?>">
    <?php endif; ?>
  </head>
  <body class="bg-slate-100 text-slate-900 font-sans antialiased">
    <div id="root"></div>
  </body>
</html>
    <?php
    exit;
}

// Fallback Terakhir: Tampilan Diagnostik Bersahabat (Mencegah Layar Blank Putih Sama Sekali)
http_response_code(200);
header('Content-Type: text/html; charset=UTF-8');
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SI JAJUL - Panduan Inisialisasi Hostinger</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #0f172a; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 20px; max-width: 640px; width: 100%; padding: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        .badge { display: inline-flex; align-items: center; background: #0d9488; color: white; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; margin-bottom: 16px; }
        h1 { font-size: 22px; font-weight: 800; color: #ffffff; margin-bottom: 8px; }
        p { font-size: 13px; color: #94a3b8; line-height: 1.6; margin-bottom: 20px; }
        .step { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 14px 16px; margin-bottom: 12px; display: flex; gap: 12px; align-items: flex-start; }
        .num { background: #0d9488; color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; flex-shrink: 0; margin-top: 2px; }
        .st-title { font-size: 13px; font-weight: 700; color: #f1f5f9; }
        .st-desc { font-size: 11px; color: #94a3b8; margin-top: 2px; }
        .btn { display: inline-block; background: #0d9488; color: white; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 700; text-decoration: none; text-align: center; margin-top: 10px; cursor: pointer; border: none; }
        .btn:hover { background: #0f766e; }
        code { background: #334155; color: #38bdf8; padding: 2px 6px; border-radius: 6px; font-size: 11px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="card">
        <div class="badge">PUSKESMAS KECAMATAN KEPULAUAN SERIBU SELATAN</div>
        <h1>SI JAJUL - Setup Hostinger</h1>
        <p>File kompilasi produksi (<code>dist/</code>) belum terdeteksi di server Hostinger Anda. Ikuti salah satu langkah mudah berikut:</p>
        
        <div class="step">
            <div class="num">1</div>
            <div>
                <div class="st-title">Metode Hostinger Git (Otomatis)</div>
                <div class="st-desc">Pastikan folder <code>dist/</code> dan <code>assets/</code> sudah di-push ke repository GitHub Anda, lalu klik tombol <strong>Deploy</strong> di menu Git hPanel Hostinger.</div>
            </div>
        </div>

        <div class="step">
            <div class="num">2</div>
            <div>
                <div class="st-title">Metode File Manager (Instan)</div>
                <div class="st-desc">Jalankan <code>npm run build</code> di komputer Anda, lalu upload seluruh isi folder <code>dist/</code> langsung ke dalam <code>public_html/</code> di Hostinger.</div>
            </div>
        </div>

        <button onclick="window.location.reload()" class="btn">🔄 Muat Ulang Halaman</button>
    </div>
</body>
</html>
