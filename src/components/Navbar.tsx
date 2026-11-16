import React, { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown, User, Store, Menu, X, Scale, Archive, Truck, PieChart, Users, Check } from 'lucide-react';
import { UserSession } from '../types/coffee';
import { STORE_NAME, STORE_SUBTITLE } from '../data/initialData';
import { ActiveTab } from './SubNavTabs';
import { CoffeeLogoIcon } from './CoffeeLogoIcon';
import { captureScrollState } from '../utils/scrollPreservation';

interface NavbarProps {
  user: UserSession;
  onLogout: () => void;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  unpaidSalesCount?: number;
  canManageUsers?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  activeTab,
  onTabChange,
  unpaidSalesCount = 0,
  canManageUsers = false
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobilePurchaseMenuOpen, setIsMobilePurchaseMenuOpen] = useState(
    activeTab === 'purchases' || activeTab === 'deposits'
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      const restore = captureScrollState();
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
      restore();
    } else {
      const restore = captureScrollState();
      document.body.style.overflow = '';
      restore();
    }

    window.addEventListener('resize', handleResize);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [isSidebarOpen]);

  const handleSelectTab = (tab: ActiveTab) => {
    onTabChange(tab);
    setIsSidebarOpen(false);
  };

  const isPurchaseGroupActive = activeTab === 'purchases' || activeTab === 'deposits';
  const totalPendingBadges = unpaidSalesCount;

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18 gap-2 sm:gap-3">
            {/* Left Zone: Mobile/Tablet 3-Line Button + Brand */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Buka menu navigasi"
                aria-expanded={isSidebarOpen}
                className="lg:hidden relative p-2 rounded-xl border border-stone-200 bg-amber-50/50 hover:bg-amber-100/70 hover:border-amber-300 text-stone-700 hover:text-[#432818] transition cursor-pointer shrink-0"
                title="Buka menu"
              >
                <Menu className="w-5 h-5" />
                {totalPendingBadges > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-amber-400 text-[#2D180C] font-extrabold text-[10px] font-mono rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                    {totalPendingBadges}
                  </span>
                )}
              </button>

              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#FAF2E8] border border-amber-200/90 flex items-center justify-center shadow-xs shrink-0">
                <CoffeeLogoIcon className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-xl font-bold tracking-tight text-stone-900 truncate">
                    {STORE_NAME}
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-semibold text-[#5C3A21] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                    Gudang Kopi Bijian
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 hidden sm:block truncate">
                  {STORE_SUBTITLE}
                </p>
              </div>
            </div>

            {/* Desktop User Profile Zone (>= lg) */}
            <div className="hidden lg:block relative shrink-0" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(prev => !prev)}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-stone-200 hover:border-amber-300 bg-stone-50/70 hover:bg-amber-50/60 transition-all cursor-pointer group w-full"
                title="Klik untuk membuka menu profil"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 text-[#5C3A21] border border-amber-300 flex items-center justify-center shrink-0 group-hover:bg-amber-200/70 transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-stone-800 group-hover:text-[#432818] max-w-[180px] truncate">
                  {user.fullName}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-stone-400 group-hover:text-[#5C3A21] transition-transform duration-200 shrink-0 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Profile Dropdown Menu — exact same width as parent trigger */}
              {isDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 w-full bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3 bg-gradient-to-br from-amber-50/80 via-white to-stone-50 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-[#5C3A21] border border-amber-300 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-stone-900 truncate">
                          {user.fullName}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-amber-100/80 text-[11px] text-stone-600">
                      <div className="flex items-center gap-1.5 text-stone-600 min-w-0">
                        <Store className="w-3.5 h-3.5 text-[#5C3A21] shrink-0" />
                        <span className="font-medium leading-snug truncate" title={user.roleLabel}>
                          {user.roleLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer text-left"
                      title="Keluar dari akun"
                    >
                      <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="truncate">Keluar dari Akun</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile & Tablet Slide-Over Sidebar Drawer (< lg) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Menu Navigasi Gudang Kopi"
        >
          <div
            className="fixed inset-0 bg-stone-900/55 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setIsSidebarOpen(false)}
          />

          <aside className="relative z-10 w-72 max-w-[85vw] h-full bg-white shadow-2xl border-r border-stone-200 flex flex-col justify-between animate-in slide-in-from-left duration-200">
            <div>
              {/* Sidebar Brand Header */}
              <div className="px-4 py-4 bg-gradient-to-r from-[#432818] via-[#5C3A21] to-[#432818] text-white flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#FAF2E8] flex items-center justify-center border border-amber-200/70 shrink-0">
                    <CoffeeLogoIcon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold tracking-tight block truncate">
                      {STORE_NAME}
                    </span>
                    <span className="text-[10px] text-amber-200 block truncate">
                      Gudang Kopi Bijian
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  aria-label="Tutup menu navigasi"
                  className="p-1.5 rounded-lg text-amber-100 hover:text-white hover:bg-[#2D180C]/60 transition cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Menu Items */}
              <nav className="p-3 space-y-1.5" aria-label="Navigasi Sidebar">
                <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                  Menu Utama
                </span>

                <div className="w-full space-y-1">
                  <button
                    type="button"
                    onClick={() => setIsMobilePurchaseMenuOpen((prev) => !prev)}
                    aria-expanded={isMobilePurchaseMenuOpen}
                    className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer text-left ${
                      isPurchaseGroupActive
                        ? 'bg-[#432818] text-white shadow-sm'
                        : 'text-stone-700 hover:bg-amber-50 hover:text-[#432818]'
                    }`}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      {activeTab === 'deposits' ? (
                        <Archive className={`w-4 h-4 shrink-0 ${isPurchaseGroupActive ? 'text-amber-300' : 'text-[#5C3A21]'}`} />
                      ) : (
                        <Scale className={`w-4 h-4 shrink-0 ${isPurchaseGroupActive ? 'text-amber-300' : 'text-[#5C3A21]'}`} />
                      )}
                      <span className="truncate">
                        {activeTab === 'deposits' ? 'Titip Kopi' : 'Pembelian Petani'}
                      </span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                        isMobilePurchaseMenuOpen ? 'rotate-180' : ''
                      } ${isPurchaseGroupActive ? 'text-amber-300' : 'text-stone-400'}`}
                    />
                  </button>

                  {isMobilePurchaseMenuOpen && (
                    <div className="w-full bg-stone-50 border border-stone-200 rounded-xl p-1.5 space-y-1">
                      <button
                        type="button"
                        onClick={() => handleSelectTab('purchases')}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer text-left ${
                          activeTab === 'purchases'
                            ? 'bg-amber-100 text-[#432818] font-bold'
                            : 'text-stone-700 hover:bg-white hover:text-[#432818]'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <Scale className="w-3.5 h-3.5 shrink-0 text-[#5C3A21]" />
                          <span className="truncate">Pembelian Petani</span>
                        </span>
                        {activeTab === 'purchases' && (
                          <Check className="w-3.5 h-3.5 text-[#5C3A21] shrink-0" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectTab('deposits')}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer text-left ${
                          activeTab === 'deposits'
                            ? 'bg-amber-100 text-[#432818] font-bold'
                            : 'text-stone-700 hover:bg-white hover:text-[#432818]'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <Archive className="w-3.5 h-3.5 shrink-0 text-[#5C3A21]" />
                          <span className="truncate">Titip Kopi</span>
                        </span>
                        {activeTab === 'deposits' && (
                          <Check className="w-3.5 h-3.5 text-[#5C3A21] shrink-0" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectTab('stock-and-sales')}
                  className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer text-left ${
                    activeTab === 'stock-and-sales'
                      ? 'bg-[#432818] text-white shadow-sm'
                      : 'text-stone-700 hover:bg-amber-50 hover:text-[#432818]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Truck className={`w-4 h-4 shrink-0 ${activeTab === 'stock-and-sales' ? 'text-amber-300' : 'text-[#5C3A21]'}`} />
                    <span className="truncate">Stok &amp; Pengiriman</span>
                  </div>
                  {unpaidSalesCount > 0 && (
                    <span
                      className="min-w-[20px] h-5 px-1.5 bg-amber-400 text-[#2D180C] font-extrabold text-[10px] font-mono rounded-full flex items-center justify-center shrink-0"
                      title={`${unpaidSalesCount} transaksi belum lunas`}
                    >
                      {unpaidSalesCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('financial-report')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer text-left ${
                    activeTab === 'financial-report'
                      ? 'bg-[#432818] text-white shadow-sm'
                      : 'text-stone-700 hover:bg-amber-50 hover:text-[#432818]'
                  }`}
                >
                  <PieChart className={`w-4 h-4 shrink-0 ${activeTab === 'financial-report' ? 'text-amber-300' : 'text-[#5C3A21]'}`} />
                  <span className="truncate">Laporan Keuangan</span>
                </button>

                {canManageUsers && (
                  <button
                    type="button"
                    onClick={() => handleSelectTab('users')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer text-left ${
                      activeTab === 'users'
                        ? 'bg-[#432818] text-white shadow-sm'
                        : 'text-stone-700 hover:bg-amber-50 hover:text-[#432818]'
                    }`}
                  >
                    <Users className={`w-4 h-4 shrink-0 ${activeTab === 'users' ? 'text-amber-300' : 'text-[#5C3A21]'}`} />
                    <span className="truncate">Kelola Pengguna</span>
                  </button>
                )}
              </nav>
            </div>

            {/* Sidebar Bottom User Info & Logout */}
            <div className="border-t border-stone-200 bg-stone-50/80 p-3.5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-100 text-[#5C3A21] border border-amber-300 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-stone-900 truncate">
                    {user.fullName}
                  </p>
                  <p className="text-[11px] text-stone-600 truncate">
                    {user.roleLabel}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsSidebarOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl transition cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Keluar dari Akun</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
