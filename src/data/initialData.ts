export const STORE_NAME = 'Boss Kopi Sumber Sewu';
export const STORE_SUBTITLE = 'Sistem Jual Beli dan Management Kopi';
export const STORE_ADDRESS = 'Toko Sumber Sewu';
export const STORE_WHATSAPP = '0822-8118-5001';
export const STORE_WHATSAPP_COMPACT = '082281185001';

export const COFFEE_TYPE = 'Kopi Bijian';

export function toLocalDateInput(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function toLocalDateCode(date: Date = new Date()): string {
  return toLocalDateInput(date).replace(/-/g, '');
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '';
  try {
    let d: Date;
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
    if (dateOnlyMatch) {
      const year = Number(dateOnlyMatch[1]);
      const month = Number(dateOnlyMatch[2]);
      const day = Number(dateOnlyMatch[3]);
      d = new Date(year, month - 1, day);
    } else {
      d = new Date(dateStr);
    }
    if (Number.isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatRupiah(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(safeAmount);
}

export function formatSignedRupiah(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  if (safeAmount > 0) return `+${formatRupiah(safeAmount)}`;
  if (safeAmount < 0) return `-${formatRupiah(Math.abs(safeAmount))}`;
  return formatRupiah(0);
}

export function formatPaymentMethodLabel(
  paymentStatus: 'LUNAS' | 'BELUM_LUNAS',
  paymentMethod?: string
): string {
  if (paymentStatus === 'LUNAS') {
    if (!paymentMethod || paymentMethod === 'Transfer Susulan (Piutang)') {
      return 'Transfer Bank (Pelunasan)';
    }
    return paymentMethod;
  }
  return paymentMethod || 'Transfer Susulan (Piutang)';
}

export function formatNumber(num: number): string {
  const safeNum = Number.isFinite(num) ? num : 0;
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2
  }).format(safeNum);
}

export function formatPercent(num: number): string {
  const safeNum = Number.isFinite(num) ? num : 0;
  return `${new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 1
  }).format(safeNum)}%`;
}

export function formatSignedKg(kg: number): string {
  const safeKg = Number.isFinite(kg) ? Math.round(kg * 100) / 100 : 0;
  if (safeKg > 0) return `+${formatNumber(safeKg)} kg`;
  if (safeKg < 0) return `-${formatNumber(Math.abs(safeKg))} kg`;
  return '0 kg';
}

export function formatDateTimeIndo(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch {
    return dateStr;
  }
}
