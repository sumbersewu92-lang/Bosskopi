export interface CoffeePurchase {
  id: string;
  receiptNumber: string;
  farmerName: string;
  coffeeType: string; // Selalu "Kopi Bijian"
  weightKg: number; // Berat bersih (kg)
  moisturePercent: number; // Kadar air (%)
  buyPricePerKg: number; // Harga beli per kg (ditentukan Owner)
  totalPayment: number; // Total bayar (weightKg * buyPricePerKg)
  sourceDepositId?: string; // Referensi ID titipan jika berasal dari Putus Harga
  sourceDepositNumber?: string; // Nomor Tanda Terima Titipan asal (TT-...)
  date: string; // ISO string
  notes?: string;
  createdById?: string;
  createdByName?: string;
}

export interface DepositSettlement {
  id: string;
  purchaseId: string;
  receiptNumber: string;
  settledWeightKg: number;
  pricePerKg: number;
  totalPayment: number;
  date: string; // ISO string
  settledById?: string;
  settledByName?: string;
}

export interface CoffeeDeposit {
  id: string;
  depositNumber: string; // e.g., TT-20261116-123
  farmerName: string;
  coffeeType: string; // Selalu "Kopi Bijian"
  initialWeightKg: number; // Berat bersih saat dititipkan (kg)
  remainingWeightKg: number; // Sisa berat belum putus harga (kg)
  moisturePercent: number; // Kadar air saat dititipkan (%)
  status: 'AKTIF' | 'SELESAI';
  settlements?: DepositSettlement[];
  date: string; // ISO string
  notes?: string;
  createdById?: string;
  createdByName?: string;
}

export interface WarehouseSale {
  id: string;
  invoiceNumber: string;
  buyerWarehouseName: string; // Nama Gudang Pusat / Pembeli Tujuan
  buyerWhatsApp?: string;
  buyerPhone?: string;
  coffeeType: string; // Selalu "Kopi Bijian"
  dispatchedWeightKg: number; // Berat keluar dari stok lapak (memotong stok siap jual)
  warehouseWeightKg: number; // Berat hasil timbang di gudang pusat (bisa susut - atau lebih +)
  weightVarianceKg: number; // warehouseWeightKg - dispatchedWeightKg
  costPricePerKg: number; // Modal rata-rata per kg saat pengiriman
  sellPricePerKg: number; // Harga jual per kg di gudang pusat
  totalRevenue: number; // warehouseWeightKg * sellPricePerKg
  estimatedCost: number; // dispatchedWeightKg * costPricePerKg
  netProfit: number; // totalRevenue - estimatedCost
  profitMarginPercent: number; // (netProfit / totalRevenue) * 100
  date: string;
  notes?: string;
  paymentStatus: 'LUNAS' | 'BELUM_LUNAS';
  paymentMethod?: 'Transfer Bank' | 'Tunai Langsung' | 'Transfer Susulan (Piutang)';
  dueDate?: string;
  paidAt?: string;
  createdById?: string;
  createdByName?: string;
}

export interface CoffeeStockSummary {
  coffeeType: string; // "Kopi Bijian"
  stockKg: number; // Stok siap kirim (hanya dari pembelian & putus harga, tidak termasuk titipan aktif)
  totalCostInvested: number;
  avgBuyPricePerKg: number;
  avgMoisturePercent: number; // Rata-rata tertimbang kadar air stok aktif (%)
  totalPurchasedKg: number;
  depositActiveKg: number; // Stok titipan petani aktif (terpisah secara fisik)
  depositActiveCount: number;
  lastUpdated: string;
}

export type UserRole = 'owner' | 'kasir';

export interface AppUserRecord {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  passwordHash: string;
  salt: string;
  isActive: boolean;
  createdById?: string;
  createdAtDate: string;
}

export interface UserSession {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  roleLabel: string;
  storeName: string;
  avatarUrl?: string;
  isLoggedIn: boolean;
}
