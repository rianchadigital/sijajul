import React from 'react';
import { RequestStatus } from '../../types';

interface BadgeProps {
  status: RequestStatus | 'AMAN' | 'MENIPIS' | 'KOSONG' | 'GUDANG_BESAR' | 'SUB_GUDANG' | 'AKTIF' | 'NONAKTIF' | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  switch (status) {
    case 'DRAFT':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses}`}>
          Draft
        </span>
      );
    case 'DIAJUKAN':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}>
          Diajukan
        </span>
      );
    case 'DIPERIKSA':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses}`}>
          Diperiksa
        </span>
      );
    case 'DISETUJUI':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
          Disetujui
        </span>
      );
    case 'DITOLAK':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
          Ditolak
        </span>
      );
    case 'DROPPING':
    case 'DIKIRIM':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
          Dropping / Dikirim
        </span>
      );
    case 'DITERIMA':
    case 'SELESAI':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-teal-50 text-teal-700 border border-teal-200 ${sizeClasses}`}>
          Selesai / Diterima
        </span>
      );
    case 'MENUNGGU_PENGIRIMAN':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-orange-50 text-orange-700 border border-orange-200 ${sizeClasses}`}>
          Menunggu Dropping
        </span>
      );
    // Stock Statuses
    case 'AMAN':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
          Stok Aman
        </span>
      );
    case 'MENIPIS':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>
          Stok Menipis
        </span>
      );
    case 'KOSONG':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
          Stok Habis (0)
        </span>
      );
    case 'GUDANG_BESAR':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-teal-100 text-teal-800 border border-teal-300 ${sizeClasses}`}>
          Gudang Besar
        </span>
      );
    case 'SUB_GUDANG':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-sky-100 text-sky-800 border border-sky-300 ${sizeClasses}`}>
          Sub Gudang
        </span>
      );
    case 'AKTIF':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
          Aktif
        </span>
      );
    case 'NONAKTIF':
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}>
          Nonaktif
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
};
