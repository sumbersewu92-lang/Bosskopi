import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  Download,
  FileCheck2,
  Coins,
  PieChart,
  Calendar,
  Clock3,
  CheckCircle2,
  X,
  AlertTriangle
} from 'lucide-react';
import { CoffeePurchase, WarehouseSale } from '../types/coffee';
import {
  STORE_NAME,
  formatRupiah,
  formatSignedRupiah,
  formatPaymentMethodLabel,
  formatNumber,
  formatSignedKg,
  formatDateTimeIndo,
  formatDateIndo,
  toLocalDateInput
} from '../data/initialData';
import { captureScrollState, blurActiveTrigger } from '../utils/scrollPreservation';
import {
  ExportFormat,
  buildFinancialStatement,
  exportFinancialStatementPDF,
  exportFinancialStatementCSV
} from '../utils/financialReportExport';

interface TabFinancialReportProps {
  purchases: CoffeePurchase[];
  sales: WarehouseSale[];
  onViewInvoice: (sale: WarehouseSale) => void;
  onMarkAsPaid?: (saleId: string) => void;
}

type TimeframeFilter = 'today' | 'week' | 'month' | 'all';

export const TabFinancialReport: React.FC<TabFinancialReportProps> = ({
  purchases,
  sales,
  onViewInvoice,
  onMarkAsPaid
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('all');

  // Export Report Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<string>(() => toLocalDateInput(new Date()));
  const [exportEndDate, setExportEndDate] = useState<string>(() => toLocalDateInput(new Date()));
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [exportError, setExportError] = useState<string>('');

  const isDateInTimeframe = (dateStr: string, filter: TimeframeFilter): boolean => {
    if (filter === 'all') return true;

    const itemDate = new Date(dateStr);
    const now = new Date();

    const itemDay = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate()).getTime();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    if (filter === 'today') {
      return itemDay === today;
    }
    if (filter === 'week') {
      const oneWeekAgo = today - 7 * 24 * 60 * 60 * 1000;
      return itemDay >= oneWeekAgo && itemDay <= today;
    }
    if (filter === 'month') {
      return (
        itemDate.getFullYear() === now.getFullYear() &&
        itemDate.getMonth() === now.getMonth()
      );
    }
    return true;
  };

  const filteredSales = useMemo(() => {
    return sales.filter((s) => isDateInTimeframe(s.date, timeframe));
  }, [sales, timeframe]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => isDateInTimeframe(p.date, timeframe));
  }, [purchases, timeframe]);

  const totalRevenue = useMemo(
    () => filteredSales.reduce((acc, s) => acc + s.totalRevenue, 0),
    [filteredSales]
  );

  const totalCost = useMemo(
    () => filteredSales.reduce((acc, s) => acc + s.estimatedCost, 0),
    [filteredSales]
  );

  const totalNetProfit = useMemo(
    () => filteredSales.reduce((acc, s) => acc + s.netProfit, 0),
    [filteredSales]
  );

  const overallMarginPercent = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;

  const totalCapitalSpentOnPurchases = useMemo(
    () => filteredPurchases.reduce((acc, p) => acc + p.totalPayment, 0),
    [filteredPurchases]
  );

  const totalDispatchedKg = useMemo(
    () => Math.round(filteredSales.reduce((acc, s) => acc + (s.dispatchedWeightKg || 0), 0) * 100) / 100,
    [filteredSales]
  );

  const totalWarehouseKg = useMemo(
    () => Math.round(filteredSales.reduce((acc, s) => acc + (s.warehouseWeightKg || 0), 0) * 100) / 100,
    [filteredSales]
  );

  const totalVarianceKg = useMemo(
    () => Math.round(filteredSales.reduce((acc, s) => acc + (s.weightVarianceKg || 0), 0) * 100) / 100,
    [filteredSales]
  );

  const totalVarianceAmount = useMemo(
    () =>
      Math.round(
        filteredSales.reduce(
          (acc, s) => acc + (s.weightVarianceKg || 0) * (s.sellPricePerKg || 0),
          0
        )
      ),
    [filteredSales]
  );

  const totalReceivables = useMemo(
    () =>
      filteredSales
        .filter((s) => s.paymentStatus === 'BELUM_LUNAS')
        .reduce((acc, s) => acc + s.totalRevenue, 0),
    [filteredSales]
  );

  const unpaidCount = useMemo(
    () => filteredSales.filter((s) => s.paymentStatus === 'BELUM_LUNAS').length,
    [filteredSales]
  );

  const totalPaidRevenue = useMemo(
    () =>
      filteredSales
        .filter((s) => s.paymentStatus === 'LUNAS')
        .reduce((acc, s) => acc + s.totalRevenue, 0),
    [filteredSales]
  );

  const totalPaidNetProfit = useMemo(
    () =>
      filteredSales
        .filter((s) => s.paymentStatus === 'LUNAS')
        .reduce((acc, s) => acc + s.netProfit, 0),
    [filteredSales]
  );

  const handleOpenExportModal = () => {
    const now = new Date();
    const todayStr = toLocalDateInput(now);
    let defaultStart = todayStr;

    if (timeframe === 'today') {
      defaultStart = todayStr;
    } else if (timeframe === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      defaultStart = toLocalDateInput(weekAgo);
    } else if (timeframe === 'month') {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      defaultStart = toLocalDateInput(firstOfMonth);
    } else {
      const allDates = [...purchases.map((p) => p.date), ...sales.map((s) => s.date)]
        .map((ds) => new Date(ds).getTime())
        .filter((t) => Number.isFinite(t));

      if (allDates.length > 0) {
        defaultStart = toLocalDateInput(new Date(Math.min(...allDates)));
      } else {
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        defaultStart = toLocalDateInput(firstOfMonth);
      }
    }

    setExportStartDate(defaultStart);
    setExportEndDate(todayStr);
    setExportError('');
    setIsExportModalOpen(true);
  };

  const exportPreviewSummary = useMemo(() => {
    if (!isExportModalOpen || !exportStartDate || !exportEndDate || exportStartDate > exportEndDate) {
      return null;
    }
    return buildFinancialStatement({
      startDate: exportStartDate,
      endDate: exportEndDate,
      purchases,
      sales
    });
  }, [isExportModalOpen, exportStartDate, exportEndDate, purchases, sales]);

  const handleDownloadReport = (e: React.FormEvent) => {
    e.preventDefault();
    setExportError('');

    if (!exportStartDate || !exportEndDate) {
      setExportError('Pilih rentang tanggal mulai dan tanggal akhir terlebih dahulu.');
      return;
    }
    if (exportStartDate > exportEndDate) {
      setExportError('Tanggal mulai ("Dari Tanggal") tidak boleh melebihi tanggal akhir ("Sampai Tanggal").');
      return;
    }

    const summary = buildFinancialStatement({
      startDate: exportStartDate,
      endDate: exportEndDate,
      purchases,
      sales
    });

    if (exportFormat === 'pdf') {
      exportFinancialStatementPDF(summary);
    } else {
      exportFinancialStatementCSV(summary);
    }

    const restore = captureScrollState();
    blurActiveTrigger();
    setIsExportModalOpen(false);
    restore();
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#5C3A21] text-xs font-bold uppercase tracking-wider mb-1">
            <PieChart className="w-3.5 h-3.5 shrink-0 text-[#B45309]" />
            <span>Rekapitulasi Keuangan &amp; Laba Rugi</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-stone-900 tracking-tight">
            Laporan Keuangan Penjualan Gudang Pusat
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Analisis modal pembelian petani &amp; putus harga, omset pengiriman gudang pusat, selisih timbang (+/-), dan laba bersih.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto shrink-0">
          <div className="grid grid-cols-2 sm:inline-flex items-center p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs font-medium gap-1 sm:gap-0">
            <button
              type="button"
              onClick={() => setTimeframe('today')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                timeframe === 'today'
                  ? 'bg-[#432818] text-white font-semibold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('week')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                timeframe === 'week'
                  ? 'bg-[#432818] text-white font-semibold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Minggu Ini
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                timeframe === 'month'
                  ? 'bg-[#432818] text-white font-semibold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                timeframe === 'all'
                  ? 'bg-[#432818] text-white font-semibold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Semua Waktu
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenExportModal}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#432818] hover:bg-[#331D11] text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer whitespace-nowrap shrink-0"
            title="Unduh mutasi laporan keuangan (PDF / CSV)"
          >
            <Download className="w-3.5 h-3.5 shrink-0 text-amber-300" />
            <span>Unduh Laporan</span>
          </button>
        </div>
      </div>

      {/* Bagian 1: Rekapitulasi Arus Modal, Omset & Selisih Timbang */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-6 shadow-xs space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-2">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#5C3A21] shrink-0" />
              <span>Rekapitulasi Arus Modal vs Pendapatan Penjualan</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Periode:{' '}
              <strong className="text-stone-700">
                {timeframe === 'today'
                  ? 'Hari Ini'
                  : timeframe === 'week'
                  ? '7 Hari Terakhir'
                  : timeframe === 'month'
                  ? 'Bulan Berjalan'
                  : 'Keseluruhan Data'}
              </strong>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500">
            <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span>{filteredSales.length} pengiriman gudang</span>
            <span aria-hidden="true">·</span>
            <span>{filteredPurchases.length} pembelian / putus harga</span>
          </div>
        </div>

        <div className="space-y-3.5">
          {/* Row 1: 4 Arus Kas Utama */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
              <span className="text-xs font-semibold text-stone-500 block mb-1">
                Modal Keluar (Petani)
              </span>
              <span className="text-base sm:text-lg font-extrabold text-stone-900 font-mono tabular-nums block">
                {formatRupiah(totalCapitalSpentOnPurchases)}
              </span>
              <span className="text-[10px] text-stone-400 mt-1 block">
                {filteredPurchases.length} nota beli &amp; putus harga
              </span>
            </div>

            <div className="bg-[#FAF3E8] rounded-xl p-4 border border-amber-200/90">
              <span className="text-xs font-semibold text-[#5C3A21] block mb-1">
                Total Omset Penjualan
              </span>
              <span className="text-base sm:text-lg font-extrabold text-[#2D180C] font-mono tabular-nums block">
                {formatRupiah(totalRevenue)}
              </span>
              <span className="text-[10px] text-[#5C3A21] font-medium mt-1 block">
                Timbang Gudang: {formatNumber(totalWarehouseKg)} kg
              </span>
            </div>

            <div className="bg-amber-50 rounded-xl p-4 border border-amber-300">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-amber-900">Piutang Belum Cair</span>
                <span className="text-[9px] font-bold bg-amber-200 text-amber-900 px-1 py-0.2 rounded font-mono">
                  {unpaidCount} inv
                </span>
              </div>
              <span className="text-base sm:text-lg font-extrabold text-amber-950 font-mono tabular-nums block">
                {formatRupiah(totalReceivables)}
              </span>
              <span className="text-[10px] text-amber-800 mt-1 block">
                Transfer susulan gudang
              </span>
            </div>

            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
              <span className="text-xs font-semibold text-stone-600 block mb-1">
                Kas Masuk (Lunas)
              </span>
              <span className="text-base sm:text-lg font-extrabold text-emerald-700 font-mono tabular-nums block">
                {formatRupiah(totalPaidRevenue)}
              </span>
              <span className="text-[10px] text-stone-400 mt-1 block">
                Dana efektif di rekening
              </span>
            </div>
          </div>

          {/* Row 2: Volume Timbang, Selisih Timbang (+/-) & Laba Bersih */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
              <span className="text-xs font-bold text-stone-700 block mb-1">
                Volume Keluar vs Timbang Gudang
              </span>
              <span className="text-base sm:text-lg font-extrabold text-stone-900 font-mono tabular-nums block">
                {formatNumber(totalDispatchedKg)} → {formatNumber(totalWarehouseKg)} kg
              </span>
              <span className="text-[10px] text-stone-500 mt-1 block">
                Perbandingan berat berangkat &amp; timbang terima gudang
              </span>
            </div>

            <div
              className={`rounded-xl p-4 border ${
                totalVarianceKg > 0
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : totalVarianceKg < 0
                  ? 'bg-rose-50/70 border-rose-200'
                  : 'bg-stone-50 border-stone-200'
              }`}
            >
              <span
                className={`text-xs font-bold block mb-1 ${
                  totalVarianceKg > 0
                    ? 'text-emerald-900'
                    : totalVarianceKg < 0
                    ? 'text-rose-900'
                    : 'text-stone-700'
                }`}
              >
                Net Selisih Timbang Gudang (+/-)
              </span>
              <span
                className={`text-base sm:text-lg font-extrabold font-mono tabular-nums block ${
                  totalVarianceKg > 0
                    ? 'text-emerald-700'
                    : totalVarianceKg < 0
                    ? 'text-rose-600'
                    : 'text-stone-700'
                }`}
              >
                {formatSignedRupiah(totalVarianceAmount)}{' '}
                <span className="text-xs sm:text-sm font-bold">
                  ({formatSignedKg(totalVarianceKg)})
                </span>
              </span>
              <span className="text-[10px] text-stone-500 mt-1 block">
                {totalVarianceKg > 0
                  ? 'Tambahan nilai omset dari timbang lebih di gudang pusat'
                  : totalVarianceKg < 0
                  ? 'Pengurangan nilai omset akibat susut berat di gudang'
                  : 'Timbang gudang tepat sama dengan berat kirim'}
              </span>
            </div>

            <div className="sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-[#432818] via-[#5C3A21] to-[#2D180C] text-white rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-amber-200">Laba Bersih Terwujud</span>
                <span className="text-[10px] font-bold bg-amber-400 text-[#2D180C] px-1.5 py-0.2 rounded font-mono">
                  {overallMarginPercent.toFixed(1)}%
                </span>
              </div>
              <span
                className={`text-base sm:text-lg font-extrabold font-mono tabular-nums block ${
                  totalNetProfit >= 0 ? 'text-amber-300' : 'text-rose-300'
                }`}
              >
                {formatSignedRupiah(totalNetProfit)}
              </span>
              <span className="text-[10px] text-amber-100/90 mt-1 block truncate">
                Sudah Cair: {formatRupiah(totalPaidNetProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar: Modal Pokok vs Laba Bersih */}
        {totalRevenue > 0 && (
          <div className="p-3.5 sm:p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs text-stone-600">
              <span className="font-semibold text-stone-800">
                Komposisi Omset: Modal Pokok Terjual vs Laba Bersih:
              </span>
              <span className="font-mono text-stone-500 text-[11px] sm:text-xs">
                Modal {((totalCost / totalRevenue) * 100).toFixed(1)}% · Margin Laba{' '}
                {overallMarginPercent.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${Math.min(100, Math.max(0, (totalCost / totalRevenue) * 100))}%` }}
                className="bg-[#5C3A21] transition-all duration-500"
                title={`Modal Pokok Terjual: ${formatRupiah(totalCost)}`}
              />
              {totalNetProfit > 0 && (
                <div
                  style={{ width: `${Math.min(100, Math.max(0, (totalNetProfit / totalRevenue) * 100))}%` }}
                  className="bg-emerald-600 transition-all duration-500"
                  title={`Laba Bersih Terwujud: ${formatRupiah(totalNetProfit)}`}
                />
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5C3A21] inline-block shrink-0" />
                <span>Modal Pokok Terjual ({formatRupiah(totalCost)})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block shrink-0" />
                <span className={`font-semibold ${totalNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  Laba Bersih ({formatSignedRupiah(totalNetProfit)})
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bagian 2: Tabel Riwayat Laba Bersih per Pengiriman */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-6 shadow-xs space-y-4 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#5C3A21] shrink-0" />
              <span>Riwayat Laba Bersih per Pengiriman Gudang Pusat</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Rincian omset hasil timbang gudang, modal stok keluar, selisih timbang (+/-), dan margin bersih
            </p>
          </div>
          <div className="text-xs text-stone-500 font-mono shrink-0">
            {filteredSales.length} Pengiriman Selesai
          </div>
        </div>

        {filteredSales.length === 0 ? (
          <div className="text-center py-12 px-4 bg-stone-50 rounded-xl border border-dashed border-stone-200">
            <div className="w-10 h-10 rounded-full bg-stone-200 text-stone-400 flex items-center justify-center mx-auto mb-2.5">
              <Calendar className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-stone-700">
              Tidak ada transaksi pengiriman pada rentang waktu ini
            </p>
            <p className="text-xs text-stone-400 mt-1">
              Ubah filter rentang waktu ke "Semua Waktu" atau catat pengiriman baru di tab "Stok &amp; Pengiriman".
            </p>
            <button
              type="button"
              onClick={() => setTimeframe('all')}
              className="mt-3 px-3 py-1.5 text-xs font-semibold bg-[#432818] text-white rounded-lg hover:bg-[#331D11] transition cursor-pointer"
            >
              Tampilkan Semua Waktu
            </button>
          </div>
        ) : (
          <>
            {/* Mobile & Tablet Cards (< lg) */}
            <div className="lg:hidden space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredSales.map((sale) => {
                  const isUnpaid = sale.paymentStatus === 'BELUM_LUNAS';
                  const variance = sale.weightVarianceKg || 0;

                  return (
                    <div
                      key={sale.id}
                      className={`p-3.5 rounded-xl border space-y-2.5 ${
                        isUnpaid ? 'bg-amber-50/40 border-amber-200' : 'bg-stone-50/60 border-stone-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-mono font-semibold text-[#5C3A21] block text-[11px]">
                            {sale.invoiceNumber}
                          </span>
                          <span className="font-bold text-stone-900 block text-sm truncate">
                            {sale.buyerWarehouseName}
                          </span>
                          <span className="text-[10px] text-stone-400 block">
                            {formatDateTimeIndo(sale.date)}
                          </span>
                        </div>
                        <div className="shrink-0">
                          {isUnpaid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                              <Clock3 className="w-3 h-3 text-amber-700 shrink-0" />
                              <span>Piutang</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
                              <span>Lunas</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-white border border-stone-200/80 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-stone-600">
                          {formatNumber(sale.dispatchedWeightKg)} kg → {formatNumber(sale.warehouseWeightKg)} kg
                        </span>
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded ${
                            variance > 0
                              ? 'bg-emerald-50 text-emerald-700'
                              : variance < 0
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {formatSignedKg(variance)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200/70 text-xs">
                        <div>
                          <span className="text-[10px] text-stone-400 block">Pendapatan</span>
                          <strong className="font-mono text-stone-900 tabular-nums">
                            {formatRupiah(sale.totalRevenue)}
                          </strong>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-stone-400 block">
                            Laba ({sale.profitMarginPercent.toFixed(1)}%)
                          </span>
                          <strong
                            className={`font-mono tabular-nums ${
                              sale.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {formatSignedRupiah(sale.netProfit)}
                          </strong>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-stone-200/70 flex flex-wrap items-center justify-between gap-2">
                        <div className="text-[10px] text-stone-500">
                          {isUnpaid && sale.dueDate ? (
                            <span className="text-amber-800 font-mono">Tempo: {formatDateIndo(sale.dueDate)}</span>
                          ) : (
                            <span>{formatPaymentMethodLabel(sale.paymentStatus, sale.paymentMethod)}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 ml-auto">
                          {isUnpaid && onMarkAsPaid && (
                            <button
                              type="button"
                              onClick={() => onMarkAsPaid(sale.id)}
                              className="px-2.5 py-1 text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Tandai Lunas</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onViewInvoice(sale)}
                            className="p-1.5 text-stone-600 hover:text-[#432818] bg-white border border-stone-200 rounded-lg transition cursor-pointer"
                            title="Lihat Dokumen Surat Jalan"
                          >
                            <FileCheck2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-stone-500 block">Timbang Gudang</span>
                  <strong className="font-mono text-stone-900 tabular-nums">
                    {formatNumber(totalWarehouseKg)} kg
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Total Omset</span>
                  <strong className="font-mono text-stone-900 tabular-nums">
                    {formatRupiah(totalRevenue)}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-amber-800 block">Piutang</span>
                  <strong className="font-mono text-amber-900 tabular-nums">
                    {formatRupiah(totalReceivables)}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-700 block">Laba Bersih</span>
                  <strong
                    className={`font-mono tabular-nums ${
                      totalNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {formatSignedRupiah(totalNetProfit)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Desktop Table (>= lg) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider bg-stone-50/70">
                    <th className="py-2.5 px-3">Tanggal &amp; Surat Jalan</th>
                    <th className="py-2.5 px-3">Gudang Tujuan</th>
                    <th className="py-2.5 px-3 text-right">Keluar → Gudang (+/-)</th>
                    <th className="py-2.5 px-3 text-right">Pendapatan</th>
                    <th className="py-2.5 px-3 text-right">Laba Bersih</th>
                    <th className="py-2.5 px-3 text-center">Status Pembayaran</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs text-stone-700 font-sans">
                  {filteredSales.map((sale) => {
                    const isUnpaid = sale.paymentStatus === 'BELUM_LUNAS';
                    const variance = sale.weightVarianceKg || 0;

                    return (
                      <tr
                        key={sale.id}
                        className={`transition ${
                          isUnpaid ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-stone-50/80'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <span className="font-mono font-semibold text-[#5C3A21] block text-[11px]">
                            {sale.invoiceNumber}
                          </span>
                          <span className="text-[10px] text-stone-400 block">
                            {formatDateTimeIndo(sale.date)}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-stone-900 block text-xs">
                            {sale.buyerWarehouseName}
                          </span>
                          <span className="text-[10.5px] text-stone-500">{sale.coffeeType}</span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                          <div className="font-semibold text-stone-800">
                            {formatNumber(sale.dispatchedWeightKg)} kg → {formatNumber(sale.warehouseWeightKg)} kg
                          </div>
                          <span
                            className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                              variance > 0
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : variance < 0
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {formatSignedKg(variance)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-stone-900 tabular-nums whitespace-nowrap">
                          {formatRupiah(sale.totalRevenue)}
                          <span className="text-[10px] text-stone-400 block font-normal">
                            @{formatRupiah(sale.sellPricePerKg)}/kg
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <span
                            className={`font-mono font-bold block tabular-nums text-sm ${
                              sale.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {formatSignedRupiah(sale.netProfit)}
                          </span>
                          <span
                            className={`text-[10px] font-semibold font-mono tabular-nums ${
                              sale.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            ({sale.profitMarginPercent.toFixed(1)}%)
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isUnpaid ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                                <Clock3 className="w-3 h-3 text-amber-700 shrink-0" />
                                <span>Belum Lunas (Piutang)</span>
                              </span>
                              {sale.dueDate && (
                                <span className="text-[9px] text-amber-800 mt-0.5 block font-mono">
                                  Tempo: {formatDateIndo(sale.dueDate)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                                <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
                                <span>Lunas</span>
                              </span>
                              <span className="text-[9px] text-emerald-700 mt-0.5 block">
                                {formatPaymentMethodLabel(sale.paymentStatus, sale.paymentMethod)}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {isUnpaid && onMarkAsPaid && (
                              <button
                                type="button"
                                onClick={() => onMarkAsPaid(sale.id)}
                                className="px-2 py-0.5 text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded transition shadow-xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                title="Tandai Pembayaran Lunas"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Tandai Lunas</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onViewInvoice(sale)}
                              className="p-1.5 text-stone-500 hover:text-[#432818] hover:bg-amber-50 rounded-md transition cursor-pointer"
                              title="Lihat Dokumen Surat Jalan"
                            >
                              <FileCheck2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-stone-300 font-bold text-xs bg-stone-50 text-stone-900">
                    <td colSpan={2} className="py-3 px-3">
                      TOTAL PERIODE INI
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                      {formatNumber(totalDispatchedKg)} → {formatNumber(totalWarehouseKg)} kg ({formatSignedKg(totalVarianceKg)})
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-stone-900">
                      {formatRupiah(totalRevenue)}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-mono tabular-nums text-sm ${
                        totalNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {formatSignedRupiah(totalNetProfit)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono tabular-nums text-[11px] text-amber-800">
                      Piutang: {formatRupiah(totalReceivables)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-[10px] text-emerald-700 font-semibold">Valid</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}

        <div className="pt-2 text-xs text-stone-500 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100">
          <span>
            * Modal pokok dihitung berdasarkan harga rata-rata stok aktif saat pengiriman keluar lapak; omset dihitung dari hasil timbang gudang pusat.
          </span>
          <span className="text-[#5C3A21] font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Laporan Keuangan Terverifikasi
          </span>
        </div>
      </div>

      {/* Modal Unduh Laporan Mutasi Keuangan (PDF / CSV) */}
      {isExportModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => {
            const restore = captureScrollState();
            blurActiveTrigger();
            setIsExportModalOpen(false);
            restore();
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-export-financial-title"
          >
            {/* Header Modal */}
            <div className="flex-shrink-0 px-5 py-4 border-b border-stone-200 bg-[#432818] text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#5C3A21] border border-amber-400/30 text-amber-300 flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 id="modal-export-financial-title" className="text-sm sm:text-base font-bold truncate">
                    Unduh Laporan Mutasi Keuangan
                  </h3>
                  <p className="text-[11px] text-amber-200 truncate">
                    Format Rekening Koran &amp; Arus Kas {STORE_NAME}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const restore = captureScrollState();
                  blurActiveTrigger();
                  setIsExportModalOpen(false);
                  restore();
                }}
                className="p-1.5 text-amber-200 hover:text-white hover:bg-[#5C3A21] rounded-lg transition cursor-pointer shrink-0"
                aria-label="Tutup modal unduh laporan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDownloadReport} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
                {exportError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{exportError}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block font-bold text-stone-800">
                    Filter Rentang Tanggal Mutasi <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="export-start-date" className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Dari Tanggal
                      </label>
                      <input
                        id="export-start-date"
                        type="date"
                        required
                        value={exportStartDate}
                        onChange={(e) => {
                          setExportStartDate(e.target.value);
                          setExportError('');
                        }}
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-stone-300 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[#5C3A21]"
                      />
                    </div>
                    <div>
                      <label htmlFor="export-end-date" className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Sampai Tanggal
                      </label>
                      <input
                        id="export-end-date"
                        type="date"
                        required
                        value={exportEndDate}
                        onChange={(e) => {
                          setExportEndDate(e.target.value);
                          setExportError('');
                        }}
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-stone-300 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[#5C3A21]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="export-file-format" className="block font-bold text-stone-800 mb-1">
                    Pilihan Format File <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="export-file-format"
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-stone-300 rounded-lg font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#5C3A21]"
                  >
                    <option value="pdf">Unduh PDF (.pdf — Rekening Koran Resmi)</option>
                    <option value="csv">Unduh CSV (.csv — Spreadsheet / Excel)</option>
                  </select>
                  <span className="text-[10.5px] text-stone-500 block mt-1">
                    Dokumen disusun kronologis menyerupai mutasi rekening bank dengan kolom Debet, Kredit, dan Saldo Kas Berjalan.
                  </span>
                </div>

                {exportPreviewSummary && (
                  <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-200/80">
                      <span className="text-[11px] font-bold text-stone-800">
                        Pratinjau Ringkasan Mutasi
                      </span>
                      <span className="text-[11px] font-mono text-stone-600 tabular-nums">
                        {formatDateIndo(exportPreviewSummary.startDate)} – {formatDateIndo(exportPreviewSummary.endDate)} ·{' '}
                        <strong>{exportPreviewSummary.rows.length}</strong> mutasi
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div className="p-2.5 bg-white border border-stone-200 rounded-lg">
                        <span className="text-[10px] text-stone-500 block">Modal Keluar (Debet)</span>
                        <strong className="font-mono text-rose-700 tabular-nums">
                          {formatRupiah(exportPreviewSummary.totalModalKeluar)}
                        </strong>
                      </div>
                      <div className="p-2.5 bg-white border border-stone-200 rounded-lg">
                        <span className="text-[10px] text-stone-500 block">Kas Masuk Lunas (Kredit)</span>
                        <strong className="font-mono text-emerald-700 tabular-nums">
                          {formatRupiah(exportPreviewSummary.totalKasMasukLunas)}
                        </strong>
                      </div>
                      <div className="p-2.5 bg-white border border-stone-200 rounded-lg">
                        <span className="text-[10px] text-stone-500 block">Piutang Belum Cair</span>
                        <strong className="font-mono text-amber-800 tabular-nums">
                          {formatRupiah(exportPreviewSummary.totalPiutangGudang)}
                        </strong>
                      </div>
                      <div className="p-2.5 bg-white border border-stone-200 rounded-lg">
                        <span className="text-[10px] text-stone-500 block">Laba Bersih Terwujud</span>
                        <strong
                          className={`font-mono tabular-nums ${
                            exportPreviewSummary.labaBersihTerwujud >= 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {formatSignedRupiah(exportPreviewSummary.labaBersihTerwujud)}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 px-5 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const restore = captureScrollState();
                    blurActiveTrigger();
                    setIsExportModalOpen(false);
                    restore();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#432818] hover:bg-[#331D11] rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-300" />
                  <span>{exportFormat === 'pdf' ? 'Unduh PDF' : 'Unduh CSV'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
