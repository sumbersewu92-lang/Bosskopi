import React, { useState } from 'react';
import {
  Archive,
  PlusCircle,
  Search,
  User,
  Scale,
  Droplets,
  Coins,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  ArrowRight,
  Clock3
} from 'lucide-react';
import { CoffeeDeposit, CoffeePurchase } from '../types/coffee';
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

interface TabDepositsProps {
  deposits: CoffeeDeposit[];
  onAddDeposit: (deposit: Omit<CoffeeDeposit, 'id' | 'depositNumber' | 'remainingWeightKg' | 'status'>) => CoffeeDeposit | void;
  onSettleDeposit: (deposit: CoffeeDeposit, settleWeightKg: number, pricePerKg: number) => Promise<CoffeePurchase | void>;
  onDeleteDeposit: (id: string) => void;
  onViewDepositReceipt: (deposit: CoffeeDeposit) => void;
  onViewPurchaseReceipt: (purchase: CoffeePurchase) => void;
  purchases: CoffeePurchase[];
}

export const TabDeposits: React.FC<TabDepositsProps> = ({
  deposits,
  onAddDeposit,
  onSettleDeposit,
  onDeleteDeposit,
  onViewDepositReceipt,
  onViewPurchaseReceipt,
  purchases
}) => {
  // Form Titip Kopi
  const [farmerName, setFarmerName] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [moisturePercent, setMoisturePercent] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // List filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'AKTIF' | 'SELESAI' | 'ALL'>('AKTIF');

  // Putus Harga Modal
  const [settleTarget, setSettleTarget] = useState<CoffeeDeposit | null>(null);
  const [settleWeightKg, setSettleWeightKg] = useState('');
  const [settlePricePerKg, setSettlePricePerKg] = useState('');
  const [settleError, setSettleError] = useState('');
  const [isSettling, setIsSettling] = useState(false);

  // Delete Deposit Modal
  const [depositToDelete, setDepositToDelete] = useState<CoffeeDeposit | null>(null);

  const parseDecimal = (raw: string): number => {
    const normalized = raw.trim().replace(',', '.');
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : NaN;
  };

  const numDepositWeight = (() => {
    const parsed = parseDecimal(weightKg);
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) / 100 : 0;
  })();

  const numDepositMoisture = (() => {
    const parsed = parseDecimal(moisturePercent);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 10) / 10 : NaN;
  })();

  const handleSubmitDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!farmerName.trim()) {
      setFormError('Nama petani wajib diisi.');
      return;
    }
    if (numDepositWeight < 0.01) {
      setFormError('Berat bersih kopi titipan (kg) minimal 0,01 kg.');
      return;
    }
    if (!Number.isFinite(numDepositMoisture) || numDepositMoisture < 0 || numDepositMoisture > 100) {
      setFormError('Kadar air (%) wajib diisi antara 0% sampai 100%.');
      return;
    }

    const restore = captureScrollState();
    onAddDeposit({
      farmerName: farmerName.trim(),
      coffeeType: COFFEE_TYPE,
      initialWeightKg: numDepositWeight,
      moisturePercent: numDepositMoisture,
      date: new Date().toISOString(),
      notes: notes.trim() || undefined
    });

    setFarmerName('');
    setWeightKg('');
    setMoisturePercent('');
    setNotes('');
    restore();
  };

  // Putus Harga Modal helpers
  const openSettleModal = (dep: CoffeeDeposit) => {
    if (dep.status !== 'AKTIF' || dep.remainingWeightKg <= 0) return;
    setSettleTarget(dep);
    setSettleWeightKg('');
    setSettlePricePerKg('');
    setSettleError('');
  };

  const handleSettlePriceChange = (rawVal: string) => {
    const digits = rawVal.replace(/\D/g, '');
    if (!digits) {
      setSettlePricePerKg('');
    } else {
      setSettlePricePerKg(String(parseInt(digits, 10)));
    }
    setSettleError('');
  };

  const numSettleWeight = (() => {
    const parsed = parseDecimal(settleWeightKg);
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) / 100 : 0;
  })();
  const numSettlePrice = parseInt(settlePricePerKg, 10) || 0;
  const settleTotalPayment = Math.round(numSettleWeight * numSettlePrice);
  const remainingAfterSettle = settleTarget
    ? Math.max(0, Math.round((settleTarget.remainingWeightKg - numSettleWeight) * 100) / 100)
    : 0;

  const handleConfirmSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleTarget || isSettling) return;
    setSettleError('');

    if (numSettleWeight < 0.01) {
      setSettleError('Berat yang di-Putus Harga minimal 0,01 kg.');
      return;
    }
    if (numSettleWeight > settleTarget.remainingWeightKg) {
      setSettleError(
        `Berat putus harga (${formatNumber(numSettleWeight)} kg) melebihi sisa titipan (${formatNumber(settleTarget.remainingWeightKg)} kg).`
      );
      return;
    }
    if (numSettlePrice <= 0) {
      setSettleError('Masukkan harga hari ini (per kg) lebih dari Rp. 0.');
      return;
    }

    setIsSettling(true);
    const restore = captureScrollState();
    try {
      await onSettleDeposit(settleTarget, numSettleWeight, numSettlePrice);
      blurActiveTrigger();
      setSettleTarget(null);
      restore();
    } catch (err: unknown) {
      setSettleError(err instanceof Error ? err.message : 'Gagal memproses Putus Harga.');
    } finally {
      setIsSettling(false);
    }
  };

  // Metrics for summary strip
  const activeDeposits = deposits.filter((d) => d.status === 'AKTIF' && d.remainingWeightKg > 0);
  const totalActiveDepositKg = Math.round(activeDeposits.reduce((acc, d) => acc + d.remainingWeightKg, 0) * 100) / 100;

  const filteredDeposits = deposits.filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      d.farmerName.toLowerCase().includes(q) ||
      d.depositNumber.toLowerCase().includes(q) ||
      (d.notes && d.notes.toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Left Column: Form Titip Kopi Petani */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-stone-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-100">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Archive className="w-4 h-4 text-[#B45309]" />
              <span>Catat Titip Kopi Petani</span>
            </h3>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              Stok Terpisah
            </span>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-[11.5px] text-amber-950 leading-relaxed flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              Kopi titipan dicatat berat &amp; kadar airnya tanpa harga. Fisiknya dipisah dan <strong>baru masuk ke stok siap jual setelah Putus Harga</strong> sesuai harga hari itu.
            </span>
          </div>

          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitDeposit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nama Petani Penitip <span className="text-rose-500">*</span>
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
                  placeholder="Contoh: Pak Hendra"
                  className="w-full h-[36px] pl-9 pr-3 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C3A21]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Berat Bersih Titipan (kg) <span className="text-rose-500">*</span>
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
                    placeholder="Contoh: 1000"
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
                    placeholder="Contoh: 15.0"
                    className="w-full h-[36px] pl-8 pr-7 text-sm bg-stone-50 border border-stone-200 rounded-lg font-mono tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C3A21]"
                  />
                  <span className="absolute inset-y-0 right-2.5 flex items-center text-xs font-semibold text-stone-400 pointer-events-none">
                    %
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Keterangan / Catatan Karung (Opsional)
              </label>
              <input
                type="text"
                autoCapitalize="sentences"
                value={notes}
                onChange={(e) => handleCapitalizedInputChange(e, capitalizeFirstLetter, setNotes)}
                placeholder="Contoh: 12 karung posisi rak B, menunggu harga naik"
                className="w-full h-[36px] px-3 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C3A21]"
              />
            </div>

            <div className="p-3 bg-[#FAF3E8] rounded-xl border border-amber-200/90 flex items-center justify-between text-xs">
              <span className="font-semibold text-[#432818]">Harga Saat Penitipan:</span>
              <span className="font-mono font-bold text-[#B45309]">Belum Ditentukan (Rp. 0)</span>
            </div>

            <button
              type="submit"
              className="w-full min-h-[40px] py-2 px-4 bg-[#432818] hover:bg-[#331D11] text-white font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>Simpan &amp; Terbitkan Tanda Terima Titip</span>
            </button>
          </form>
        </div>

        {/* Right Column: Daftar Stok Titipan Petani */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-stone-200 p-4 sm:p-6 shadow-xs space-y-4 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Archive className="w-4 h-4 text-[#5C3A21] shrink-0" />
                <span>Daftar Stok Titipan Petani</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Stok titipan aktif: <strong className="font-mono text-[#432818]">{formatNumber(totalActiveDepositKg)} kg</strong> ({activeDeposits.length} petani belum lunas putus harga)
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-44">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-stone-400">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  autoCapitalize="sentences"
                  value={searchQuery}
                  onChange={(e) => handleCapitalizedInputChange(e, capitalizeFirstLetter, setSearchQuery)}
                  placeholder="Cari tanda terima, petani..."
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'AKTIF' | 'SELESAI' | 'ALL')}
                className="w-full sm:w-auto h-[34px] px-2.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5C3A21] cursor-pointer font-medium text-stone-700"
              >
                <option value="AKTIF">Masih Dititip ({activeDeposits.length})</option>
                <option value="SELESAI">Selesai Putus Harga</option>
                <option value="ALL">Semua Titipan</option>
              </select>
            </div>
          </div>

          {filteredDeposits.length === 0 ? (
            <div className="text-center py-12 px-4 bg-stone-50/70 rounded-xl border border-dashed border-stone-200">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-[#5C3A21] flex items-center justify-center mx-auto mb-3">
                <Archive className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-stone-700">
                {statusFilter === 'AKTIF'
                  ? 'Belum ada titipan kopi yang masih aktif'
                  : 'Tidak ada data titip kopi yang cocok'}
              </p>
              <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                Catat kopi titipan petani di formulir samping, lalu klik "Putus Harga" kapan saja saat petani ingin menjual sebagian atau seluruhnya.
              </p>
            </div>
          ) : (
            <div className="space-y-3 lg:max-h-[540px] lg:overflow-y-auto pr-0.5">
              {filteredDeposits.map((dep) => {
                const isActive = dep.status === 'AKTIF' && dep.remainingWeightKg > 0;
                const settledKg = Math.round((dep.initialWeightKg - dep.remainingWeightKg) * 100) / 100;
                const settlements = dep.settlements || [];

                return (
                  <div
                    key={dep.id}
                    className={`p-4 rounded-xl border transition space-y-3 ${
                      isActive ? 'bg-amber-50/35 border-amber-200' : 'bg-stone-50/60 border-stone-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs text-[#5C3A21]">
                            {dep.depositNumber}
                          </span>
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                              <Clock3 className="w-3 h-3" />
                              Titipan Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Selesai Putus Harga
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-sky-900 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                            <Droplets className="w-3 h-3 text-sky-600" />
                            KA {formatPercent(dep.moisturePercent)}
                          </span>
                        </div>
                        <h4 className="font-bold text-stone-900 text-sm mt-1">
                          {dep.farmerName}
                        </h4>
                        <p className="text-[11px] text-stone-500">
                          Diterima: {formatDateTimeIndo(dep.date)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isActive && (
                          <button
                            type="button"
                            onClick={() => openSettleModal(dep)}
                            className="px-3 py-1.5 bg-[#432818] hover:bg-[#331D11] text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Coins className="w-3.5 h-3.5 text-amber-300" />
                            <span>Putus Harga</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onViewDepositReceipt(dep)}
                          title="Lihat Tanda Terima Titip"
                          className="p-1.5 text-stone-600 hover:text-[#432818] bg-white border border-stone-200 rounded-lg transition cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDepositToDelete(dep)}
                          title={`Hapus Titipan ${dep.depositNumber}`}
                          className="p-1.5 text-rose-500 hover:text-rose-700 bg-white border border-stone-200 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {dep.notes && (
                      <p className="text-[11px] text-stone-600 italic bg-white/80 px-2.5 py-1.5 rounded-lg border border-stone-200/80">
                        "{dep.notes}"
                      </p>
                    )}

                    {/* Weight breakdown bar */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-200/70 text-xs">
                      <div>
                        <span className="text-[10px] text-stone-500 block">Titipan Awal</span>
                        <strong className="font-mono text-stone-800 tabular-nums">
                          {formatNumber(dep.initialWeightKg)} kg
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 block">Sudah Putus</span>
                        <strong className="font-mono text-emerald-800 tabular-nums">
                          {formatNumber(settledKg)} kg
                        </strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-amber-800 block">Sisa Belum Putus</span>
                        <strong className="font-mono font-extrabold text-[#432818] text-sm tabular-nums">
                          {formatNumber(dep.remainingWeightKg)} kg
                        </strong>
                      </div>
                    </div>

                    {/* Settlement History if any */}
                    {settlements.length > 0 && (
                      <div className="pt-2 border-t border-stone-200/70 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                          Riwayat Pencairan Putus Harga ({settlements.length}x)
                        </span>
                        <div className="space-y-1">
                          {settlements.map((st) => {
                            const linkedPurchase = purchases.find((p) => p.id === st.purchaseId);
                            return (
                              <div
                                key={st.id}
                                className="flex flex-wrap items-center justify-between gap-2 text-[11px] bg-white px-2.5 py-1.5 rounded-lg border border-stone-200/80"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-mono font-semibold text-[#5C3A21]">{st.receiptNumber}</span>
                                  <span className="text-stone-400">·</span>
                                  <span className="font-mono text-stone-800 font-semibold">
                                    {formatNumber(st.settledWeightKg)} kg
                                  </span>
                                  <span className="text-stone-500 font-mono">
                                    @{formatRupiah(st.pricePerKg)}/kg
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 ml-auto">
                                  <strong className="font-mono text-emerald-800">
                                    {formatRupiah(st.totalPayment)}
                                  </strong>
                                  {linkedPurchase && (
                                    <button
                                      type="button"
                                      onClick={() => onViewPurchaseReceipt(linkedPurchase)}
                                      className="text-[10px] font-semibold text-[#5C3A21] hover:underline cursor-pointer"
                                    >
                                      Nota
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Putus Harga (Sebagian atau Semua) */}
      {settleTarget && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => {
            if (isSettling) return;
            const restore = captureScrollState();
            blurActiveTrigger();
            setSettleTarget(null);
            restore();
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-putus-harga-title"
          >
            <div className="flex-shrink-0 px-5 py-4 border-b border-amber-200 bg-[#FAF3E8] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#432818] text-amber-300 flex items-center justify-center shrink-0">
                  <Coins className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 id="modal-putus-harga-title" className="text-sm sm:text-base font-bold text-stone-900 truncate">
                    Putus Harga Titip Kopi
                  </h3>
                  <p className="text-[11px] text-[#5C3A21] truncate">
                    {settleTarget.depositNumber} · {settleTarget.farmerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSettling}
                onClick={() => {
                  const restore = captureScrollState();
                  blurActiveTrigger();
                  setSettleTarget(null);
                  restore();
                }}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition cursor-pointer"
                aria-label="Tutup modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSettle} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
                {settleError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{settleError}</span>
                  </div>
                )}

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-stone-500 block">Sisa Belum Putus</span>
                    <strong className="text-sm font-mono font-extrabold text-[#432818]">
                      {formatNumber(settleTarget.remainingWeightKg)} kg
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-stone-500 block">Kadar Air Titipan</span>
                    <strong className="text-sm font-mono font-bold text-sky-800">
                      {formatPercent(settleTarget.moisturePercent)}
                    </strong>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label className="font-semibold text-stone-700">
                      Berat Diputus Harga (kg) <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      {settleTarget.remainingWeightKg >= 100 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSettleWeightKg('100');
                            setSettleError('');
                          }}
                          className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded cursor-pointer"
                        >
                          1 Kwintal (100 kg)
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSettleWeightKg(String(settleTarget.remainingWeightKg));
                          setSettleError('');
                        }}
                        className="px-2 py-0.5 text-[10px] font-bold bg-[#432818] hover:bg-[#331D11] text-white rounded cursor-pointer"
                      >
                        Putus Semua
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    max={settleTarget.remainingWeightKg}
                    required
                    value={settleWeightKg}
                    onChange={(e) => {
                      setSettleWeightKg(e.target.value);
                      setSettleError('');
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    placeholder="0"
                    className="w-full h-[38px] px-3 text-sm bg-white border border-stone-300 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[#5C3A21] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Harga Hari Ini (per kg) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={settlePricePerKg ? `Rp. ${Number(settlePricePerKg).toLocaleString('id-ID')}` : ''}
                    onChange={(e) => handleSettlePriceChange(e.target.value)}
                    placeholder="Rp. 0"
                    className="w-full h-[38px] px-3 text-sm bg-white border border-stone-300 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[#5C3A21]"
                  />
                </div>

                <div className="p-3.5 bg-[#FAF3E8] border border-amber-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-600">Sisa Titipan Setelah Putus:</span>
                    <strong className="font-mono text-stone-900">
                      {formatNumber(remainingAfterSettle)} kg ({remainingAfterSettle <= 0 ? 'SELESAI' : 'MASIH AKTIF'})
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-amber-200">
                    <span className="font-bold text-[#2D180C]">Total Bayar Putus Harga:</span>
                    <strong className="text-base font-extrabold font-mono text-[#432818]">
                      {formatRupiah(settleTotalPayment)}
                    </strong>
                  </div>
                  <p className="text-[10.5px] text-[#5C3A21] pt-1 leading-snug">
                    Otomatis membuat nota pembelian resmi dan memindahkan <strong>{formatNumber(numSettleWeight)} kg</strong> kopi ke stok siap jual.
                  </p>
                </div>
              </div>

              <div className="flex-shrink-0 px-5 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isSettling}
                  onClick={() => {
                    const restore = captureScrollState();
                    blurActiveTrigger();
                    setSettleTarget(null);
                    restore();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSettling}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#432818] hover:bg-[#331D11] rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <span>{isSettling ? 'Memproses...' : 'Konfirmasi Putus Harga'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Titip Kopi */}
      {depositToDelete && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => {
            const restore = captureScrollState();
            blurActiveTrigger();
            setDepositToDelete(null);
            restore();
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex-shrink-0 px-5 py-4 border-b border-stone-200 bg-rose-50/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-stone-900">
                    Hapus Catatan Titip Kopi?
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    {depositToDelete.depositNumber} · {depositToDelete.farmerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const restore = captureScrollState();
                  blurActiveTrigger();
                  setDepositToDelete(null);
                  restore();
                }}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs text-stone-600">
              <p>
                Anda akan menghapus tanda terima titip kopi atas nama <strong>{depositToDelete.farmerName}</strong> ({formatNumber(depositToDelete.initialWeightKg)} kg, sisa {formatNumber(depositToDelete.remainingWeightKg)} kg).
              </p>
              <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
                Catatan: Nota pembelian yang sudah terlanjur terbentuk dari Putus Harga sebelumnya tetap tercatat terpisah di tab Pembelian Petani.
              </p>
            </div>

            <div className="px-5 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const restore = captureScrollState();
                  blurActiveTrigger();
                  setDepositToDelete(null);
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
                  const id = depositToDelete.id;
                  blurActiveTrigger();
                  onDeleteDeposit(id);
                  setDepositToDelete(null);
                  restore();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
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
