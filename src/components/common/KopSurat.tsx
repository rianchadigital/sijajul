import React, { useState } from 'react';
import { storageService } from '../../services/storageService';
import { 
  DEFAULT_LOGO_JAYA_RAYA, 
  DEFAULT_LOGO_KESEHATAN, 
  resolveLogoImageSrc
} from '../../data/defaultLogos';

export const KopSurat: React.FC = () => {
  const logoConfig = storageService.getLogoConfig();
  const [jayaRayaError, setJayaRayaError] = useState(false);
  const [kesehatanError, setKesehatanError] = useState(false);

  const jayaRayaSrc = jayaRayaError 
    ? DEFAULT_LOGO_JAYA_RAYA 
    : resolveLogoImageSrc(logoConfig.logoJayaRaya, 'JAYA_RAYA');

  const kesehatanSrc = kesehatanError 
    ? DEFAULT_LOGO_KESEHATAN 
    : resolveLogoImageSrc(logoConfig.logoKesehatan, 'KESEHATAN');

  return (
    <div id="kop-surat-puskesmas" className="border-b-2 border-teal-800 pb-3 mb-6">
      <div className="flex items-center justify-between gap-4">
        {/* DKI Jakarta Logo (Custom / Drive Asset / Default) */}
        <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
          <img 
            src={jayaRayaSrc} 
            alt="Logo Jaya Raya" 
            className="w-16 h-16 object-contain"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={() => setJayaRayaError(true)}
          />
        </div>

        {/* Header Text */}
        <div className="text-center flex-1">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
            {logoConfig.namaPemprov || 'PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA JAKARTA'}
          </h3>
          <h2 className="text-sm sm:text-base font-extrabold text-teal-800 uppercase tracking-wide">
            {logoConfig.namaDinas || 'DINAS KESEHATAN'}
          </h2>
          <h1 className="text-base sm:text-lg font-black text-teal-900 uppercase tracking-tight">
            {logoConfig.namaPuskesmas || 'PUSKESMAS KECAMATAN KEPULAUAN SERIBU SELATAN'}
          </h1>
          <p className="text-[11px] text-slate-600 mt-0.5">
            {logoConfig.alamatPuskesmas || 'Jl. Pantai Selatan No. 1, Pulau Tidung, Kepulauan Seribu Selatan, DKI Jakarta 14520'}
          </p>
          <p className="text-[10px] text-slate-500">
            {logoConfig.kontakPuskesmas || 'Telepon: (021) 6411234 | Email: puskesmas.kepseribuselatan@jakarta.go.id'}
          </p>
        </div>

        {/* Puskesmas / Bakti Husada Logo (Custom / Drive Asset / Default) */}
        <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
          <img 
            src={kesehatanSrc} 
            alt="Logo Kesehatan" 
            className="w-16 h-16 object-contain"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={() => setKesehatanError(true)}
          />
        </div>
      </div>
      <div className="h-[2px] bg-teal-800 mt-2"></div>
      <div className="h-[0.5px] bg-teal-800 mt-[1px]"></div>
    </div>
  );
};

