import React from 'react';
import { Scale, Wallet, TrendingUp, Sparkles, Clock3, CheckCircle2, Archive } from 'lucide-react';
import { formatRupiah, formatSignedRupiah, formatNumber, formatSignedKg } from '../data/initialData';

interface StatCardsProps {
  activeTab: 'purchases' | 'deposits' | 'stock-and-sales' | 'financial-report';
  totalStockKg: number;
  depositActiveKg?: number;
  depositActiveCount?: number;
  totalCapitalSpent: number;
  totalRealizedRevenue: number;
  totalRealizedProfit: number;
  totalVarianceKg?: number;
  totalReceivables: number;
  unpaidCount: number;
  totalPaidRevenue: number;
}

export const StatCards: React.FC<StatCardsProps> = ({
  activeTab,
  totalStockKg,
  depositActiveKg = 0,
  depositActiveCount = 0,
  totalCapitalSpent,
  totalRealizedRevenue,
  totalRealizedProfit,
  totalVarianceKg = 0,
  totalReceivables,
  unpaidCount,
  totalPaidRevenue
}) => {
  if (activeTab === 'purchases' || activeTab === 'deposits') {
    return null;
  }

  return (
    <div
      key={activeTab}
      className={
        activeTab === 'stock-and-sales'
          ? 'grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3 transition-all duration-300 animate-in fade-in zoom-in-95'
          : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 transition-all duration-300 animate-in fade-in zoom-in-95'
      }
    >
      {/* TAB: STOK & PENGIRIMAN */}
      {activeTab === 'stock-and-sales' && (
        <>
          {/* Card 1: Stok Kopi Siap Kirim (+ Info Titipan Terpisah) */}
          <div className="bg-white rounded-xl border border-stone-200 py-2.5 px-3 sm:px-3.5 shadow-2xs flex flex-col justify-between hover:border-amber-300 transition-colors">
            <div>
              <div className="flex items-center justify-between text-stone-500 mb-0.5">
                <span className="text-[11px] font-semibold text-stone-600 truncate">Stok Kopi Siap Kirim</span>
                <div className="w-6 h-6 rounded-md bg-amber-50 text-[#5C3A21] flex items-center justify-center shrink-0">
                  <Scale className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1 my-0.5">
                <span className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight font-mono tabular-nums leading-none">
                  {formatNumber(totalStockKg)}
                </span>
                <span className="text-[11px] font-bold text-[#5C3A21] leading-none">kg</span>
              </div>
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-stone-100 flex items-center justify-between gap-2 text-[10.5px] text-stone-500">
              <span className="inline-flex items-center gap-1 truncate">
                <Archive className="w-3 h-3 text-amber-700 shrink-0" />
                <span>Titipan Terpisah ({depositActiveCount})</span>
              </span>
              <span className="font-semibold text-amber-800 font-mono tabular-nums shrink-0">
                {formatNumber(depositActiveKg)} kg
              </span>
            </div>
          </div>

          {/* Card 2: Total Piutang Gudang (Menunggu Transfer) */}
          <div className="bg-amber-50/90 rounded-xl border border-amber-300/90 py-2.5 px-3 sm:px-3.5 shadow-2xs flex flex-col justify-between hover:border-amber-400 transition-colors">
            <div>
              <div className="flex items-center justify-between text-amber-800 mb-0.5">
                <span className="text-[11px] font-bold text-amber-900 truncate">Total Piutang Gudang</span>
                <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                  <Clock3 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline my-0.5">
                <span className="text-lg sm:text-xl font-extrabold text-amber-950 tracking-tight font-mono tabular-nums leading-none">
                  {formatRupiah(totalReceivables)}
                </span>
              </div>
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-amber-200/80 flex items-center justify-between text-[10.5px] text-amber-900">
              <span>Menunggu Transfer</span>
              <span className="font-bold font-mono tabular-nums bg-amber-200/90 px-1.5 py-0.2 rounded text-[10px]">
                {unpaidCount} faktur
              </span>
            </div>
          </div>

          {/* Card 3: Total Penjualan Gudang Pusat */}
          <div className="bg-white rounded-xl border border-stone-200 py-2.5 px-3 sm:px-3.5 shadow-2xs flex flex-col justify-between hover:border-stone-300 transition-colors">
            <div>
              <div className="flex items-center justify-between text-stone-500 mb-0.5">
                <span className="text-[11px] font-semibold text-stone-600 truncate">Penjualan Gudang Pusat</span>
                <div className="w-6 h-6 rounded-md bg-stone-100 text-[#432818] flex items-center justify-center shrink-0">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline my-0.5">
                <span className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight font-mono tabular-nums leading-none">
                  {formatRupiah(totalRealizedRevenue)}
                </span>
              </div>
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-stone-100 flex items-center justify-between text-[10.5px] text-stone-500">
              <span>Kas Masuk Lunas</span>
              <span className="font-semibold text-emerald-700 font-mono tabular-nums">
                {formatRupiah(totalPaidRevenue)}
              </span>
            </div>
          </div>
        </>
      )}

      {/* TAB: LAPORAN KEUANGAN */}
      {activeTab === 'financial-report' && (
        <>
          {/* Card 1: Total Modal Keluar */}
          <div className="bg-white rounded-xl border border-stone-200 py-2.5 px-3 sm:px-3.5 shadow-2xs flex flex-col justify-between hover:border-stone-300 transition-colors">
            <div>
              <div className="flex items-center justify-between text-stone-500 mb-0.5">
                <span className="text-[11px] font-semibold text-stone-600 truncate">Total Modal Keluar</span>
                <div className="w-6 h-6 rounded-md bg-stone-100 text-[#432818] flex items-center justify-center shrink-0">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline my-0.5">
                <span className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight font-mono tabular-nums leading-none">
                  {formatRupiah(totalCapitalSpent)}
                </span>
              </div>
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-stone-100 flex items-center justify-between text-[10.5px] text-stone-500">
              <span>Pembelian &amp; Putus Harga</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Tunai Lunas</span>
              </span>
            </div>
          </div>

          {/* Card 2: Total Omset Penjualan */}
          <div className="bg-white rounded-xl border border-stone-200 py-2.5 px-3 sm:px-3.5 shadow-2xs flex flex-col justify-between hover:border-stone-300 transition-colors">
            <div>
              <div className="flex items-center justify-between text-stone-500 mb-0.5">
                <span className="text-[11px] font-semibold text-stone-600 truncate">Total Omset Penjualan</span>
                <div className="w-6 h-6 rounded-md bg-amber-50 text-[#5C3A21] flex items-center justify-center shrink-0">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline my-0.5">
                <span className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight font-mono tabular-nums leading-none">
                  {formatRupiah(totalRealizedRevenue)}
                </span>
              </div>
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-stone-100 flex items-center justify-between text-[10.5px] text-stone-500">
              <span>Kas Masuk Lunas</span>
              <span className="font-semibold text-emerald-700 font-mono tabular-nums">
                {formatRupiah(totalPaidRevenue)}
              </span>
            </div>
          </div>

          {/* Card 3: Total Piutang Gudang */}
          <div className="bg-amber-50/90 rounded-xl border border-amber-300/90 py-2.5 px-3 sm:px-3.5 shadow-2xs flex flex-col justify-between hover:border-amber-400 transition-colors">
            <div>
              <div className="flex items-center justify-between text-amber-800 mb-0.5">
                <span className="text-[11px] font-bold text-amber-900 truncate">Total Piutang Gudang</span>
                <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                  <Clock3 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline my-0.5">
                <span className="text-lg sm:text-xl font-extrabold text-amber-950 tracking-tight font-mono tabular-nums leading-none">
                  {formatRupiah(totalReceivables)}
                </span>
              </div>
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-amber-200/80 flex items-center justify-between text-[10.5px] text-amber-900">
              <span>Dana Belum Cair</span>
              <span className="font-bold font-mono tabular-nums bg-amber-200/90 px-1.5 py-0.2 rounded text-[10px]">
                {unpaidCount} faktur
              </span>
            </div>
          </div>

          {/* Card 4: Laba Bersih Terwujud */}
          <div className="bg-gradient-to-br from-[#432818] via-[#5C3A21] to-[#2D180C] text-white rounded-xl py-2.5 px-3 sm:px-3.5 shadow-2xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between text-amber-200 mb-0.5">
                <span className="text-[11px] font-semibold truncate">
                  Laba Bersih Terwujud
                </span>
                <div className="w-6 h-6 rounded-md bg-white/10 text-amber-300 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline my-0.5">
                <span
                  className={`text-lg sm:text-xl font-extrabold tracking-tight font-mono tabular-nums leading-none ${
                    totalRealizedProfit >= 0 ? 'text-amber-300' : 'text-rose-300'
                  }`}
                >
                  {formatSignedRupiah(totalRealizedProfit)}
                </span>
              </div>
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-white/15 flex items-center justify-between gap-2 text-[10.5px] text-amber-100/90">
              <span className="truncate">Net Selisih Timbang</span>
              <span
                className={`font-semibold font-mono tabular-nums shrink-0 ${
                  totalVarianceKg > 0
                    ? 'text-emerald-300'
                    : totalVarianceKg < 0
                    ? 'text-rose-300'
                    : 'text-white'
                }`}
              >
                {formatSignedKg(totalVarianceKg)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
