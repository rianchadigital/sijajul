import { storageService } from './storageService';
import { WhatsappConfig, BotQueryResponse, Item, Warehouse, WarehouseStock } from '../types';

export class WhatsappBotService {
  /**
   * Process natural language query from WhatsApp / Chat to check inventory stock
   */
  static processStockQuery(query: string, _userWarehouseId?: string): BotQueryResponse {
    const raw = (query || '').trim();
    const q = raw.toLowerCase();

    const items: Item[] = storageService.getItems() || [];
    const warehouses: Warehouse[] = storageService.getWarehouses() || [];
    const stocks: WarehouseStock[] = storageService.getStocks() || [];

    // 1. HELP / GREETING INTENT
    if (
      q === 'help' || 
      q === 'bantuan' || 
      q === 'menu' || 
      q === 'halo' || 
      q === 'hi' || 
      q === 'start' ||
      q === 'info' ||
      q === '?' ||
      q === ''
    ) {
      const helpMsg = 
        `🤖 *ROBOT CEK STOK SI JAJUL PUSKESMAS KSS*\n` +
        `_Layanan Otomatis Jaga Stok & Jalur Logistik Kepulauan Seribu Selatan_\n\n` +
        `Silakan ketik perintah pengecekan:\n` +
        `🔹 *cek [nama barang]*\n` +
        `   Contoh: \`cek paracetamol\`, \`cek kertas hvs\`, \`cek spuit\`\n` +
        `🔹 *stok kritis* / *stok menipis*\n` +
        `   Melihat daftar barang yang berada di bawah stok minimum\n` +
        `🔹 *stok [nama pulau/gudang]*\n` +
        `   Contoh: \`stok tidung\`, \`stok pari\`, \`stok lancang\`, \`stok payung\`, \`stok gudang besar\`\n` +
        `🔹 *semua barang* / *kategori*\n` +
        `   Melihat ringkasan katalog persediaan\n\n` +
        `💡 _Ketik nama barang langsung untuk cek saldo instan._`;

      return {
        intent: 'HELP',
        message: helpMsg
      };
    }

    // 2. LOW STOCK INTENT
    if (
      q.includes('kritis') || 
      q.includes('menipis') || 
      q.includes('habis') || 
      q.includes('low stock') ||
      q === 'cek kritis' ||
      q === 'stok limit'
    ) {
      const lowStockItems: { item: Item; totalSaldo: number; gudangKritis: string[] }[] = [];

      items.forEach(itm => {
        const itemStocks = stocks.filter(s => s.barangId === itm.id);
        const totalSaldo = itemStocks.reduce((sum, s) => sum + s.saldo, 0);
        const gudangKritisList: string[] = [];

        itemStocks.forEach(stk => {
          if (stk.saldo <= itm.stokMinimum) {
            const wh = warehouses.find(w => w.id === stk.gudangId);
            gudangKritisList.push(`${wh?.namaGudang.replace('Gudang ', '') || 'Gudang'}: *${stk.saldo} ${itm.satuan}*`);
          }
        });

        if (gudangKritisList.length > 0 || totalSaldo <= itm.stokMinimum) {
          lowStockItems.push({
            item: itm,
            totalSaldo,
            gudangKritis: gudangKritisList
          });
        }
      });

      if (lowStockItems.length === 0) {
        return {
          intent: 'LOW_STOCK',
          message: `✅ *STATUS STOK AMAN*\nTidak ada barang dengan status kritis/di bawah batas minimum saat ini.`
        };
      }

      let msg = `⚠️ *PERINGATAN STOK MENIPIS / KRITIS (${lowStockItems.length} Barang)*\n`;
      msg += `_Puskesmas Kepulauan Seribu Selatan_\n\n`;

      lowStockItems.slice(0, 10).forEach((obj, idx) => {
        msg += `${idx + 1}. *${obj.item.namaBarang}* [${obj.item.kodeBarang}]\n`;
        msg += `   • Min. Batas: ${obj.item.stokMinimum} ${obj.item.satuan}\n`;
        msg += `   • Posisi Stok:\n     - ${obj.gudangKritis.join('\n     - ')}\n\n`;
      });

      if (lowStockItems.length > 10) {
        msg += `_...dan ${lowStockItems.length - 10} barang lainnya. Buka SI-GUDANG web untuk rincian lengkap._`;
      }

      return {
        intent: 'LOW_STOCK',
        message: msg.trim()
      };
    }

    // 3. WAREHOUSE SPECIFIC INTENT (e.g. "stok tidung", "gudang pari", "pulau payung")
    const matchedWarehouse = warehouses.find(w => {
      const whName = w.namaGudang.toLowerCase();
      const loc = (w.lokasi || '').toLowerCase();
      const code = w.kodeGudang.toLowerCase();
      return (
        (q.includes('tidung') && (whName.includes('tidung') || loc.includes('tidung'))) ||
        (q.includes('pari') && (whName.includes('pari') || loc.includes('pari'))) ||
        (q.includes('lancang') && (whName.includes('lancang') || loc.includes('lancang'))) ||
        (q.includes('payung') && (whName.includes('payung') || loc.includes('payung'))) ||
        (q.includes('besar') && (whName.includes('besar') || code.includes('gb')))
      );
    });

    if (matchedWarehouse && (q.startsWith('stok') || q.startsWith('gudang') || q.includes('di') || q.includes('sub'))) {
      const whStocks = stocks.filter(s => s.gudangId === matchedWarehouse.id);
      const totalItems = whStocks.length;
      const totalQty = whStocks.reduce((sum, s) => sum + s.saldo, 0);

      let msg = `🏥 *INFORMASI STOK ${matchedWarehouse.namaGudang.toUpperCase()}*\n`;
      msg += `📍 Lokasi: ${matchedWarehouse.lokasi || 'Kepulauan Seribu'}\n`;
      msg += `👤 PIC: ${matchedWarehouse.picNama || '-'}\n`;
      msg += `📦 Total Jenis Barang: ${totalItems} item (${totalQty} total unit)\n\n`;
      msg += `*Daftar Stok Terkini:*\n`;

      whStocks.slice(0, 12).forEach((s, idx) => {
        const itm = items.find(i => i.id === s.barangId);
        if (itm) {
          const isLow = s.saldo <= itm.stokMinimum;
          const statusIcon = isLow ? '⚠️' : '✅';
          msg += `${idx + 1}. ${statusIcon} *${itm.namaBarang}*: ${s.saldo} ${itm.satuan} ${isLow ? `_(Min: ${itm.stokMinimum})_` : ''}\n`;
        }
      });

      if (whStocks.length > 12) {
        msg += `\n_...dan ${whStocks.length - 12} barang lainnya._`;
      }

      return {
        intent: 'WAREHOUSE_STOCK',
        message: msg
      };
    }

    // 4. ITEM SEARCH (Direct or "cek [nama]", "stok [nama]", "cari [nama]")
    let cleanQuery = q
      .replace(/^cek\s+/i, '')
      .replace(/^stok\s+/i, '')
      .replace(/^cari\s+/i, '')
      .replace(/^info\s+/i, '')
      .replace(/^jumlah\s+/i, '')
      .replace(/^ada\s+/i, '')
      .replace(/^apakah\s+ada\s+/i, '')
      .trim();

    if (cleanQuery.length < 2) {
      cleanQuery = q;
    }

    const matchedItems = items.filter(itm => {
      return (
        itm.namaBarang.toLowerCase().includes(cleanQuery) ||
        itm.kodeBarang.toLowerCase().includes(cleanQuery) ||
        itm.merk.toLowerCase().includes(cleanQuery) ||
        itm.kategoriNama.toLowerCase().includes(cleanQuery)
      );
    });

    if (matchedItems.length === 0) {
      return {
        intent: 'UNKNOWN',
        message: 
          `❌ *BARANG TIDAK DITEMUKAN*\n` +
          `Pencarian untuk: _"${raw}"_ tidak cocok dengan katalog barang SI-GUDANG.\n\n` +
          `💡 *Saran Pencarian:*\n` +
          `• Coba gunakan kata kunci umum (contoh: \`paracetamol\`, \`kertas\`, \`masker\`, \`spuit\`, \`sabun\`)\n` +
          `• Ketik *bantuan* untuk panduan format.`
      };
    }

    // Format found items
    const detailedList = matchedItems.slice(0, 5).map(itm => {
      const itemStocks = warehouses.map(wh => {
        const stk = stocks.find(s => s.gudangId === wh.id && s.barangId === itm.id);
        const saldo = stk ? stk.saldo : 0;
        let status: 'AMAN' | 'KRITIS' | 'HABIS' = 'AMAN';
        if (saldo === 0) status = 'HABIS';
        else if (saldo <= itm.stokMinimum) status = 'KRITIS';

        return {
          gudangId: wh.id,
          namaGudang: wh.namaGudang,
          saldo,
          stokMinimum: itm.stokMinimum,
          status
        };
      });

      const totalStok = itemStocks.reduce((sum, s) => sum + s.saldo, 0);

      return {
        barangId: itm.id,
        kodeBarang: itm.kodeBarang,
        namaBarang: itm.namaBarang,
        satuan: itm.satuan,
        stocks: itemStocks,
        totalStok
      };
    });

    let msg = `📦 *HASIL PENGECEKAN STOK BARANG (${matchedItems.length} Ditemukan)*\n`;
    msg += `_SI JAJUL Puskesmas Kepulauan Seribu Selatan_\n\n`;

    detailedList.forEach((itmDetail, idx) => {
      msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `*${idx + 1}. ${itmDetail.namaBarang.toUpperCase()}*\n`;
      msg += `🏷️ Kode: \`${itmDetail.kodeBarang}\` | Satuan: *${itmDetail.satuan}*\n`;
      msg += `📊 *Total Saldo Seluruh Gudang: ${itmDetail.totalStok} ${itmDetail.satuan}*\n\n`;
      msg += `*Rincian Per Gudang / Pulau:*\n`;

      itmDetail.stocks.forEach(stk => {
        const icon = stk.saldo === 0 ? '🔴' : (stk.status === 'KRITIS' ? '🟡' : '🟢');
        const shortName = stk.namaGudang
          .replace('Gudang Puskesmas Kepulauan Seribu Selatan', 'Gudang Besar (Pusat)')
          .replace('Gudang Puskesmas ', 'Gdg. ')
          .replace('Gudang Pustu ', 'Pustu ')
          .replace('Gudang Pusling ', 'Pusling ');

        msg += `${icon} ${shortName}: *${stk.saldo} ${itmDetail.satuan}*\n`;
      });
      msg += `\n`;
    });

    if (matchedItems.length > 5) {
      msg += `_Menampilkan 5 dari total ${matchedItems.length} barang yang cocok._\n`;
    }

    msg += `💡 _Data diperbarui secara real-time dari database SI JAJUL._`;

    return {
      intent: 'STOCK_CHECK',
      message: msg.trim(),
      matchedItems: detailedList
    };
  }

