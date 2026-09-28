<?php
/**
 * SI JAJUL - Hostinger Smart Bridge & Diagnostic Launcher
 * Memastikan aplikasi tampil mulus dan memberikan panduan jika build dist belum dieksekusi.
 */

// 1. Jika folder build dist/index.html sudah ada, sajikan langsung ke pengunjung
$distIndex = __DIR__ . '/dist/index.html';
if (file_exists($distIndex)) {
    // Sesuaikan path jika request file statis dari dist
    $requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $targetFile = __DIR__ . '/dist' . $requestUri;
    
    if ($requestUri !== '/' && file_exists($targetFile) && !is_dir($targetFile)) {
        $mimeType = mime_content_type($targetFile);
        if (str_ends_with($targetFile, '.js') || str_ends_with($targetFile, '.mjs')) {
            $mimeType = 'application/javascript';
        } elseif (str_ends_with($targetFile, '.css')) {
            $mimeType = 'text/css';
        } elseif (str_ends_with($targetFile, '.svg')) {
            $mimeType = 'image/svg+xml';
        }
        header('Content-Type: ' . $mimeType);
        readfile($targetFile);
        exit;
    }
    
    header('Content-Type: text/html; charset=UTF-8');
    readfile($distIndex);
    exit;
}

// 2. Jika file dist/ belum dibuat, tampilkan panduan diagnostik interaktif
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Panduan Deploy Hostinger • SI JAJUL Puskesmas KSS</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
    body { background-color: #0f172a; color: #f8fafc; padding: 2rem 1rem; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: #1e293b; max-width: 820px; width: 100%; border-radius: 1.25rem; border: 1px solid #334155; padding: 2.5rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0.85rem; border-radius: 9999px; background: rgba(13, 148, 136, 0.2); color: #2dd4bf; border: 1px solid #0d9488; font-size: 0.75rem; font-weight: 700; }
    h1 { font-size: 1.75rem; font-weight: 800; margin-top: 1rem; color: #ffffff; letter-spacing: -0.025em; }
    p.lead { color: #94a3b8; font-size: 0.95rem; margin-top: 0.5rem; line-height: 1.6; }
    .box { background: #0f172a; border: 1px solid #334155; border-radius: 0.85rem; padding: 1.25rem; margin-top: 1.5rem; }
    .box h2 { font-size: 1rem; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 0.5rem; }
    ol { margin-top: 0.75rem; padding-left: 1.25rem; color: #cbd5e1; font-size: 0.875rem; line-height: 1.8; }
    code { font-family: 'JetBrains Mono', monospace; background: #334155; color: #fcd34d; padding: 0.15rem 0.4rem; border-radius: 0.25rem; font-size: 0.825rem; }
    .step-badge { background: #0d9488; color: white; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 0.75rem; font-weight: bold; margin-right: 0.35rem; }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-weight: 700; font-size: 0.875rem; text-decoration: none; cursor: pointer; transition: all 0.2s; margin-top: 1.5rem; }
    .btn-primary { background: #0d9488; color: white; }
    .btn-primary:hover { background: #0f766e; }
    .btn-secondary { background: #334155; color: #f8fafc; margin-left: 0.75rem; }
    .btn-secondary:hover { background: #475569; }
    .alert { background: rgba(245, 158, 11, 0.15); border: 1px solid #d97706; color: #fef3c7; border-radius: 0.75rem; padding: 1rem; margin-top: 1.5rem; font-size: 0.85rem; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <span>🚀</span> PANDUAN DEPLOYMENT HOSTINGER &amp; GITHUB
    </div>
    <h1>Mengapa Tampilan di Hostinger Sempat Blank ("Ngeblenk")?</h1>
    <p class="lead">
      Web server Apache/LiteSpeed di Hostinger secara standar menyajikan file HTML statis. Source code Vite React memerlukan proses <code>npm run build</code> agar file TypeScript (<code>.tsx</code>) dikompilasi menjadi bundel HTML, JS, dan CSS di dalam folder <code>dist/</code>.
    </p>

    <div class="alert">
      <strong>💡 Kabar Baik:</strong> Repositori ini telah kami lengkapi dengan <strong>GitHub Actions Auto-Deploy</strong> dan konfigurasi <code>.htaccess</code>. Anda cukup memilih salah satu dari 2 cara mudah di bawah agar aplikasi langsung tampil seketika setiap kali web diakses!
    </div>

    <div class="box">
      <h2><span class="step-badge">1</span> Cara Otomatis: GitHub Actions ke Hostinger FTP (Sangat Direkomendasikan)</h2>
      <ol>
        <li>Buka <strong>cPanel / hPanel Hostinger</strong> &gt; Cari menu <strong>Akun FTP (FTP Accounts)</strong>. Catat <em>Host FTP</em>, <em>Username FTP</em>, dan <em>Password FTP</em> Anda.</li>
        <li>Buka repository Anda di <strong>GitHub</strong> &gt; Masuk ke menu <strong>Settings</strong> &gt; <strong>Secrets and variables</strong> &gt; <strong>Actions</strong>.</li>
        <li>Klik tombol <strong>New repository secret</strong> dan tambahkan 3 variabel rahasia ini:
          <ul>
            <li><code>HOSTINGER_FTP_HOST</code> = Host/IP FTP dari Hostinger (contoh: <code>ftp.domainanda.com</code>)</li>
            <li><code>HOSTINGER_FTP_USER</code> = Username FTP Anda</li>
            <li><code>HOSTINGER_FTP_PASSWORD</code> = Password akun FTP Anda</li>
          </ul>
        </li>
        <li>Selesai! Setiap kali Anda push ke GitHub, GitHub Actions otomatis mengompilasi dan mengunggah aplikasi ke <code>public_html/</code> Hostinger. Langsung aktif tanpa blank!</li>
      </ol>
    </div>

    <div class="box">
      <h2><span class="step-badge">2</span> Cara Manual Cepat: Upload Folder dist ke public_html</h2>
      <ol>
        <li>Di komputer lokal Anda, jalankan perintah: <code>npm run build</code></li>
        <li>Buka folder hasil build <code>dist/</code>.</li>
        <li>Unggah seluruh isi yang ada di <strong>dalam folder dist/</strong> (termasuk folder <code>assets/</code>, <code>index.html</code>, dan <code>.htaccess</code>) langsung ke dalam folder <strong>public_html/</strong> di File Manager Hostinger Anda.</li>
      </ol>
    </div>

    <div style="margin-top: 1.5rem; text-align: center;">
      <a href="javascript:location.reload()" class="btn btn-primary">🔄 Cek Ulang Status Web</a>
    </div>
  </div>
</body>
</html>
