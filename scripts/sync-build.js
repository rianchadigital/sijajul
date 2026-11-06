import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const distAssetsDir = path.join(distDir, 'assets');
const rootAssetsDir = path.join(rootDir, 'assets');

console.log('🔄 Menyelaraskan hasil build produksi untuk Hostinger...');

if (!fs.existsSync(distDir)) {
  console.error('❌ Folder dist/ tidak ditemukan. Jalankan vite build terlebih dahulu.');
  process.exit(1);
}

// 1. Pastikan folder root /assets ada
if (!fs.existsSync(rootAssetsDir)) {
  fs.mkdirSync(rootAssetsDir, { recursive: true });
}

// 2. Ambil daftar file aktif di dist/assets/
let activeAssetFiles = [];
if (fs.existsSync(distAssetsDir)) {
  activeAssetFiles = fs.readdirSync(distAssetsDir);
  for (const file of activeAssetFiles) {
    const srcFile = path.join(distAssetsDir, file);
    const destFile = path.join(rootAssetsDir, file);
    if (fs.statSync(srcFile).isFile()) {
      fs.copyFileSync(srcFile, destFile);
      console.log(`  ✅ Asset tersinkron ke root: assets/${file}`);
    }
  }
}

// 3. Bersihkan file aset usang di root /assets yang bukan .aistudio dan bukan file aktif
if (fs.existsSync(rootAssetsDir)) {
  const rootFiles = fs.readdirSync(rootAssetsDir);
  for (const rf of rootFiles) {
    if (rf === '.aistudio') continue;
    if (!activeAssetFiles.includes(rf)) {
      const oldPath = path.join(rootAssetsDir, rf);
      if (fs.statSync(oldPath).isFile()) {
        try {
          fs.unlinkSync(oldPath);
          console.log(`  🧹 Membersihkan aset lama yang tidak terpakai: assets/${rf}`);
        } catch (e) {}
      }
    }
  }
}

// 4. Pastikan folder root /images ada dan sinkron dari public/images
const publicImagesDir = path.join(rootDir, 'public', 'images');
const rootImagesDir = path.join(rootDir, 'images');
const distImagesDir = path.join(distDir, 'images');

if (!fs.existsSync(rootImagesDir)) {
  fs.mkdirSync(rootImagesDir, { recursive: true });
}

const copyImages = (srcDir) => {
  if (fs.existsSync(srcDir)) {
    const imgFiles = fs.readdirSync(srcDir);
    for (const f of imgFiles) {
      const srcFile = path.join(srcDir, f);
      const destFile = path.join(rootImagesDir, f);
      if (fs.statSync(srcFile).isFile()) {
        fs.copyFileSync(srcFile, destFile);
        console.log(`  ✅ Image tersinkron ke root: images/${f}`);
      }
    }
  }
};

copyImages(publicImagesDir);
copyImages(distImagesDir);

// 5. Buat file build-version.json di root dan dist
const buildInfo = {
  appName: 'SI JAJUL - Puskesmas Kepulauan Seribu Selatan',
  buildTime: new Date().toISOString(),
  timestamp: Date.now(),
  target: 'Hostinger Production',
  status: 'READY'
};

fs.writeFileSync(path.join(distDir, 'build-version.json'), JSON.stringify(buildInfo, null, 2));
fs.writeFileSync(path.join(rootDir, 'build-version.json'), JSON.stringify(buildInfo, null, 2));
console.log('  ✅ build-version.json berhasil dibuat');

// 6. Salin index.php dan .htaccess ke dalam dist/ agar dist/ mandiri
const indexPhpSrc = path.join(rootDir, 'index.php');
const indexPhpDist = path.join(distDir, 'index.php');
if (fs.existsSync(indexPhpSrc)) {
  fs.copyFileSync(indexPhpSrc, indexPhpDist);
  console.log('  ✅ index.php disalin ke dist/');
}

const htaccessSrc = path.join(rootDir, '.htaccess');
const htaccessDist = path.join(distDir, '.htaccess');
if (fs.existsSync(htaccessSrc)) {
  fs.copyFileSync(htaccessSrc, htaccessDist);
  console.log('  ✅ .htaccess disalin ke dist/');
}

console.log('🚀 Sinkronisasi selesai: SI JAJUL siap dideploy ke Hostinger tanpa risiko layar blank!');
