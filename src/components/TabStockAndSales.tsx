import React, { useState, useEffect } from 'react';
import {
  Building2,
  Package,
  Trash2,
  AlertTriangle,
  FileCheck2,
  Sparkles,
  CheckCircle2,
  Clock3,
  Calendar,
  ArrowRight,
  X,
  AlertCircle,
  Phone,
  Scale,
  Droplets,
  Archive,
  Truck
} from 'lucide-react';
import { CoffeeStockSummary, WarehouseSale } from '../types/coffee';
import {
  COFFEE_TYPE,
  formatRupiah,
  formatSignedRupiah,
  formatPaymentMethodLabel,
  formatNumber,
  formatPercent,
  formatSignedKg,
  formatDateTimeIndo,
  formatDateIndo,
  toLocalDateInput
} from '../data/initialData';
import { captureScrollState, blurActiveTrigger } from '../utils/scrollPreservation';
import {
  capitalizeEachWord,
  handleCapitalizedInputChange
} from '../utils/textFormat';

interface TabStockAndSalesProps {
  stockSummary: CoffeeStockSummary;
  sales: WarehouseSale[];
  onAddSale: (sale: Omit<WarehouseSale, 'id' | 'invoiceNumber'>) => void;
  onViewInvoice: (sale: WarehouseSale) => void;
  onMarkAsPaid: (saleId: string) => void;
  onDeleteSale: (saleId: string) => void;
  onGoToDeposits?: () => void;
}

