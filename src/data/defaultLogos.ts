/**
 * Default Official SVG Data URIs for DKI Jakarta Jaya Raya & Health Ministry / Bakti Husada
 */

export const DEFAULT_LOGO_JAYA_RAYA = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="gradJaya" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%230f766e" />
      <stop offset="100%" stop-color="%23115e59" />
    </linearGradient>
  </defs>
  <!-- Perisai / Shield -->
  <path d="M50 4 C24 4 14 18 14 42 C14 74 50 94 50 94 C50 94 86 74 86 42 C86 18 76 4 50 4 Z" fill="url(%23gradJaya)" stroke="%23f59e0b" stroke-width="3"/>
  <!-- Lingkaran Luar Emas -->
  <circle cx="50" cy="46" r="30" fill="%23ffffff" stroke="%23f59e0b" stroke-width="2"/>
  <!-- Tugu Monas Stylized -->
  <path d="M48 24 L52 24 L51 58 L49 58 Z" fill="%23d97706"/>
  <!-- Lidah Api Monas Emas -->
  <path d="M50 18 C47 21 48 24 50 24 C52 24 53 21 50 18 Z" fill="%23f59e0b"/>
  <!-- Pelataran Cawan Monas -->
  <path d="M42 58 L58 58 L55 64 L45 64 Z" fill="%23d97706"/>
  <!-- Gelombang Air (Kepulauan / Bahari) -->
  <path d="M26 62 Q38 56 50 62 T74 62" stroke="%230284c7" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M30 67 Q40 63 50 67 T70 67" stroke="%230284c7" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- Pita JAYA RAYA -->
  <rect x="20" y="74" width="60" height="14" rx="3" fill="%23f59e0b" stroke="%23b45309" stroke-width="1.5"/>
  <text x="50" y="84" font-family="Arial, Helvetica, sans-serif" font-size="7.5" font-weight="900" text-anchor="middle" fill="%231e293b" letter-spacing="1">JAYA RAYA</text>
  <!-- Bintang Kemuliaan -->
  <polygon points="50,22 51.5,25.5 55,26 52.5,28.5 53,32 50,30 47,32 47.5,28.5 45,26 48.5,25.5" fill="%23f59e0b"/>
</svg>`;

export const DEFAULT_LOGO_KESEHATAN = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="gradKes" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%2310b981" />
      <stop offset="100%" stop-color="%23047857" />
    </linearGradient>
  </defs>
  <!-- Background Circle Segi Delapan / Lotus Puskesmas -->
  <circle cx="50" cy="50" r="45" fill="%23f0fdf4" stroke="%2310b981" stroke-width="3"/>
  <circle cx="50" cy="50" r="40" fill="url(%23gradKes)"/>
  <!-- Palang Hijau / Putih Medis -->
  <rect x="42" y="24" width="16" height="52" rx="4" fill="%23ffffff"/>
  <rect x="24" y="42" width="52" height="16" rx="4" fill="%23ffffff"/>
  <!-- Tunas Kesehatan / Jantung / Palang Tengah -->
  <circle cx="50" cy="50" r="9" fill="%2310b981"/>
  <circle cx="50" cy="50" r="5" fill="%23ffffff"/>
  <!-- Lingkaran Proteksi -->
  <circle cx="50" cy="50" r="34" fill="none" stroke="%23ffffff" stroke-width="1.5" stroke-dasharray="3,3"/>
  <!-- Label Text -->
  <text x="50" y="87" font-family="Arial, Helvetica, sans-serif" font-size="6.5" font-weight="bold" text-anchor="middle" fill="%23ffffff" letter-spacing="0.5">BAKTI HUSADA</text>
</svg>`;
