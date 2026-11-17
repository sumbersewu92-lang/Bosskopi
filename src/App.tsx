import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { Loader2, AlertTriangle } from 'lucide-react';
import { LoginPage } from './components/LoginPage';
import { Navbar } from './components/Navbar';
import { StatCards } from './components/StatCards';
import { TabPurchase } from './components/TabPurchase';
import { TabDeposits } from './components/TabDeposits';
import { TabStockAndSales } from './components/TabStockAndSales';
import { TabFinancialReport } from './components/TabFinancialReport';
import { TabUsers } from './components/TabUsers';
import { SubNavTabs, ActiveTab } from './components/SubNavTabs';
import { ReceiptModal } from './components/ReceiptModal';
import { CoffeeLogoIcon } from './components/CoffeeLogoIcon';
import {
  CoffeePurchase,
  CoffeeDeposit,
  DepositSettlement,
  WarehouseSale,
  CoffeeStockSummary,
  AppUserRecord,
  UserRole,
  UserSession
} from './types/coffee';
import {
  STORE_NAME,
  STORE_SUBTITLE,
  COFFEE_TYPE,
  toLocalDateCode
} from './data/initialData';
import {
  db,
  OperationType,
  handleFirestoreError,
  logFirestoreError,
  clampStr,
  stripUndefined,
  ensureSeededUsersAndWorkspace,
  formatRoleLabel,
  generateSalt,
  hashPassword
} from './firebase';
import { captureScrollState, runPreservingScroll, blurActiveTrigger } from './utils/scrollPreservation';

const SESSION_STORAGE_KEY = 'lapak_active_user_id';
const LAPAK_ID = 'main';

function safeStorageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage quota/privacy restrictions
  }
}

function safeStorageRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage privacy restrictions
  }
}

function makeDocId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 7);
  return `${prefix}-${Date.now()}-${rand}`;
}

