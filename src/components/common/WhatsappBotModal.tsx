import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Sparkles, RefreshCw, MessageSquare } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { WhatsappBotService } from '../../services/whatsappBotService';
import { BotChatMessage } from '../../types';

interface WhatsappBotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsappBotModal: React.FC<WhatsappBotModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<BotChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const waConfig = storageService.getWhatsappConfig();

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome-0',
          sender: 'BOT',
          text: `👋 Halo! Saya *${waConfig.botName || 'SiGudang Bot'}*, robot asisten otomatis untuk cek jumlah stok barang di Puskesmas Kepulauan Seribu Selatan.\n\nKetik nama obat/barang (misal: *paracetamol*, *kertas hvs*, *masker*) atau tanyakan *stok kritis* untuk melihat barang yang menipis.`,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [isOpen, waConfig.botName, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    const userMsg: BotChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'USER',
      text: text,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const res = WhatsappBotService.processStockQuery(text);
      const botMsg: BotChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'BOT',
        text: res.message,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 400);
  };

  const handleReset = () => {
    setMessages([
      {
        id: `bot-${Date.now()}`,
        sender: 'BOT',
        text: `Percakapan telah direset. Silakan tanyakan stok barang.`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-800 flex flex-col h-[580px] overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-800 px-4 py-3 text-white flex items-center justify-between border-b border-emerald-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white border border-white/30 relative">
              <Bot className="w-5 h-5 text-white" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute bottom-0 right-0 border-2 border-emerald-800"></span>
            </div>
            <div>
              <div className="font-bold text-sm leading-tight flex items-center gap-1.5">
                {waConfig.botName || 'Robot Tanya Stok Barang'}
                <span className="px-1.5 py-0.2 bg-emerald-900/60 text-[10px] rounded font-mono">WhatsApp Bot</span>
              </div>
              <div className="text-[11px] text-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping"></span>
                Online • Siap Cek Saldo Seluruh Pulau
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleReset}
              className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-700 rounded-lg transition-colors"
              title="Reset Chat"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-700 rounded-lg transition-colors"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Suggestion Pills */}
        <div className="bg-slate-950/90 px-3 py-2 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-400 flex-shrink-0 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Cepat:
          </span>
          <button
            onClick={() => handleSend('cek paracetamol')}
            className="px-2.5 py-0.5 bg-slate-800 hover:bg-emerald-900 hover:text-emerald-300 text-slate-200 rounded-full whitespace-nowrap border border-slate-700 transition-colors"
          >
            💊 Paracetamol
          </button>
          <button
            onClick={() => handleSend('stok kritis')}
            className="px-2.5 py-0.5 bg-slate-800 hover:bg-amber-900 hover:text-amber-300 text-slate-200 rounded-full whitespace-nowrap border border-slate-700 transition-colors"
          >
            ⚠️ Stok Kritis
          </button>
          <button
            onClick={() => handleSend('stok tidung')}
            className="px-2.5 py-0.5 bg-slate-800 hover:bg-teal-900 hover:text-teal-300 text-slate-200 rounded-full whitespace-nowrap border border-slate-700 transition-colors"
          >
            🏝️ Tidung
          </button>
          <button
            onClick={() => handleSend('stok pari')}
            className="px-2.5 py-0.5 bg-slate-800 hover:bg-teal-900 hover:text-teal-300 text-slate-200 rounded-full whitespace-nowrap border border-slate-700 transition-colors"
          >
            🏖️ Pari
          </button>
          <button
            onClick={() => handleSend('bantuan')}
            className="px-2.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full whitespace-nowrap border border-slate-700 transition-colors"
          >
            ❓ Bantuan
          </button>
        </div>

        {/* Messages Body */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0b141a] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]"
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'USER';
            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md space-y-1 ${
                    isUser
                      ? 'bg-[#005c4b] text-emerald-50 rounded-tr-none'
                      : 'bg-[#202c33] text-slate-200 rounded-tl-none border border-slate-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.text.split('\n').map((line, lIdx) => (
                      <div key={lIdx} className="min-h-[1rem]">
                        {line.split(/(\*[^*]+\*|`[^`]+`)/g).map((part, pIdx) => {
                          if (part.startsWith('*') && part.endsWith('*')) {
                            return <strong key={pIdx} className="font-extrabold text-white">{part.slice(1, -1)}</strong>;
                          }
                          if (part.startsWith('`') && part.endsWith('`')) {
                            return <code key={pIdx} className="bg-black/30 px-1 py-0.5 rounded text-emerald-300 font-mono text-[11px]">{part.slice(1, -1)}</code>;
                          }
                          return <span key={pIdx}>{part}</span>;
                        })}
                      </div>
                    ))}
                  </div>
                  <div className={`text-[10px] text-right ${isUser ? 'text-emerald-200' : 'text-slate-400'} flex items-center justify-end gap-1`}>
                    <span>{msg.timestamp}</span>
                    {isUser && <span className="text-emerald-300 font-bold">✓✓</span>}
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-[#202c33] text-slate-400 rounded-2xl rounded-tl-none px-4 py-2 text-xs flex items-center gap-1.5 border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-[11px] ml-1 text-slate-300">Robot mengecek database...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="bg-[#202c33] p-3 border-t border-slate-800">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanya stok, misal: cek amoxicillin / stok kritis..."
              className="flex-1 bg-[#2a3942] text-white text-xs px-4 py-2.5 rounded-full placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#008f6f] disabled:bg-slate-700 text-white flex items-center justify-center transition-colors flex-shrink-0 shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