export const TabStockAndSales: React.FC<TabStockAndSalesProps> = ({
  stockSummary,
  sales,
  onAddSale,
  onViewInvoice,
  onMarkAsPaid,
  onDeleteSale,
  onGoToDeposits
}) => {
  // Dispatch & Warehouse Weight Form State
  const [dispatchedWeightInput, setDispatchedWeightInput] = useState<string>('');
  const [warehouseWeightInput, setWarehouseWeightInput] = useState<string>('');
  const [sellPriceInput, setSellPriceInput] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [weightCapNotice, setWeightCapNotice] = useState<string>('');

  // Checkout Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [buyerWarehouseName, setBuyerWarehouseName] = useState<string>('');
  const [buyerWhatsApp, setBuyerWhatsApp] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'LUNAS' | 'BELUM_LUNAS'>('BELUM_LUNAS');
  const [paymentMethod, setPaymentMethod] = useState<'Transfer Bank' | 'Tunai Langsung' | 'Transfer Susulan (Piutang)'>('Transfer Susulan (Piutang)');
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return toLocalDateInput(d);
  });
  const [modalErrorMsg, setModalErrorMsg] = useState<string>('');
  const [isSubmittingSale, setIsSubmittingSale] = useState<boolean>(false);

  // Delete Sale Confirmation Modal
  const [saleToDelete, setSaleToDelete] = useState<WarehouseSale | null>(null);

  const parseWeight = (raw: string): number => {
    const normalized = raw.trim().replace(',', '.');
    const parsed = parseFloat(normalized);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.round(parsed * 100) / 100;
  };

  const maxStockKg = Math.max(0, Math.round((stockSummary.stockKg || 0) * 100) / 100);
  const numDispatchedKg = parseWeight(dispatchedWeightInput);
  const numWarehouseKg = parseWeight(warehouseWeightInput);
  const numSellPrice = parseInt(sellPriceInput, 10) || 0;
  const isOverStock = numDispatchedKg > maxStockKg;

  useEffect(() => {
    if (!dispatchedWeightInput) return;
    if (maxStockKg <= 0) {
      setDispatchedWeightInput('');
      setWeightCapNotice('Berat keluar tidak boleh melebihi total stok siap kirim');
    } else if (numDispatchedKg > maxStockKg) {
      setDispatchedWeightInput(String(maxStockKg));
      setWeightCapNotice('Berat keluar tidak boleh melebihi total stok siap kirim');
    }
  }, [maxStockKg, numDispatchedKg, dispatchedWeightInput]);

  const handleDispatchedWeightChange = (rawVal: string) => {
    setFormError('');
    if (rawVal === '') {
      setDispatchedWeightInput('');
      setWeightCapNotice('');
      return;
    }

    if (maxStockKg <= 0) {
      setDispatchedWeightInput('');
      setWeightCapNotice('Berat keluar tidak boleh melebihi total stok siap kirim');
      return;
    }

    const normalized = rawVal.trim().replace(',', '.');
    const parsed = parseFloat(normalized);

    if (Number.isFinite(parsed) && parsed < 0) {
      setDispatchedWeightInput('');
      setWeightCapNotice('');
      return;
    }

    if (Number.isFinite(parsed) && parsed > maxStockKg) {
      setDispatchedWeightInput(String(maxStockKg));
      setWeightCapNotice('Berat keluar tidak boleh melebihi total stok siap kirim');
      return;
    }

    setDispatchedWeightInput(rawVal);
    setWeightCapNotice('');
  };

  const weightVarianceKg =
    numDispatchedKg > 0 && numWarehouseKg > 0
      ? Math.round((numWarehouseKg - numDispatchedKg) * 100) / 100
      : 0;

  const costPricePerKg = Math.round(stockSummary.avgBuyPricePerKg || 0);
  const totalRevenue = Math.round(numWarehouseKg * numSellPrice);
  const estimatedCost = Math.round(numDispatchedKg * costPricePerKg);
  const netProfit = totalRevenue - estimatedCost;
  const profitMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const handleSellPriceChange = (rawVal: string) => {
    const digits = rawVal.replace(/\D/g, '');
    if (!digits) {
      setSellPriceInput('');
    } else {
      setSellPriceInput(String(parseInt(digits, 10)));
    }
    setFormError('');
  };

  const handleSetAllStock = () => {
    if (stockSummary.stockKg <= 0) return;
    const val = String(stockSummary.stockKg);
    setDispatchedWeightInput(val);
    if (!warehouseWeightInput) {
      setWarehouseWeightInput(val);
    }
    setWeightCapNotice('');
    setFormError('');
  };

  const handleProceedToCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (stockSummary.stockKg <= 0) {
      setFormError('Stok kopi siap kirim saat ini masih kosong (0 kg).');
      return;
    }
    if (numDispatchedKg < 0.01) {
      setFormError('Masukkan berat keluar dari stok lapak minimal 0,01 kg.');
      return;
    }
    if (numDispatchedKg > stockSummary.stockKg) {
      setFormError('Berat keluar tidak boleh melebihi total stok siap kirim');
      return;
    }
    if (numWarehouseKg < 0.01) {
      setFormError('Masukkan berat hasil timbang di gudang pusat minimal 0,01 kg.');
      return;
    }
    if (numSellPrice <= 0) {
      setFormError('Masukkan harga jual gudang pusat per kg (> Rp. 0).');
      return;
    }

    setModalErrorMsg('');
    setIsCheckoutModalOpen(true);
  };

  const handleSetQuickDueDate = (daysOffset: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);
    setDueDate(toLocalDateInput(target));
  };

  const handleConfirmAndSaveSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingSale) return;
    setModalErrorMsg('');

    if (numDispatchedKg < 0.01 || numDispatchedKg > stockSummary.stockKg) {
      setModalErrorMsg(
        `Stok siap kirim berubah dan kini tersisa ${formatNumber(stockSummary.stockKg)} kg. Sesuaikan berat keluar terlebih dahulu.`
      );
      return;
    }
    if (numWarehouseKg < 0.01 || numSellPrice <= 0) {
      setModalErrorMsg('Periksa kembali berat hasil timbang gudang pusat dan harga jual per kg.');
      return;
    }

    setIsSubmittingSale(true);
    try {
      const restore = captureScrollState();
      const finalBuyerName = buyerWarehouseName.trim() || 'Gudang Pusat Kopi';
      const trimmedWA = buyerWhatsApp.trim() || undefined;

      onAddSale({
        buyerWarehouseName: finalBuyerName,
        buyerWhatsApp: trimmedWA,
        buyerPhone: trimmedWA,
        coffeeType: COFFEE_TYPE,
        dispatchedWeightKg: numDispatchedKg,
        warehouseWeightKg: numWarehouseKg,
        weightVarianceKg,
        costPricePerKg,
        sellPricePerKg: numSellPrice,
        totalRevenue,
        estimatedCost,
        netProfit,
        profitMarginPercent,
        date: new Date().toISOString(),
        notes: undefined,
        paymentStatus,
        paymentMethod: paymentStatus === 'LUNAS' ? paymentMethod : 'Transfer Susulan (Piutang)',
        dueDate: paymentStatus === 'BELUM_LUNAS' && dueDate ? dueDate : undefined,
        paidAt: paymentStatus === 'LUNAS' ? new Date().toISOString() : undefined
      });

      blurActiveTrigger();
      setDispatchedWeightInput('');
      setWarehouseWeightInput('');
      setSellPriceInput('');
      setBuyerWarehouseName('');
      setBuyerWhatsApp('');
      setWeightCapNotice('');
      setIsCheckoutModalOpen(false);
      restore();
    } finally {
      setIsSubmittingSale(false);
    }
  };

  const handleConfirmPaid = (sale: WarehouseSale) => {
    const restore = captureScrollState();
    onMarkAsPaid(sale.id);
    restore();
  };

  const totalReceivables = sales
    .filter((s) => s.paymentStatus === 'BELUM_LUNAS')
    .reduce((acc, s) => acc + s.totalRevenue, 0);

  const totalPaidRevenue = sales
    .filter((s) => s.paymentStatus === 'LUNAS')
    .reduce((acc, s) => acc + s.totalRevenue, 0);

  const totalAllRevenue = sales.reduce((acc, s) => acc + s.totalRevenue, 0);
  const totalAllProfit = sales.reduce((acc, s) => acc + s.netProfit, 0);
  const totalNetVarianceKg = Math.round(sales.reduce((acc, s) => acc + (s.weightVarianceKg || 0), 0) * 100) / 100;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#5C3A21] text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#B45309]" />
            <span>Stok Tunggal &amp; Pengiriman Gudang Pusat</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-stone-900 tracking-tight">
            Stok Kopi Bijian &amp; Pengiriman ke Gudang Pusat
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Seluruh pembelian &amp; hasil putus harga digabung menjadi 1 stok aktif. Catat berat keluar lapak vs timbang gudang pusat (+/-).
          </p>
        </div>
      </div>

      {/* 2-Column Main Grid: Left Stock Card (5 cols) + Right Dispatch Form (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Left: Kartu Stok Tunggal Kopi Bijian */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-stone-200 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#5C3A21] shrink-0" />
              <h3 className="text-sm sm:text-base font-bold text-stone-900">
                Stok Kopi Siap Kirim
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-[#5C3A21] bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              1 Jenis Stok
            </span>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-[#FAF3E8] via-[#FDFBF7] to-white border border-amber-200/90 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#B45309] block">
                  {stockSummary.coffeeType}
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#2D180C] tabular-nums">
                    {formatNumber(stockSummary.stockKg)}
                  </span>
                  <span className="text-sm font-bold text-[#5C3A21]">kg</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-500 block">Rata-Rata Kadar Air</span>
                <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-sky-900 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full mt-1">
                  <Droplets className="w-3 h-3 text-sky-600" />
                  {formatPercent(stockSummary.avgMoisturePercent)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-amber-200/70 text-xs">
              <div>
                <span className="text-[10px] text-stone-500 block">Modal Pokok Rata-Rata</span>
                <strong className="font-mono font-bold text-stone-900 text-sm tabular-nums">
                  {formatRupiah(stockSummary.avgBuyPricePerKg)}/kg
                </strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-500 block">Nilai Modal Stok Aktif</span>
                <strong className="font-mono font-bold text-[#432818] text-sm tabular-nums">
                  {formatRupiah(stockSummary.totalCostInvested)}
                </strong>
              </div>
            </div>
          </div>

          {/* Separated Deposit Info Box */}
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                <Archive className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
                <span>Titipan Petani (Terpisah)</span>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {stockSummary.depositActiveCount} petani belum putus harga · belum masuk stok jual
              </p>
            </div>
            <div className="text-right shrink-0">
              <strong className="font-mono font-bold text-amber-800 text-sm block tabular-nums">
                {formatNumber(stockSummary.depositActiveKg)} kg
              </strong>
              {onGoToDeposits && (
                <button
                  type="button"
                  onClick={onGoToDeposits}
                  className="text-[10.5px] font-semibold text-[#5C3A21] hover:underline cursor-pointer"
                >
                  Kelola Titipan →
                </button>
              )}
            </div>
          </div>

          <div className="pt-1 text-[11px] text-stone-500 flex items-center justify-between">
            <span>Total Akumulasi Pembelian Masuk</span>
            <strong className="font-mono text-stone-700 tabular-nums">
              {formatNumber(stockSummary.totalPurchasedKg)} kg
            </strong>
          </div>
        </div>

        {/* Right: Form Pengiriman & Selisih Timbang Gudang Pusat */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-stone-200 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#432818] text-amber-300 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-stone-900 leading-tight">
                  Pengiriman ke Gudang Pusat
                </h3>
                <p className="text-[11px] text-stone-500">
                  Isi berat keluar lapak, berat hasil timbang gudang pusat, dan harga jual
                </p>
              </div>
            </div>
          </div>

          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleProceedToCheckout} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Berat Keluar dari Stok Lapak */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="text-xs font-semibold text-stone-700">
                    Berat Keluar Lapak (kg) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    disabled={stockSummary.stockKg <= 0}
                    onClick={handleSetAllStock}
                    className="px-2 py-0.5 text-[10px] font-bold bg-[#432818] hover:bg-[#331D11] text-white rounded cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Semua Stok
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-stone-400">
                    <Scale className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    max={maxStockKg > 0 ? maxStockKg : 0}
                    disabled={maxStockKg <= 0}
                    value={dispatchedWeightInput}
                    onChange={(e) => handleDispatchedWeightChange(e.target.value)}
                    placeholder="Contoh: 1000"
                    className="w-full h-[38px] pl-8 pr-3 text-sm bg-stone-50 border border-stone-200 rounded-lg font-mono tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C3A21] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <span
                  role={weightCapNotice ? 'alert' : undefined}
                  aria-live="polite"
                  className={`block mt-1 text-[10.5px] leading-[14px] min-h-[28px] sm:min-h-0 ${
                    weightCapNotice ? 'text-rose-600 font-medium' : 'text-stone-400'
                  }`}
                >
                  {weightCapNotice || `Memotong stok siap kirim (maks. ${formatNumber(stockSummary.stockKg)} kg).`}
                </span>
              </div>

              {/* Berat Hasil Timbang Gudang Pusat */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Hasil Timbang Gudang Pusat (kg) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-stone-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    value={warehouseWeightInput}
                    onChange={(e) => {
                      setWarehouseWeightInput(e.target.value);
                      setFormError('');
                    }}
                    placeholder="Misal: 995 atau 1005"
                    className="w-full h-[38px] pl-8 pr-3 text-sm bg-stone-50 border border-stone-200 rounded-lg font-mono tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C3A21]"
                  />
                </div>
                <span className="text-[10.5px] leading-[14px] text-stone-400 block mt-1">
                  Bisa lebih sedikit (susut -) atau lebih banyak (+) dari berat kirim.
                </span>
              </div>
            </div>

            {/* Harga Jual per kg + Live Variance Indicator */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Harga Jual Gudang Pusat (per kg) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={sellPriceInput ? `Rp. ${Number(sellPriceInput).toLocaleString('id-ID')}` : ''}
                  onChange={(e) => handleSellPriceChange(e.target.value)}
                  placeholder="Rp. 0"
                  className="w-full h-[38px] px-3 text-sm bg-stone-50 border border-stone-200 rounded-lg font-mono tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C3A21]"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold text-stone-700 mb-1">
                  Selisih Timbang (+/-)
                </span>
                <div
                  className={`h-[38px] px-3 rounded-lg border flex items-center justify-between text-xs font-mono font-bold ${
                    weightVarianceKg > 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : weightVarianceKg < 0
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}
                >
                  <span>
                    {weightVarianceKg > 0
                      ? 'Timbang Lebih (+)'
                      : weightVarianceKg < 0
                      ? 'Susut Timbang (-)'
                      : 'Timbang Pas (0)'}
                  </span>
                  <span>{formatSignedKg(weightVarianceKg)}</span>
                </div>
              </div>
            </div>

            {/* Live Financial Summary */}
            <div className="p-3.5 rounded-xl bg-[#FAF3E8] border border-amber-200/90 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-600">Modal Stok Keluar ({formatNumber(numDispatchedKg)} kg):</span>
                <strong className="font-mono text-stone-800 tabular-nums">{formatRupiah(estimatedCost)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-600">Total Omset Gudang ({formatNumber(numWarehouseKg)} kg):</span>
                <strong className="font-mono font-bold text-[#432818] text-sm tabular-nums">
                  {formatRupiah(totalRevenue)}
                </strong>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-amber-200">
                <span className="font-bold text-[#2D180C]">Estimasi Laba Bersih ({profitMarginPercent.toFixed(1)}%):</span>
                <strong
                  className={`font-mono font-extrabold text-base tabular-nums ${
                    netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {formatSignedRupiah(netProfit)}
                </strong>
              </div>
            </div>

            <button
              type="submit"
              disabled={stockSummary.stockKg <= 0 || isOverStock}
              className="w-full py-3 px-4 bg-[#432818] hover:bg-[#331D11] text-white font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
            >
              <span>Lanjut ke Checkout Pengiriman</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </form>
        </div>
      </div>

      {/* Modal Checkout Pengiriman */}
      {isCheckoutModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => {
            if (isSubmittingSale) return;
            setIsCheckoutModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-checkout-sale-title"
          >
            <div className="flex-shrink-0 px-5 py-4 border-b border-stone-200 bg-[#FAF3E8] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#432818] text-amber-300 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="modal-checkout-sale-title" className="text-sm sm:text-base font-bold text-stone-900">
                    Checkout Surat Jalan Gudang Pusat
                  </h3>
                  <p className="text-[11px] text-[#5C3A21]">
                    Lengkapi tujuan gudang &amp; status pembayaran pengiriman
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSubmittingSale}
                onClick={() => setIsCheckoutModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAndSaveSale} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                {modalErrorMsg && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{modalErrorMsg}</span>
                  </div>
                )}

                <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Berat Keluar / Timbang Gudang:</span>
                    <strong className="font-mono text-stone-900">
                      {formatNumber(numDispatchedKg)} kg → {formatNumber(numWarehouseKg)} kg ({formatSignedKg(weightVarianceKg)})
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Total Tagihan Penjualan:</span>
                    <strong className="font-mono text-[#432818] text-sm">{formatRupiah(totalRevenue)}</strong>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Nama Gudang Pusat / Pembeli (Opsional)
                  </label>
                  <input
                    type="text"
                    autoCapitalize="words"
                    value={buyerWarehouseName}
                    onChange={(e) => handleCapitalizedInputChange(e, capitalizeEachWord, setBuyerWarehouseName)}
                    placeholder="Kosongkan untuk: Gudang Pusat Kopi"
                    className="w-full h-[38px] px-3 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C3A21]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    No. WhatsApp Gudang / Pembeli (Opsional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      value={buyerWhatsApp}
                      onChange={(e) => setBuyerWhatsApp(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full h-[38px] pl-9 pr-3 text-sm bg-stone-50 border border-stone-200 rounded-lg font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C3A21]"
                    />
                  </div>
                </div>

                <div>
                  <span className="block font-semibold text-stone-700 mb-1.5">Status Pembayaran</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentStatus('BELUM_LUNAS')}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        paymentStatus === 'BELUM_LUNAS'
                          ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500 text-amber-950'
                          : 'bg-stone-50 border-stone-200 text-stone-700'
                      }`}
                    >
                      <strong className="block text-xs">Piutang (Transfer Susulan)</strong>
                      <span className="text-[10px] text-stone-500">Dibayar setelah gudang verifikasi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentStatus('LUNAS');
                        if (paymentMethod === 'Transfer Susulan (Piutang)') {
                          setPaymentMethod('Transfer Bank');
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        paymentStatus === 'LUNAS'
                          ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 text-emerald-950'
                          : 'bg-stone-50 border-stone-200 text-stone-700'
                      }`}
                    >
                      <strong className="block text-xs">Sudah Lunas</strong>
                      <span className="text-[10px] text-stone-500">Pembayaran langsung cair</span>
                    </button>
                  </div>
                </div>

                {paymentStatus === 'LUNAS' ? (
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Metode Pembayaran</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as 'Transfer Bank' | 'Tunai Langsung')
                      }
                      className="w-full h-[38px] px-3 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C3A21]"
                    >
                      <option value="Transfer Bank">Transfer Bank</option>
                      <option value="Tunai Langsung">Tunai Langsung</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-stone-700 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-700" />
                        <span>Perkiraan Jatuh Tempo</span>
                      </label>
                      <div className="flex items-center gap-1">
                        {[3, 7, 14].map((days) => (
                          <button
                            key={days}
                            type="button"
                            onClick={() => handleSetQuickDueDate(days)}
                            className="px-1.5 py-0.5 text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded cursor-pointer font-semibold"
                          >
                            +{days}hr
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full h-[38px] px-3 text-sm bg-stone-50 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-[#5C3A21]"
                    />
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 px-5 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isSubmittingSale}
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSale}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#432818] hover:bg-[#331D11] rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>{isSubmittingSale ? 'Menyimpan...' : 'Simpan & Terbitkan Surat Jalan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Riwayat Pengiriman & Piutang Gudang Pusat */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-6 shadow-xs space-y-4 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#5C3A21] shrink-0" />
              <span>Riwayat Pengiriman &amp; Piutang Gudang Pusat</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Pantau berat keluar vs hasil timbang gudang (+/-), status piutang, dan laba bersih setiap pengiriman
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-lg text-stone-700 font-semibold">
              {sales.length} Surat Jalan
            </span>
            <span
              className={`px-2.5 py-1 rounded-lg border font-bold ${
                totalNetVarianceKg > 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : totalNetVarianceKg < 0
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-stone-50 border-stone-200 text-stone-700'
              }`}
            >
              Net Selisih: {formatSignedKg(totalNetVarianceKg)}
            </span>
          </div>
        </div>

        {sales.length === 0 ? (
          <div className="text-center py-12 px-4 bg-stone-50 rounded-xl border border-dashed border-stone-200">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-[#5C3A21] flex items-center justify-center mx-auto mb-3">
              <Truck className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-stone-700">Belum ada pengiriman ke gudang pusat</p>
            <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
              Catat pengiriman pertama pada formulir di atas setelah stok kopi bijian terkumpul.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Cards (< lg) */}
            <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3">
              {sales.map((sale) => {
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
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                            <Clock3 className="w-3 h-3" />
                            Piutang
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Lunas
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-white border border-stone-200/80 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-stone-600">
                        Keluar <strong>{formatNumber(sale.dispatchedWeightKg)} kg</strong> → Gudang{' '}
                        <strong>{formatNumber(sale.warehouseWeightKg)} kg</strong>
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
                        <span className="text-[10px] text-stone-400 block">Omset (@{formatRupiah(sale.sellPricePerKg)}/kg)</span>
                        <strong className="font-mono text-stone-900 tabular-nums">{formatRupiah(sale.totalRevenue)}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-stone-400 block">Laba ({sale.profitMarginPercent.toFixed(1)}%)</span>
                        <strong className={`font-mono tabular-nums ${sale.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
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
                        {isUnpaid && (
                          <button
                            type="button"
                            onClick={() => handleConfirmPaid(sale)}
                            className="px-2.5 py-1 text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Tandai Lunas</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onViewInvoice(sale)}
                          className="p-1.5 text-stone-600 hover:text-[#432818] bg-white border border-stone-200 rounded-lg transition cursor-pointer"
                          title="Lihat Surat Jalan"
                        >
                          <FileCheck2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSaleToDelete(sale)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 bg-white border border-stone-200 rounded-lg transition cursor-pointer"
                          title="Hapus Pengiriman"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (>= lg) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider bg-stone-50/80">
                    <th className="py-2.5 px-3">Surat Jalan &amp; Waktu</th>
                    <th className="py-2.5 px-3">Gudang Tujuan</th>
                    <th className="py-2.5 px-3 text-right">Timbang Lapak → Gudang (+/-)</th>
                    <th className="py-2.5 px-3 text-right">Omset Penjualan</th>
                    <th className="py-2.5 px-3 text-right">Laba Bersih</th>
                    <th className="py-2.5 px-3 text-center">Status Bayar</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
                  {sales.map((sale) => {
                    const isUnpaid = sale.paymentStatus === 'BELUM_LUNAS';
                    const variance = sale.weightVarianceKg || 0;

                    return (
                      <tr key={sale.id} className={`transition ${isUnpaid ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-stone-50/80'}`}>
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
                          <span className="text-[10.5px] text-stone-500">
                            {sale.coffeeType}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                          <div className="text-stone-800 font-semibold">
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
                            {variance > 0 ? 'Lebih ' : variance < 0 ? 'Susut ' : 'Pas '}
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
                          <span className={`font-mono font-bold block tabular-nums text-sm ${sale.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {formatSignedRupiah(sale.netProfit)}
                          </span>
                          <span className={`text-[10px] font-semibold font-mono tabular-nums ${sale.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                            ({sale.profitMarginPercent.toFixed(1)}%)
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isUnpaid ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                                <Clock3 className="w-3 h-3 text-amber-700 shrink-0" />
                                <span>Piutang</span>
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
                            {isUnpaid && (
                              <button
                                type="button"
                                onClick={() => handleConfirmPaid(sale)}
                                className="px-2 py-0.5 text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded transition shadow-xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                title="Tandai Pembayaran Lunas"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Lunas</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onViewInvoice(sale)}
                              className="p-1.5 text-stone-500 hover:text-[#432818] hover:bg-amber-50 rounded-md transition cursor-pointer"
                              title="Lihat Surat Jalan"
                            >
                              <FileCheck2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSaleToDelete(sale)}
                              className="p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded-md transition cursor-pointer"
                              title="Hapus Pengiriman"
                            >
                              <Trash2 className="w-4 h-4 text-rose-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Summary Footer */}
        <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-600">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              Total Omset: <strong className="font-mono text-stone-900">{formatRupiah(totalAllRevenue)}</strong>
            </span>
            <span className="text-amber-800 font-semibold">
              Piutang: <strong className="font-mono">{formatRupiah(totalReceivables)}</strong>
            </span>
            <span className="text-emerald-700 font-semibold">
              Kas Lunas: <strong className="font-mono">{formatRupiah(totalPaidRevenue)}</strong>
            </span>
          </div>
          <span className={`font-bold font-mono ${totalAllProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            Total Keuntungan: {formatSignedRupiah(totalAllProfit)}
          </span>
        </div>
      </div>

      {/* Modal Konfirmasi Hapus Riwayat Pengiriman */}
      {saleToDelete && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => {
            const restore = captureScrollState();
            blurActiveTrigger();
            setSaleToDelete(null);
            restore();
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-delete-sale-title"
          >
            <div className="flex-shrink-0 px-5 py-4 border-b border-stone-200 bg-rose-50/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="modal-delete-sale-title" className="text-sm sm:text-base font-bold text-stone-900">
                    Konfirmasi Hapus Pengiriman
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Tindakan ini permanen dan tidak dapat dibatalkan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const restore = captureScrollState();
                  blurActiveTrigger();
                  setSaleToDelete(null);
                  restore();
                }}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition cursor-pointer"
                aria-label="Tutup modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-stone-700">
              <p className="text-stone-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus surat jalan pengiriman kopi berikut dari pembukuan?
              </p>

              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between border-b border-stone-200/80 pb-2">
                  <span className="text-[11px] text-stone-500 font-medium">No. Surat Jalan:</span>
                  <span className="font-mono font-bold text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200 text-[11px]">
                    {saleToDelete.invoiceNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-stone-500">Gudang Tujuan:</span>
                  <span className="font-bold text-stone-900">{saleToDelete.buyerWarehouseName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-stone-500">Keluar Lapak → Timbang Gudang:</span>
                  <span className="font-mono font-medium text-stone-800">
                    {formatNumber(saleToDelete.dispatchedWeightKg)} kg → {formatNumber(saleToDelete.warehouseWeightKg)} kg
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-stone-200/80 pt-2">
                  <span className="text-[11px] font-bold text-stone-700">Total Tagihan:</span>
                  <span className="font-mono font-bold text-[#432818] text-sm">
                    {formatRupiah(saleToDelete.totalRevenue)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl text-[11px] text-amber-950 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <strong>Pemulihan Stok Otomatis:</strong> Berat keluar lapak sebesar <strong>{formatNumber(saleToDelete.dispatchedWeightKg)} kg</strong> akan otomatis dikembalikan ke stok siap kirim.
                </p>
              </div>
            </div>

            <div className="flex-shrink-0 px-5 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const restore = captureScrollState();
                  blurActiveTrigger();
                  setSaleToDelete(null);
                  restore();
                }}
                className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-100 rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const restore = captureScrollState();
                  const id = saleToDelete.id;
                  blurActiveTrigger();
                  onDeleteSale(id);
                  setSaleToDelete(null);
                  restore();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
