import React, { useState, useEffect } from 'react';
import { Bot, MessageSquare, X, Sparkles } from 'lucide-react';
import { storageService } from '../../services/storageService';

interface FloatingRobotButtonProps {
  onClick: () => void;
}

export const FloatingRobotButton: React.FC<FloatingRobotButtonProps> = ({ onClick }) => {
  const [showTooltip, setShowTooltip] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const waConfig = storageService.getWhatsappConfig();

  // Automatically show greeting speech bubble briefly on first load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      id="floating-robot-chat-container"
      className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end gap-2 select-none"
    >
      {/* Speech Bubble / Tooltip Greeting */}
      {showTooltip && (
        <div 
          className="bg-slate-900 text-white rounded-2xl p-3 shadow-2xl border border-emerald-500/40 text-xs max-w-[220px] animate-in fade-in slide-in-from-bottom-2 duration-300 relative group cursor-pointer"
          onClick={onClick}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
            }}
            className="absolute -top-2 -right-2 w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full flex items-center justify-center text-[10px] border border-slate-600 shadow-xs"
            title="Tutup pesan"
          >
            <X className="w-3 h-3" />
          </button>
          
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px] mb-1">
            <Sparkles className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>{waConfig.botName || 'Robot Tanya Stok'}</span>
          </div>
          <p className="text-[11px] text-slate-200 leading-snug">
            Butuh cek saldo obat & barang cepat di pulau? <span className="text-emerald-300 font-bold underline decoration-emerald-500">Tanya saya di sini!</span>
          </p>
          
          {/* Arrow Pointer to Button */}
          <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-slate-900 border-r border-b border-emerald-500/40 transform rotate-45"></div>
        </div>
      )}

      {/* Floating Robot Action Button */}
      <button
        id="btn-floating-robot-chat"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative group p-1 focus:outline-none transition-transform active:scale-95 cursor-pointer"
        aria-label="Buka Robot Chat Cek Stok"
        title="Tanya Stok ke Robot Chatbot"
      >
        {/* Ambient Glow Pulse Effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 blur-md opacity-70 group-hover:opacity-100 transition-opacity animate-pulse"></div>

        {/* Robot Circular Emblem / Body */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 border-2 border-emerald-300/80 shadow-2xl flex items-center justify-center text-white overflow-hidden transform group-hover:scale-105 transition-all duration-300">
          
          {/* Robot Visual Illustration (Stylized 3D-Look Robot SVG) */}
          <svg 
            viewBox="0 0 64 64" 
            className="w-10 h-10 sm:w-11 sm:h-11 drop-shadow-md transform group-hover:-translate-y-0.5 transition-transform"
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Antena */}
            <circle cx="32" cy="11" r="3" fill="#34d399" stroke="#064e3b" strokeWidth="1" />
            <line x1="32" y1="14" x2="32" y2="19" stroke="#a7f3d0" strokeWidth="2.5" strokeLinecap="round" />

            {/* Kepala Robot */}
            <rect x="15" y="19" width="34" height="25" rx="8" fill="#f8fafc" stroke="#0f766e" strokeWidth="1.5" />
            
            {/* Telinga / Headset Robot */}
            <rect x="11" y="26" width="4" height="11" rx="2" fill="#0d9488" />
            <rect x="49" y="26" width="4" height="11" rx="2" fill="#0d9488" />

            {/* Visor Layar Robot */}
            <rect x="19" y="24" width="26" height="13" rx="5" fill="#0f172a" stroke="#10b981" strokeWidth="1" />
            
            {/* Mata Robot (Glow Blue-Cyan / Emerald) */}
            <circle cx="26" cy="30.5" r="3" fill="#22d3ee" className="animate-pulse" />
            <circle cx="38" cy="30.5" r="3" fill="#22d3ee" className="animate-pulse" />
            
            {/* Senyum LED Robot */}
            <path d="M29 34 Q32 36.5 35 34" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" />

            {/* Leher & Badan Atas */}
            <rect x="28" y="44" width="8" height="4" fill="#64748b" />
            <path d="M20 48 Q32 46 44 48 L46 56 L18 56 Z" fill="#0f766e" />
            
            {/* Lambang Plus Medis di Dada Robot */}
            <path d="M32 49 L32 54 M29.5 51.5 L34.5 51.5" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
          </svg>

          {/* Small WhatsApp / Chat Badge Overlay */}
          <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border border-white shadow-xs">
            <MessageSquare className="w-2.5 h-2.5 text-white" />
          </div>
        </div>

        {/* Live Green Pulsing Indicator */}
        <span className="absolute top-1 right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-900"></span>
        </span>

        {/* Hover Pill Label */}
        {isHovered && !showTooltip && (
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap border border-emerald-500/30 flex items-center gap-1.5 animate-in fade-in slide-in-from-right-1 duration-150">
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
            <span>Chatbot Cek Stok</span>
          </div>
        )}
      </button>
    </div>
  );
};