export default function App() {
  // 1. Session & Initialization State
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [dbError, setDbError] = useState<string>('');

  // 2. Active Tab State
  const [activeTab, setActiveTab] = useState<ActiveTab>('purchases');

  // 3. Real-time Firestore Data State
  const [purchases, setPurchases] = useState<CoffeePurchase[]>([]);
  const [deposits, setDeposits] = useState<CoffeeDeposit[]>([]);
  const [sales, setSales] = useState<WarehouseSale[]>([]);
  const [appUsers, setAppUsers] = useState<AppUserRecord[]>([]);
  const [userNamesById, setUserNamesById] = useState<Record<string, string>>({});

  // 4. Receipt / Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'purchase' | 'deposit' | 'sale';
    purchaseData?: CoffeePurchase | null;
    depositData?: CoffeeDeposit | null;
    saleData?: WarehouseSale | null;
  }>({
    isOpen: false,
    type: 'purchase'
  });

  // Bootstrap default workspace + default users and verify saved session
  useEffect(() => {
    let isCancelled = false;

    const initApp = async () => {
      try {
        await ensureSeededUsersAndWorkspace();

        const savedUserId = safeStorageGet(SESSION_STORAGE_KEY);
        if (savedUserId && /^[a-zA-Z0-9_-]+$/.test(savedUserId)) {
          const userSnap = await getDoc(doc(db, 'app_users', savedUserId));
          if (userSnap.exists()) {
            const u = userSnap.data() as AppUserRecord;
            if (u.isActive && !isCancelled) {
              setUserSession({
                id: u.id,
                username: u.username,
                fullName: u.fullName,
                role: u.role,
                roleLabel: formatRoleLabel(u.role),
                storeName: STORE_NAME,
                isLoggedIn: true
              });
            } else {
              safeStorageRemove(SESSION_STORAGE_KEY);
            }
          } else {
            safeStorageRemove(SESSION_STORAGE_KEY);
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
        if (!isCancelled) {
          setDbError(`Gagal terhubung ke database ${STORE_NAME}. Periksa koneksi internet Anda.`);
        }
      } finally {
        if (!isCancelled) {
          setSessionReady(true);
        }
      }
    };

    initApp();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Attach real-time Firestore listeners once authenticated
  useEffect(() => {
    if (!sessionReady || !userSession) {
      return;
    }

    const sortByDateDesc = <T extends { date: string }>(list: T[]): T[] =>
      [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const purchasesPath = `lapak/${LAPAK_ID}/purchases`;
    const purchasesQ = query(
      collection(db, 'lapak', LAPAK_ID, 'purchases'),
      where('lapakId', '==', LAPAK_ID)
    );
    const unsubPurchases = onSnapshot(
      purchasesQ,
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as CoffeePurchase);
        const restore = captureScrollState();
        setPurchases(sortByDateDesc(list));
        restore();
      },
      (error) => {
        setDbError('Gagal memuat data pembelian kopi dari database.');
        logFirestoreError(error, OperationType.LIST, purchasesPath);
      }
    );

    const depositsPath = `lapak/${LAPAK_ID}/deposits`;
    const depositsQ = query(
      collection(db, 'lapak', LAPAK_ID, 'deposits'),
      where('lapakId', '==', LAPAK_ID)
    );
    const unsubDeposits = onSnapshot(
      depositsQ,
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as CoffeeDeposit);
        const restore = captureScrollState();
        setDeposits(sortByDateDesc(list));
        restore();
      },
      (error) => {
        setDbError('Gagal memuat data titip kopi dari database.');
        logFirestoreError(error, OperationType.LIST, depositsPath);
      }
    );

    const salesPath = `lapak/${LAPAK_ID}/sales`;
    const salesQ = query(
      collection(db, 'lapak', LAPAK_ID, 'sales'),
      where('lapakId', '==', LAPAK_ID)
    );
    const unsubSales = onSnapshot(
      salesQ,
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as WarehouseSale);
        const restore = captureScrollState();
        setSales(sortByDateDesc(list));
        restore();
      },
      (error) => {
        setDbError('Gagal memuat data pengiriman gudang dari database.');
        logFirestoreError(error, OperationType.LIST, salesPath);
      }
    );

    const selfUserUnsub = onSnapshot(
      doc(db, 'app_users', userSession.id),
      (snap) => {
        if (!snap.exists()) {
          safeStorageRemove(SESSION_STORAGE_KEY);
          setUserSession(null);
          return;
        }
        const u = snap.data() as AppUserRecord;
        if (!u.isActive) {
          safeStorageRemove(SESSION_STORAGE_KEY);
          setUserSession(null);
          return;
        }
        setUserSession((prev) => {
          if (!prev) return prev;
          if (
            prev.fullName === u.fullName &&
            prev.role === u.role &&
            prev.roleLabel === formatRoleLabel(u.role)
          ) {
            return prev;
          }
          return {
            ...prev,
            fullName: u.fullName,
            role: u.role,
            roleLabel: formatRoleLabel(u.role)
          };
        });
      },
      (error) => {
        logFirestoreError(error, OperationType.GET, `app_users/${userSession.id}`);
      }
    );

    const usersPath = 'app_users';
    const usersQ = query(collection(db, 'app_users'), where('role', 'in', ['owner', 'kasir']));
    const unsubUsers = onSnapshot(
      usersQ,
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as AppUserRecord);
        const nameLookup: Record<string, string> = {};
        list.forEach((u) => {
          if (u.id && u.fullName) {
            nameLookup[u.id] = u.fullName;
          }
        });
        const restore = captureScrollState();
        setUserNamesById(nameLookup);
        if (userSession.role === 'owner') {
          list.sort((a, b) => a.id.localeCompare(b.id));
          setAppUsers(list);
        } else {
          setAppUsers([]);
        }
        restore();
      },
      (error) => {
        if (userSession.role === 'owner') {
          setDbError('Gagal memuat daftar pengguna dari database.');
        }
        logFirestoreError(error, OperationType.LIST, usersPath);
      }
    );

    return () => {
      unsubPurchases();
      unsubDeposits();
      unsubSales();
      selfUserUnsub();
      unsubUsers();
    };
  }, [sessionReady, userSession?.id, userSession?.role]);

  useEffect(() => {
    if (userSession && userSession.role !== 'owner' && activeTab === 'users') {
      setActiveTab('purchases');
    }
  }, [userSession, activeTab]);

  const safeNum = (val: unknown): number => {
    if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
    if (val === null || val === undefined || val === '') return 0;
    const raw = String(val).trim();
    const normalized = raw.includes(',') && !raw.includes('.') ? raw.replace(',', '.') : raw;
    const parsed = parseFloat(normalized.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const roundWeight = (val: number): number => Math.round(val * 100) / 100;

  // Single-pool chronological stock ledger for Kopi Bijian
  // Active deposits (status === 'AKTIF') stay physically separated and never enter stockKg until Putus Harga creates a CoffeePurchase.
  const stockSummary: CoffeeStockSummary = useMemo(() => {
    type TimelineEvent =
      | {
          kind: 'purchase';
          ts: number;
          order: number;
          weightKg: number;
          totalCost: number;
          moisturePercent: number;
        }
      | {
          kind: 'sale';
          ts: number;
          order: number;
          dispatchedWeightKg: number;
        };

    const parseTime = (dateStr: string): number => {
      const parsed = new Date(dateStr).getTime();
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const events: TimelineEvent[] = [];
    let totalPurchasedKg = 0;

    purchases.forEach((p) => {
      const w = roundWeight(safeNum(p.weightKg));
      if (w <= 0) return;
      totalPurchasedKg = roundWeight(totalPurchasedKg + w);
      const price = safeNum(p.buyPricePerKg);
      const totalCost = safeNum(p.totalPayment) || Math.round(w * price);
      const moisture = Math.min(100, Math.max(0, safeNum(p.moisturePercent)));
      events.push({
        kind: 'purchase',
        ts: parseTime(p.date),
        order: 0,
        weightKg: w,
        totalCost,
        moisturePercent: moisture
      });
    });

    sales.forEach((s) => {
      const w = roundWeight(safeNum(s.dispatchedWeightKg));
      if (w <= 0) return;
      events.push({
        kind: 'sale',
        ts: parseTime(s.date),
        order: 1,
        dispatchedWeightKg: w
      });
    });

    events.sort((a, b) => a.ts - b.ts || a.order - b.order);

    let runningStock = 0;
    let runningCost = 0;
    let runningMoistureWeighted = 0;

    for (const ev of events) {
      if (ev.kind === 'purchase') {
        runningStock = roundWeight(runningStock + ev.weightKg);
        runningCost += ev.totalCost;
        runningMoistureWeighted += ev.weightKg * ev.moisturePercent;
      } else {
        if (runningStock <= 0) continue;
        const deductedKg = Math.min(runningStock, ev.dispatchedWeightKg);
        const remainingKg = roundWeight(runningStock - deductedKg);
        if (remainingKg <= 0) {
          runningStock = 0;
          runningCost = 0;
          runningMoistureWeighted = 0;
        } else {
          const ratio = deductedKg / runningStock;
          runningCost = Math.max(0, runningCost - runningCost * ratio);
          runningMoistureWeighted = Math.max(
            0,
            runningMoistureWeighted - runningMoistureWeighted * ratio
          );
          runningStock = remainingKg;
        }
      }
    }

    const stockKg = Math.max(0, roundWeight(runningStock));
    const avgBuyPricePerKg =
      stockKg > 0 && runningCost > 0 ? Math.round(runningCost / stockKg) : 0;
    const totalCostInvested =
      stockKg > 0 && runningCost > 0 ? Math.round(runningCost) : 0;
    const avgMoisturePercent =
      stockKg > 0 && runningMoistureWeighted > 0
        ? Math.round((runningMoistureWeighted / stockKg) * 10) / 10
        : 0;

    const activeDeposits = deposits.filter((d) => d.status === 'AKTIF' && d.remainingWeightKg > 0);
    const depositActiveKg = roundWeight(
      activeDeposits.reduce((acc, d) => acc + safeNum(d.remainingWeightKg), 0)
    );

    return {
      coffeeType: COFFEE_TYPE,
      stockKg,
      totalCostInvested,
      avgBuyPricePerKg,
      avgMoisturePercent,
      totalPurchasedKg,
      depositActiveKg,
      depositActiveCount: activeDeposits.length,
      lastUpdated: new Date().toISOString()
    };
  }, [purchases, deposits, sales]);

  // Overall Stats for Top StatCards
  const stats = useMemo(() => {
    const totalCapitalSpent = purchases.reduce((acc, p) => acc + Math.round(safeNum(p.totalPayment)), 0);
    const totalRealizedRevenue = sales.reduce((acc, s) => acc + Math.round(safeNum(s.totalRevenue)), 0);
    const totalRealizedProfit = sales.reduce((acc, s) => acc + Math.round(safeNum(s.netProfit)), 0);
    const totalVarianceKg = roundWeight(
      sales.reduce((acc, s) => acc + safeNum(s.weightVarianceKg), 0)
    );
    const totalReceivables = sales
      .filter((s) => s.paymentStatus === 'BELUM_LUNAS')
      .reduce((acc, s) => acc + Math.round(safeNum(s.totalRevenue)), 0);
    const unpaidCount = sales.filter((s) => s.paymentStatus === 'BELUM_LUNAS').length;
    const totalPaidRevenue = sales
      .filter((s) => s.paymentStatus === 'LUNAS')
      .reduce((acc, s) => acc + Math.round(safeNum(s.totalRevenue)), 0);

    return {
      totalStockKg: stockSummary.stockKg,
      depositActiveKg: stockSummary.depositActiveKg,
      depositActiveCount: stockSummary.depositActiveCount,
      totalCapitalSpent,
      totalRealizedRevenue,
      totalRealizedProfit,
      totalVarianceKg,
      totalReceivables,
      unpaidCount,
      totalPaidRevenue
    };
  }, [stockSummary, purchases, sales]);

  // 1. Add Direct Coffee Purchase
  const handleAddPurchase = (
    newPurchaseData: Omit<CoffeePurchase, 'id' | 'receiptNumber'>
  ): CoffeePurchase => {
    const restore = captureScrollState();
    const dateCode = toLocalDateCode();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const receiptNumber = clampStr(`NT-${dateCode}-${randomSuffix}`, 64);
    const docId = makeDocId('pb');

    const numWeight = roundWeight(safeNum(newPurchaseData.weightKg));
    const numMoisture = Math.round(Math.min(100, Math.max(0, safeNum(newPurchaseData.moisturePercent))) * 10) / 10;
    const numPrice = Math.round(safeNum(newPurchaseData.buyPricePerKg));
    const numTotal = Math.round(safeNum(newPurchaseData.totalPayment)) || Math.round(numWeight * numPrice);

    const officerName = userSession
      ? clampStr(userSession.fullName || userSession.username, 120)
      : undefined;

    const newPurchase: CoffeePurchase = stripUndefined({
      id: docId,
      receiptNumber,
      farmerName: clampStr(newPurchaseData.farmerName, 150) || 'Petani',
      coffeeType: COFFEE_TYPE,
      weightKg: numWeight,
      moisturePercent: numMoisture,
      buyPricePerKg: numPrice,
      totalPayment: numTotal,
      sourceDepositId: newPurchaseData.sourceDepositId
        ? clampStr(newPurchaseData.sourceDepositId, 128)
        : undefined,
      sourceDepositNumber: newPurchaseData.sourceDepositNumber
        ? clampStr(newPurchaseData.sourceDepositNumber, 64)
        : undefined,
      date: clampStr(newPurchaseData.date || new Date().toISOString(), 64),
      notes: newPurchaseData.notes ? clampStr(newPurchaseData.notes, 500) : undefined,
      createdById: userSession?.id,
      createdByName: officerName
    });

    setPurchases((prev) =>
      prev.some((p) => p.id === newPurchase.id)
        ? prev
        : [...prev, newPurchase].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
    );

    if (userSession) {
      const path = `lapak/${LAPAK_ID}/purchases/${docId}`;
      const payload = stripUndefined({
        ...newPurchase,
        lapakId: LAPAK_ID,
        createdById: userSession.id,
        createdByName: officerName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      void setDoc(doc(db, 'lapak', LAPAK_ID, 'purchases', docId), payload).catch((err) => {
        setPurchases((prev) => prev.filter((p) => p.id !== docId));
        setDbError('Gagal menyimpan pembelian kopi ke database.');
        logFirestoreError(err, OperationType.CREATE, path);
      });
    }

    setModalState({
      isOpen: true,
      type: 'purchase',
      purchaseData: newPurchase
    });
    restore();
    return newPurchase;
  };

  const handleDeletePurchase = async (id: string) => {
    if (!userSession) return;
    const path = `lapak/${LAPAK_ID}/purchases/${id}`;
    await runPreservingScroll(async () => {
      try {
        await deleteDoc(doc(db, 'lapak', LAPAK_ID, 'purchases', id));
      } catch (err) {
        setDbError('Gagal menghapus data pembelian dari database.');
        logFirestoreError(err, OperationType.DELETE, path);
      }
    });
  };

  // 2. Add Coffee Deposit (Titip Kopi Petani)
  const handleAddDeposit = (
    newDepositData: Omit<CoffeeDeposit, 'id' | 'depositNumber' | 'remainingWeightKg' | 'status'>
  ): CoffeeDeposit => {
    const restore = captureScrollState();
    const dateCode = toLocalDateCode();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const depositNumber = clampStr(`TT-${dateCode}-${randomSuffix}`, 64);
    const docId = makeDocId('dp');

    const initialWeightKg = roundWeight(safeNum(newDepositData.initialWeightKg));
    const moisturePercent =
      Math.round(Math.min(100, Math.max(0, safeNum(newDepositData.moisturePercent))) * 10) / 10;

    const officerName = userSession
      ? clampStr(userSession.fullName || userSession.username, 120)
      : undefined;

    const newDeposit: CoffeeDeposit = stripUndefined({
      id: docId,
      depositNumber,
      farmerName: clampStr(newDepositData.farmerName, 150) || 'Petani',
      coffeeType: COFFEE_TYPE,
      initialWeightKg,
      remainingWeightKg: initialWeightKg,
      moisturePercent,
      status: 'AKTIF' as const,
      settlements: [],
      date: clampStr(newDepositData.date || new Date().toISOString(), 64),
      notes: newDepositData.notes ? clampStr(newDepositData.notes, 500) : undefined,
      createdById: userSession?.id,
      createdByName: officerName
    });

    setDeposits((prev) =>
      prev.some((d) => d.id === newDeposit.id)
        ? prev
        : [...prev, newDeposit].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
    );

    if (userSession) {
      const path = `lapak/${LAPAK_ID}/deposits/${docId}`;
      const payload = stripUndefined({
        ...newDeposit,
        lapakId: LAPAK_ID,
        createdById: userSession.id,
        createdByName: officerName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      void setDoc(doc(db, 'lapak', LAPAK_ID, 'deposits', docId), payload).catch((err) => {
        setDeposits((prev) => prev.filter((d) => d.id !== docId));
        setDbError('Gagal menyimpan data titip kopi ke database.');
        logFirestoreError(err, OperationType.CREATE, path);
      });
    }

    setModalState({
      isOpen: true,
      type: 'deposit',
      depositData: newDeposit
    });
    restore();
    return newDeposit;
  };

  // 3. Putus Harga (Partial or Full Settlement -> Atomic Purchase + Deposit Update)
  const handleSettleDeposit = async (
    deposit: CoffeeDeposit,
    settleWeightKg: number,
    pricePerKg: number
  ): Promise<CoffeePurchase> => {
    if (!userSession) {
      throw new Error('Sesi login tidak aktif.');
    }
    if (deposit.status !== 'AKTIF' || deposit.remainingWeightKg <= 0) {
      throw new Error('Titipan ini sudah selesai Putus Harga.');
    }

    const cleanSettleKg = roundWeight(settleWeightKg);
    const cleanPrice = Math.round(pricePerKg);

    if (cleanSettleKg <= 0 || cleanSettleKg > deposit.remainingWeightKg) {
      throw new Error('Berat Putus Harga tidak valid atau melebihi sisa titipan.');
    }
    if (cleanPrice <= 0) {
      throw new Error('Harga Putus Harga per kg harus lebih dari Rp. 0.');
    }

    const nowIso = new Date().toISOString();
    const dateCode = toLocalDateCode();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const receiptNumber = clampStr(`NT-${dateCode}-${randomSuffix}`, 64);
    const purchaseId = makeDocId('pb');
    const settlementId = makeDocId('st');
    const totalPayment = Math.round(cleanSettleKg * cleanPrice);

    const newRemaining = Math.max(0, roundWeight(deposit.remainingWeightKg - cleanSettleKg));
    const newStatus: 'AKTIF' | 'SELESAI' = newRemaining === 0 ? 'SELESAI' : 'AKTIF';

    const officerName = clampStr(userSession.fullName || userSession.username, 120);

    const newPurchase: CoffeePurchase = stripUndefined({
      id: purchaseId,
      receiptNumber,
      farmerName: clampStr(deposit.farmerName, 150),
      coffeeType: COFFEE_TYPE,
      weightKg: cleanSettleKg,
      moisturePercent: deposit.moisturePercent,
      buyPricePerKg: cleanPrice,
      totalPayment,
      sourceDepositId: deposit.id,
      sourceDepositNumber: deposit.depositNumber,
      date: nowIso,
      notes: deposit.notes ? clampStr(`Putus harga dari ${deposit.depositNumber} · ${deposit.notes}`, 500) : clampStr(`Putus harga dari ${deposit.depositNumber}`, 500),
      createdById: userSession.id,
      createdByName: officerName
    });

    const newSettlement: DepositSettlement = stripUndefined({
      id: settlementId,
      purchaseId,
      receiptNumber,
      settledWeightKg: cleanSettleKg,
      pricePerKg: cleanPrice,
      totalPayment,
      date: nowIso,
      settledById: userSession.id,
      settledByName: officerName
    });

    const updatedSettlements = [...(deposit.settlements || []), newSettlement];

    const purchasePayload = stripUndefined({
      ...newPurchase,
      lapakId: LAPAK_ID,
      createdById: userSession.id,
      createdByName: officerName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    const batch = writeBatch(db);
    const purchaseRef = doc(db, 'lapak', LAPAK_ID, 'purchases', purchaseId);
    const depositRef = doc(db, 'lapak', LAPAK_ID, 'deposits', deposit.id);

    batch.set(purchaseRef, purchasePayload);
    batch.update(depositRef, {
      remainingWeightKg: newRemaining,
      status: newStatus,
      settlements: updatedSettlements,
      updatedAt: serverTimestamp()
    });

    const restore = captureScrollState();
    try {
      await batch.commit();
    } catch (err) {
      setDbError('Gagal memproses Putus Harga ke database.');
      logFirestoreError(err, OperationType.WRITE, `lapak/${LAPAK_ID}/deposits/${deposit.id}`);
      throw new Error('Gagal memproses Putus Harga. Periksa koneksi Anda.');
    }

    setModalState({
      isOpen: true,
      type: 'purchase',
      purchaseData: newPurchase
    });
    restore();
    return newPurchase;
  };

  const handleDeleteDeposit = async (id: string) => {
    if (!userSession) return;
    const path = `lapak/${LAPAK_ID}/deposits/${id}`;
    await runPreservingScroll(async () => {
      try {
        await deleteDoc(doc(db, 'lapak', LAPAK_ID, 'deposits', id));
      } catch (err) {
        setDbError('Gagal menghapus data titip kopi dari database.');
        logFirestoreError(err, OperationType.DELETE, path);
      }
    });
  };

  // 4. Add Warehouse Dispatch & Weight Variance Sale
  const handleAddSale = async (newSaleData: Omit<WarehouseSale, 'id' | 'invoiceNumber'>) => {
    if (!userSession) return;
    const dateCode = toLocalDateCode();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const invoiceNumber = clampStr(`SJ-GP-${dateCode}-${randomSuffix}`, 64);
    const docId = makeDocId('sl');
    const officerName = clampStr(userSession.fullName || userSession.username, 120);

    const dispatchedWeightKg = roundWeight(safeNum(newSaleData.dispatchedWeightKg));
    if (dispatchedWeightKg <= 0 || dispatchedWeightKg > stockSummary.stockKg) {
      setDbError(
        `Berat keluar lapak (${dispatchedWeightKg} kg) tidak boleh melebihi total stok siap kirim (${stockSummary.stockKg} kg).`
      );
      return;
    }
    const warehouseWeightKg = roundWeight(safeNum(newSaleData.warehouseWeightKg));
    const weightVarianceKg = roundWeight(warehouseWeightKg - dispatchedWeightKg);
    const costPricePerKg = Math.round(safeNum(newSaleData.costPricePerKg));
    const sellPricePerKg = Math.round(safeNum(newSaleData.sellPricePerKg));
    const totalRevenue = Math.round(safeNum(newSaleData.totalRevenue)) || Math.round(warehouseWeightKg * sellPricePerKg);
    const estimatedCost = Math.round(safeNum(newSaleData.estimatedCost)) || Math.round(dispatchedWeightKg * costPricePerKg);
    const netProfit = totalRevenue - estimatedCost;
    const profitMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const newSale: WarehouseSale = stripUndefined({
      id: docId,
      invoiceNumber,
      buyerWarehouseName: clampStr(newSaleData.buyerWarehouseName, 180) || 'Gudang Pusat Kopi',
      buyerWhatsApp: newSaleData.buyerWhatsApp ? clampStr(newSaleData.buyerWhatsApp, 40) : undefined,
      buyerPhone: newSaleData.buyerPhone ? clampStr(newSaleData.buyerPhone, 40) : undefined,
      coffeeType: COFFEE_TYPE,
      dispatchedWeightKg,
      warehouseWeightKg,
      weightVarianceKg,
      costPricePerKg,
      sellPricePerKg,
      totalRevenue,
      estimatedCost,
      netProfit,
      profitMarginPercent,
      date: clampStr(newSaleData.date || new Date().toISOString(), 64),
      notes: newSaleData.notes ? clampStr(newSaleData.notes, 500) : undefined,
      paymentStatus: newSaleData.paymentStatus,
      paymentMethod: newSaleData.paymentMethod,
      dueDate: newSaleData.dueDate ? clampStr(newSaleData.dueDate, 32) : undefined,
      paidAt: newSaleData.paidAt ? clampStr(newSaleData.paidAt, 64) : undefined,
      createdById: userSession.id,
      createdByName: officerName
    });

    const payload = stripUndefined({
      ...newSale,
      lapakId: LAPAK_ID,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    const path = `lapak/${LAPAK_ID}/sales/${docId}`;
    await runPreservingScroll(async () => {
      try {
        await setDoc(doc(db, 'lapak', LAPAK_ID, 'sales', docId), payload);
        setModalState({
          isOpen: true,
          type: 'sale',
          saleData: newSale
        });
      } catch (err) {
        setDbError('Gagal menyimpan pengiriman gudang ke database.');
        logFirestoreError(err, OperationType.CREATE, path);
      }
    });
  };

  const handleMarkAsPaid = async (saleId: string) => {
    if (!userSession) return;
    const path = `lapak/${LAPAK_ID}/sales/${saleId}`;
    await runPreservingScroll(async () => {
      try {
        await updateDoc(doc(db, 'lapak', LAPAK_ID, 'sales', saleId), {
          paymentStatus: 'LUNAS',
          paidAt: clampStr(new Date().toISOString(), 64),
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        setDbError('Gagal menyimpan status pelunasan ke database.');
        logFirestoreError(err, OperationType.UPDATE, path);
      }
    });
  };

  const handleDeleteSale = async (id: string) => {
    if (!userSession) return;
    const path = `lapak/${LAPAK_ID}/sales/${id}`;
    await runPreservingScroll(async () => {
      try {
        await deleteDoc(doc(db, 'lapak', LAPAK_ID, 'sales', id));
      } catch (err) {
        setDbError('Gagal menghapus data pengiriman dari database.');
        logFirestoreError(err, OperationType.DELETE, path);
      }
    });
  };

  // User Management Handlers (Owner only)
  const handleAddUser = async (data: {
    id: string;
    fullName: string;
    role: UserRole;
    password: string;
  }) => {
    if (!userSession || userSession.role !== 'owner') {
      throw new Error('Hanya Owner (Superadmin) yang dapat menambah pengguna.');
    }

    const cleanId = clampStr(data.id, 64);
    const path = `app_users/${cleanId}`;
    const userRef = doc(db, 'app_users', cleanId);

    await runPreservingScroll(async () => {
      const existing = await getDoc(userRef);
      if (existing.exists()) {
        throw new Error(`ID Pengguna "${cleanId}" sudah terdaftar di database.`);
      }

      const salt = generateSalt();
      const passwordHash = await hashPassword(salt, data.password);

      const payload = {
        id: cleanId,
        username: cleanId,
        fullName: clampStr(data.fullName, 120),
        role: data.role,
        passwordHash,
        salt,
        isActive: true,
        createdById: userSession.id,
        createdAtDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      try {
        await setDoc(userRef, payload);
      } catch (err) {
        setDbError('Gagal menambahkan pengguna baru ke database.');
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    });
  };

  const handleUpdateUser = async (
    userId: string,
    updates: {
      fullName: string;
      role: UserRole;
      isActive: boolean;
      newPassword?: string;
    }
  ) => {
    if (!userSession || userSession.role !== 'owner') {
      throw new Error('Hanya Owner (Superadmin) yang dapat mengubah pengguna.');
    }

    const path = `app_users/${userId}`;
    const updatePayload: Record<string, unknown> = {
      fullName: clampStr(updates.fullName, 120),
      role: userId === '252500' ? 'owner' : updates.role,
      isActive: userId === '252500' ? true : updates.isActive,
      updatedAt: serverTimestamp()
    };

    await runPreservingScroll(async () => {
      if (updates.newPassword) {
        const newSalt = generateSalt();
        const newHash = await hashPassword(newSalt, updates.newPassword);
        updatePayload.salt = newSalt;
        updatePayload.passwordHash = newHash;
      }

      try {
        await updateDoc(doc(db, 'app_users', userId), updatePayload);
      } catch (err) {
        setDbError('Gagal memperbarui data pengguna di database.');
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    });
  };

  const handleDeleteUser = async (userId: string) => {
    if (!userSession || userSession.role !== 'owner') return;
    if (userId === '252500' || userId === userSession.id) return;

    const path = `app_users/${userId}`;
    await runPreservingScroll(async () => {
      try {
        await deleteDoc(doc(db, 'app_users', userId));
      } catch (err) {
        setDbError('Gagal menghapus pengguna dari database.');
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    });
  };

  // Login & Logout Handlers
  const handleLoginSuccess = (session: UserSession) => {
    safeStorageSet(SESSION_STORAGE_KEY, session.id);
    setDbError('');
    setUserSession(session);
    setActiveTab('purchases');
  };

  const handleLogout = () => {
    safeStorageRemove(SESSION_STORAGE_KEY);
    setDbError('');
    setUserSession(null);
    setPurchases([]);
    setDeposits([]);
    setSales([]);
    setAppUsers([]);
    setUserNamesById({});
    setActiveTab('purchases');
  };

  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#FAF2E8] border border-amber-200 flex items-center justify-center shadow-md mb-4">
          <CoffeeLogoIcon className="w-8 h-8" />
        </div>
        <div className="flex items-center gap-2 text-[#432818] font-semibold text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-[#5C3A21]" />
          <span>Menyiapkan database {STORE_NAME}...</span>
        </div>
      </div>
    );
  }

  if (!userSession || !userSession.isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const canManageUsers = userSession.role === 'owner';

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 flex flex-col font-sans overflow-x-clip">
      <Navbar
        user={userSession}
        onLogout={handleLogout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unpaidSalesCount={stats.unpaidCount}
        canManageUsers={canManageUsers}
      />

      <SubNavTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unpaidSalesCount={stats.unpaidCount}
        canManageUsers={canManageUsers}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 lg:pt-[22px] space-y-4 sm:space-y-6">
        {(activeTab === 'stock-and-sales' || activeTab === 'financial-report') && (
          <section aria-label="Ringkasan Statistik Gudang Kopi" className="animate-in fade-in duration-200">
            <StatCards
              activeTab={activeTab}
              totalStockKg={stats.totalStockKg}
              depositActiveKg={stats.depositActiveKg}
              depositActiveCount={stats.depositActiveCount}
              totalCapitalSpent={stats.totalCapitalSpent}
              totalRealizedRevenue={stats.totalRealizedRevenue}
              totalRealizedProfit={stats.totalRealizedProfit}
              totalVarianceKg={stats.totalVarianceKg}
              totalReceivables={stats.totalReceivables}
              unpaidCount={stats.unpaidCount}
              totalPaidRevenue={stats.totalPaidRevenue}
            />
          </section>
        )}

        <section aria-label="Bagian Kerja Manajemen Kopi">
          {activeTab === 'purchases' ? (
            <TabPurchase
              purchases={purchases}
              onAddPurchase={handleAddPurchase}
              onDeletePurchase={handleDeletePurchase}
              onViewReceipt={(item) => {
                const restore = captureScrollState();
                setModalState({
                  isOpen: true,
                  type: 'purchase',
                  purchaseData: item
                });
                restore();
              }}
            />
          ) : activeTab === 'deposits' ? (
            <TabDeposits
              deposits={deposits}
              purchases={purchases}
              onAddDeposit={handleAddDeposit}
              onSettleDeposit={handleSettleDeposit}
              onDeleteDeposit={handleDeleteDeposit}
              onViewDepositReceipt={(deposit) => {
                const restore = captureScrollState();
                setModalState({
                  isOpen: true,
                  type: 'deposit',
                  depositData: deposit
                });
                restore();
              }}
              onViewPurchaseReceipt={(purchase) => {
                const restore = captureScrollState();
                setModalState({
                  isOpen: true,
                  type: 'purchase',
                  purchaseData: purchase
                });
                restore();
              }}
            />
          ) : activeTab === 'stock-and-sales' ? (
            <TabStockAndSales
              stockSummary={stockSummary}
              sales={sales}
              onAddSale={handleAddSale}
              onViewInvoice={(sale) => {
                const restore = captureScrollState();
                setModalState({
                  isOpen: true,
                  type: 'sale',
                  saleData: sale
                });
                restore();
              }}
              onMarkAsPaid={handleMarkAsPaid}
              onDeleteSale={handleDeleteSale}
              onGoToDeposits={() => setActiveTab('deposits')}
            />
          ) : activeTab === 'financial-report' ? (
            <TabFinancialReport
              purchases={purchases}
              sales={sales}
              onViewInvoice={(sale) => {
                const restore = captureScrollState();
                setModalState({
                  isOpen: true,
                  type: 'sale',
                  saleData: sale
                });
                restore();
              }}
              onMarkAsPaid={handleMarkAsPaid}
            />
          ) : canManageUsers ? (
            <TabUsers
              users={appUsers}
              currentUserId={userSession.id}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
            />
          ) : null}
        </section>
      </main>

      <footer className="mt-auto border-t border-stone-200 bg-white py-4 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-0.5">
            <span className="font-bold text-[#432818]">{STORE_NAME}</span>
            <span aria-hidden="true">·</span>
            <span>{STORE_SUBTITLE}</span>
          </div>
          <div className="text-stone-400">
            Gudang Kopi Bijian Aktif · Tersinkronisasi Database Cloud
          </div>
        </div>
      </footer>

      {dbError && (
        <div
          role="alert"
          className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 max-w-md w-[calc(100vw-2rem)] p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-xs sm:text-sm text-rose-900 font-medium flex items-center justify-between gap-3 shadow-lg"
        >
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="break-words">{dbError}</span>
          </div>
          <button
            type="button"
            onClick={() => setDbError('')}
            className="text-xs font-bold text-rose-700 hover:text-rose-900 cursor-pointer shrink-0"
          >
            Tutup
          </button>
        </div>
      )}

      {modalState.isOpen && (
        <ReceiptModal
          type={modalState.type}
          purchaseData={modalState.purchaseData}
          depositData={modalState.depositData}
          saleData={modalState.saleData}
          officerName={(() => {
            const activeRecord =
              modalState.type === 'purchase'
                ? modalState.purchaseData
                : modalState.type === 'deposit'
                ? modalState.depositData
                : modalState.saleData;
            return (
              activeRecord?.createdByName?.trim() ||
              (activeRecord?.createdById ? userNamesById[activeRecord.createdById] : undefined) ||
              userSession.fullName
            );
          })()}
          onClose={() => {
            const restore = captureScrollState();
            blurActiveTrigger();
            setModalState({ isOpen: false, type: 'purchase' });
            restore();
          }}
        />
      )}
    </div>
  );
}
