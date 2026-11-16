import React, { useState } from 'react';
import {
  PlusCircle,
  Search,
  Trash2,
  FileText,
  User,
  Scale,
  Coins,
  Droplets,
  AlertCircle,
  AlertTriangle,
  X,
  Archive
} from 'lucide-react';
import { CoffeePurchase } from '../types/coffee';
import {
  COFFEE_TYPE,
  formatRupiah,
  formatNumber,
  formatPercent,
  formatDateTimeIndo
} from '../data/initialData';
import { captureScrollState, blurActiveTrigger } from '../utils/scrollPreservation';
import {
  capitalizeEachWord,
  capitalizeFirstLetter,
  handleCapitalizedInputChange
} from '../utils/textFormat';

interface TabPurchaseProps {
  purchases: CoffeePurchase[];
  onAddPurchase: (purchase: Omit<CoffeePurchase, 'id' | 'receiptNumber'>) => CoffeePurchase | void;
  onDeletePurchase: (id: string) => void;
  onViewReceipt: (purchase: CoffeePurchase) => void;
}

export const TabPurchase: React.FC<TabPurchaseProps> = ({
  purchases,
  onAddPurchase,
  onDeletePurchase,
  onViewReceipt
}) => {
  const [farmerName, setFarmerName] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [moisturePercent, setMoisturePercent] = useState('');
  const [buyPricePerKg, setBuyPricePerKg] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'DIRECT' | 'SETTLEMENT'>('ALL');
  const [purchaseToDelete, setPurchaseToDelete] = useState<CoffeePurchase | null>(null);

  const parseDecimal = (raw: string): number => {
    const normalized = raw.trim().replace(',', '.');
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : NaN;
  };

  const numWeight = (() => {
    const parsed = parseDecimal(weightKg);
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) / 100 : 0;
  })();

  const numMoisture = (() => {
    const parsed = parseDecimal(moisturePercent);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 10) / 10 : NaN;
  })();

  const numPrice = parseInt(buyPricePerKg, 10) || 0;
  const totalPayment = Math.round(numWeight * numPrice);

  const formattedBuyPrice = buyPricePerKg
    ? `Rp. ${Number(buyPricePerKg).toLocaleString('id-ID')}`
    : '';

  const handlePriceChange = (rawVal: string) => {
    const digits = rawVal.replace(/\D/g, '');
    if (!digits) {
      setBuyPricePerKg('');
    } else {
      setBuyPricePerKg(String(parseInt(digits, 10)));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!farmerName.trim()) {
      setFormError('Nama petani wajib diisi.');
      return;
    }
    if (numWeight < 0.01) {
      setFormError('Berat bersih (kg) minimal 0,01 kg.');
      return;
    }
    if (!Number.isFinite(numMoisture) || numMoisture < 0 || numMoisture > 100) {
      setFormError('Kadar air (%) wajib diisi antara 0% sampai 100%.');
      return;
    }
    if (numPrice <= 0) {
      setFormError('Harga beli Owner per kg harus lebih dari Rp. 0.');
      return;
    }

    const restore = captureScrollState();
    onAddPurchase({
      farmerName: farmerName.trim(),
      coffeeType: COFFEE_TYPE,
      weightKg: numWeight,
      moisturePercent: numMoisture,
      buyPricePerKg: numPrice,
      totalPayment,
      date: new Date().toISOString(),
      notes: notes.trim() || undefined
    });

    setFarmerName('');
    setWeightKg('');
    setMoisturePercent('');
    setBuyPricePerKg('');
    setNotes('');
    restore();
  };

  const filteredPurchases = purchases.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.farmerName.toLowerCase().includes(q) ||
      p.receiptNumber.toLowerCase().includes(q) ||
      (p.sourceDepositNumber && p.sourceDepositNumber.toLowerCase().includes(q)) ||
      (p.notes && p.notes.toLowerCase().includes(q));

    const isSettlement = Boolean(p.sourceDepositId || p.sourceDepositNumber);
    const matchesSource =
      sourceFilter === 'ALL' ||
      (sourceFilter === 'DIRECT' && !isSettlement) ||
      (sourceFilter === 'SETTLEMENT' && isSettlement);

    return matchesSearch && matchesSource;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Form Timbangan Masuk Kopi (5 Cols on Desktop) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-stone-200 p-4 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-2.5 mb-3.5 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-[#5C3A21]" />
                <span>Pembelian Kopi Petani</span>
              </h3>
              <span className="text-[11px] font-semibold text-[#5C3A21] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                {COFFEE_TYPE}
              </span>
            </div>

            {formError && (
              <div className="mb-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* 1. Nama Petani */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nama Petani <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoCapitalize="words"
                    value={farmerName}
                    onChange={(e) => handleCapitalizedInputChange(e, capitalizeEachWord, setFarmerName)}
                    placeholder="Contoh: Pak Slamet"
                    className="w-full h-[36px] pl-9 pr-3 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C3A21]"
                  />
                </div>
              </div>

              {/* 2. Berat Bersih & Kadar Air */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Berat Bersih (kg) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-stone-400">
                      <Scale className="w-4 h-4" />
                    </div>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      placeholder="0"
                      className="w-full h-[36px] pl-8 pr-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg font-mono tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C3A21]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Kadar Air (%) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-stone-400">
                      <Droplets className="w-4 h-4" />
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      required
                      value={moisturePercent}
                      onChange={(e) => setMoisturePercent(e.target.value)}
                      placeholder="Contoh: 14.5"
                      className="w-full h-[36px] pl-8 pr-7 text-sm bg-stone-50 border border-stone-200 rounded-lg font-mono tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C3A21]"
                    />
                    <span className="absolute inset-y-0 right-2.5 flex items-center text-xs font-semibold text-stone-400 pointer-events-none">
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Harga Beli Owner per kg */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Harga Beli Owner (per kg) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Coins className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={formattedBuyPrice}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    placeholder="Rp. 0"
                    className="w-full h-[36px] pl-9 pr-3 text-sm bg-stone-50 border border-stone-200 rounded-lg font-mono tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C3A21]"
                  />
                </div>
                <p className="text-[10.5px] text-stone-400 mt-1">
                  Diinput setelah kopi ditimbang dan dicek kadar airnya. Semua stok langsung digabung ke 1 stok aktif.
                </p>
              </div>

              {/* 4. Catatan Tambahan */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Keterangan / Kondisi Biji Kopi (Opsional)
                </label>
                <input
                  type="text"
                  autoCapitalize="sentences"
                  value={notes}
                  onChange={(e) => handleCapitalizedInputChange(e, capitalizeFirstLetter, setNotes)}
                  placeholder="Contoh: Kopi robusta kering petik merah, bersih"
                  className="w-full h-[36px] px-3 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C3A21]"
                />
              </div>

              {/* Live Calculation Summary Box */}
              <div className="p-3.5 bg-[#FAF3E8] rounded-xl border border-amber-200/90 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-[#432818]">
                  <span className="font-medium">Berat Bersih &amp; Kadar Air:</span>
                  <span className="font-mono font-semibold">
                    {formatNumber(numWeight)} kg · {Number.isFinite(numMoisture) ? formatPercent(numMoisture) : '0%'}
                  </span>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-1 pt-1.5 border-t border-amber-200">
                  <span className="text-xs font-bold text-[#2D180C]">
                    Total Bayar ke Petani:
                  </span>
                  <span className="text-lg sm:text-xl font-extrabold text-[#432818] font-mono tabular-nums">
                    {formatRupiah(totalPayment)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-[40px] py-2 px-4 bg-[#432818] hover:bg-[#331D11] text-white font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span>Simpan &amp; Tambah ke Stok Kopi</span>
              </button>
            </form>
          </div>
        </div>

        {/* Purchase History Ledger Table (7 Cols on Desktop) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-stone-200 p-4 sm:p-6 shadow-xs flex flex-col justify-between min-w-0">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#5C3A21] shrink-0" />
                  <span>Riwayat Pembelian Kopi Petani</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Total {filteredPurchases.length} nota pembelian &amp; putus harga tercatat
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-48">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-stone-400">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    autoCapitalize="sentences"
                    value={searchQuery}
                    onChange={(e) => handleCapitalizedInputChange(e, capitalizeFirstLetter, setSearchQuery)}
                    placeholder="Cari nota, petani..."
                    className="w-full h-[34px] pl-8 pr-8 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5C3A21]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value as 'ALL' | 'DIRECT' | 'SETTLEMENT')}
                  className="w-full sm:w-auto h-[34px] px-2.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5C3A21] cursor-pointer font-medium text-stone-700"
                >
                  <option value="ALL">Semua Sumber</option>
                  <option value="DIRECT">Pembelian Langsung</option>
                  <option value="SETTLEMENT">Putus Harga (Titipan)</option>
                </select>
              </div>
            </div>

            <div className="mt-3">
              {filteredPurchases.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-12 h-12 rounded-full bg-amber-50 text-[#5C3A21] flex items-center justify-center mx-auto mb-3">
                    <Scale className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-stone-700">Tidak ada riwayat pembelian ditemukan</p>
                  <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                    {searchQuery
                      ? 'Coba ubah kata kunci pencarian Anda.'
                      : 'Gunakan formulir di samping untuk mencatat pembelian kopi bijian pertama dari petani.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile Card List (< md) */}
                  <div className="md:hidden space-y-2">
                    {filteredPurchases.map((item) => (
                      <div key={item.id} className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="font-mono font-semibold text-[#5C3A21] block text-[11px]">
                              {item.receiptNumber}
                            </span>
                            <span className="font-bold text-stone-900 block text-sm truncate">
                              {item.farmerName}
                            </span>
                            <span className="text-[10px] text-stone-400 block">
                              {formatDateTimeIndo(item.date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => onViewReceipt(item)}
                              title="Lihat Nota Timbangan"
                              className="p-1.5 text-stone-600 hover:text-[#432818] bg-white border border-stone-200 rounded-lg transition cursor-pointer"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPurchaseToDelete(item)}
                              title={`Hapus Transaksi ${item.receiptNumber}`}
                              className="p-1.5 text-rose-500 hover:text-rose-700 bg-white border border-stone-200 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#5C3A21] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
                            {item.coffeeType}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-sky-900 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded font-semibold">
                            <Droplets className="w-3 h-3 text-sky-700" />
                            KA {formatPercent(item.moisturePercent)}
                          </span>
                          {item.sourceDepositNumber && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                              <Archive className="w-3 h-3" />
                              Putus Harga ({item.sourceDepositNumber})
                            </span>
                          )}
                        </div>

                        {item.notes && (
                          <p className="text-[11px] text-stone-500 italic break-words">
                            {item.notes}
                          </p>
                        )}

                        <div className="pt-2 border-t border-stone-200/70 flex items-center justify-between gap-2 text-xs">
                          <div className="font-mono tabular-nums text-stone-700">
                            <strong className="text-stone-900">{formatNumber(item.weightKg)} kg</strong>
                          </div>
                          <div className="text-right font-mono tabular-nums">
                            <strong className="text-[#432818] block">{formatRupiah(item.totalPayment)}</strong>
                            <span className="text-[10px] text-stone-400">
                              @{formatRupiah(item.buyPricePerKg)}/kg
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop & Tablet Table (>= md) */}
                  <div className="hidden md:block overflow-x-auto lg:overflow-x-hidden lg:max-h-[438px] lg:overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="lg:sticky lg:top-0 lg:z-10 bg-stone-50">
                        <tr className="border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider bg-stone-50 shadow-[inset_0_-1px_0_0_#e7e5e4]">
                          <th className="py-2.5 px-2 w-[124px] min-w-[120px] whitespace-nowrap">Nota &amp; Waktu</th>
                          <th className="py-2.5 px-2">Petani &amp; Sumber</th>
                          <th className="py-2.5 px-2 text-left whitespace-nowrap">Berat &amp; Kadar Air</th>
                          <th className="py-2.5 px-2 text-left whitespace-nowrap">Harga / Total</th>
                          <th className="py-2.5 px-1.5 text-center whitespace-nowrap">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
                        {filteredPurchases.map((item) => (
                          <tr key={item.id} className="hover:bg-stone-50/70 transition">
                            <td className="py-3 px-2 w-[124px] min-w-[120px] align-top">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-mono font-semibold text-[#5C3A21] text-[11px] leading-tight whitespace-nowrap">
                                  {item.receiptNumber}
                                </span>
                                <span className="text-[10px] text-stone-400 leading-tight whitespace-nowrap">
                                  {formatDateTimeIndo(item.date)}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-2 align-top min-w-0">
                              <span className="font-semibold text-stone-900 block break-words">
                                {item.farmerName}
                              </span>
                              <div className="mt-1 flex flex-wrap items-center gap-1">
                                <span className="text-[10px] text-[#5C3A21] bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                                  {item.coffeeType}
                                </span>
                                {item.sourceDepositNumber && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded">
                                    <Archive className="w-2.5 h-2.5" />
                                    Putus Harga ({item.sourceDepositNumber})
                                  </span>
                                )}
                              </div>
                              {item.notes && (
                                <span className="text-[10px] text-stone-400 italic block mt-0.5 break-words">
                                  {item.notes}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-2 text-left align-top whitespace-nowrap">
                              <span className="font-mono font-bold text-stone-900 block tabular-nums">
                                {formatNumber(item.weightKg)} kg
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-sky-800 mt-0.5">
                                <Droplets className="w-2.5 h-2.5 text-sky-600" />
                                KA {formatPercent(item.moisturePercent)}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-left align-top whitespace-nowrap">
                              <span className="font-mono font-bold text-[#432818] block tabular-nums">
                                {formatRupiah(item.totalPayment)}
                              </span>
                              <span className="text-[10px] text-stone-400 block font-mono tabular-nums">
                                @{formatRupiah(item.buyPricePerKg)}/kg
                              </span>
                            </td>
                            <td className="py-3 px-1.5 text-center align-top whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => onViewReceipt(item)}
                                  title="Lihat Nota Timbangan"
                                  className="p-1.5 text-stone-500 hover:text-[#432818] hover:bg-amber-50 rounded-md transition cursor-pointer"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPurchaseToDelete(item)}
                                  title={`Hapus Transaksi ${item.receiptNumber}`}
                                  className="p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded-md transition cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-500 hover:text-rose-700" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="pt-2.5 mt-3 border-t border-stone-100 flex flex-wrap items-center justify-between text-xs text-stone-500 gap-2">
            <span>
              Menampilkan {filteredPurchases.length} dari {purchases.length} transaksi
            </span>
            <span className="text-[#5C3A21] font-medium">
              Nota pembelian &amp; hasil putus harga siap dicetak
            </span>
          </div>
        </div>
      </div>

      {/* Modal Konfirmasi Hapus Transaksi Pembelian */}
      {purchaseToDelete && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => {
            const restore = captureScrollState();
            blurActiveTrigger();
            setPurchaseToDelete(null);
            restore();
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-delete-purchase-title"
          >
            <div className="flex-shrink-0 px-5 py-4 border-b border-stone-200 bg-rose-50/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="modal-delete-purchase-title" className="text-sm sm:text-base font-bold text-stone-900">
                    Konfirmasi Hapus Pembelian
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
                  setPurchaseToDelete(null);
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
                Apakah Anda yakin ingin menghapus nota pembelian kopi berikut dari pembukuan?
              </p>

              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between border-b border-stone-200/80 pb-2">
                  <span className="text-[11px] text-stone-500 font-medium">Nomor Nota:</span>
                  <span className="font-mono font-bold text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200 text-[11px]">
                    {purchaseToDelete.receiptNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-stone-500">Nama Petani:</span>
                  <span className="font-bold text-stone-900">{purchaseToDelete.farmerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-stone-500">Berat &amp; Kadar Air:</span>
                  <span className="font-mono font-semibold text-stone-800">
                    {formatNumber(purchaseToDelete.weightKg)} kg · KA {formatPercent(purchaseToDelete.moisturePercent)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-stone-200/80 pt-2">
                  <span className="text-[11px] font-bold text-stone-700">Total Pembayaran:</span>
                  <span className="font-mono font-bold text-[#432818] text-sm">
                    {formatRupiah(purchaseToDelete.totalPayment)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl text-[11px] text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <strong>Penyesuaian Stok Otomatis:</strong> Stok kopi siap kirim pada gudang akan otomatis berkurang sebanyak <strong>{formatNumber(purchaseToDelete.weightKg)} kg</strong> agar data stok dan modal tetap sinkron.
                </p>
              </div>
            </div>

            <div className="flex-shrink-0 px-5 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const restore = captureScrollState();
                  blurActiveTrigger();
                  setPurchaseToDelete(null);
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
                  const id = purchaseToDelete.id;
                  blurActiveTrigger();
                  onDeletePurchase(id);
                  setPurchaseToDelete(null);
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