  /**
   * Send WhatsApp message via configured gateway (Fonnte, Wablas, UltraMsg, or Custom Webhook)
   */
  static async sendWhatsappMessage(
    targetNumber: string, 
    message: string, 
    customConfig?: WhatsappConfig
  ): Promise<{ success: boolean; message: string; responseData?: any }> {
    const config = customConfig || storageService.getWhatsappConfig();

    if (!targetNumber) {
      return { success: false, message: 'Nomor tujuan WhatsApp belum diisi' };
    }

    const cleanTarget = targetNumber.replace(/[^0-9]/g, '');

    // 1. If no API Key configured, simulate successful dispatch in dev mode
    if (!config.apiKey || config.apiKey.trim() === '') {
      console.log(`[WA BOT SIMULATION] To: ${cleanTarget}\nMessage:\n${message}`);
      return {
        success: true,
        message: `[MODE SIMULASI] Pesan berhasil dikirim ke WhatsApp ${cleanTarget}. (Isi API Token di Pengaturan untuk pengiriman sungguhan via Gateway).`
      };
    }

    try {
      let response: Response;

      // 2. Fonnte API Provider
      if (config.provider === 'FONNTE') {
        const endpoint = config.apiUrl || 'https://api.fonnte.com/send';
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': config.apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            target: cleanTarget,
            message: message,
            countryCode: '62'
          })
        });
      } 
      // 3. Wablas API Provider
      else if (config.provider === 'WABLAS') {
        const endpoint = config.apiUrl || 'https://kudus.wablas.com/api/send-message';
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': config.apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone: cleanTarget,
            message: message
          })
        });
      }
      // 4. UltraMsg API Provider
      else if (config.provider === 'ULTRAMSG') {
        const endpoint = config.apiUrl || 'https://api.ultramsg.com/instance/messages/chat';
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            token: config.apiKey,
            to: cleanTarget,
            body: message
          })
        });
      }
      // 5. Generic Webhook / Custom Gateway
      else {
        const endpoint = config.apiUrl;
        if (!endpoint) {
          throw new Error('URL Endpoint Webhook belum diisi');
        }
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {})
          },
          body: JSON.stringify({
            to: cleanTarget,
            target: cleanTarget,
            phone: cleanTarget,
            message: message,
            timestamp: new Date().toISOString()
          })
        });
      }

      if (!response.ok) {
        const errText = await response.text();
        return {
          success: false,
          message: `Gateway WhatsApp merespons error (${response.status}): ${errText.slice(0, 100)}`
        };
      }

      const resData = await response.json().catch(() => ({ status: 'ok' }));
      return {
        success: true,
        message: 'Pesan berhasil terkirim melalui WhatsApp Gateway!',
        responseData: resData
      };
    } catch (err: any) {
      console.warn('WA Gateway error, fallback simulator:', err);
      return {
        success: false,
        message: `Gagal mengirim WA: ${err.message || 'Koneksi gateway terputus'}`
      };
    }
  }

  /**
   * Broadcast low stock alert to configured PIC WhatsApp
   */
  static async broadcastLowStockAlert(customConfig?: WhatsappConfig): Promise<{ success: boolean; message: string; count: number }> {
    const config = customConfig || storageService.getWhatsappConfig();
    const target = config.targetNumber || '081234567890';

    const lowStockQuery = this.processStockQuery('stok kritis');
    const res = await this.sendWhatsappMessage(target, lowStockQuery.message, config);

    return {
      success: res.success,
      message: res.message,
      count: lowStockQuery.matchedItems?.length || 0
    };
  }
}
