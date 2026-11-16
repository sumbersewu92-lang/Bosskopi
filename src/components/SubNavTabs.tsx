import React, { useState, useRef, useEffect } from 'react';
import { Scale, Archive, Truck, PieChart, Users, ChevronDown, Check } from 'lucide-react';

export type ActiveTab = 'purchases' | 'deposits' | 'stock-and-sales' | 'financial-report' | 'users';

interface SubNavTabsProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  unpaidSalesCount?: number;
  canManageUsers?: boolean;
}

export const SubNavTabs: React.FC<SubNavTabsProps> = ({
  activeTab,
  onTabChange,
  unpaidSalesCount = 0,
  canManageUsers = false
}) => {
  const [isPurchaseDropdownOpen, setIsPurchaseDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isPurchaseGroupActive = activeTab === 'purchases' || activeTab === 'deposits';
  const isDepositSelected = activeTab === 'deposits';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPurchaseDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPurchaseDropdownOpen(false);
      }
    };

    if (isPurchaseDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPurchaseDropdownOpen]);

  const handleSelectSubTab = (tab: 'purchases' | 'deposits') => {
    onTabChange(tab);
    setIsPurchaseDropdownOpen(false);
  };

  const tabBaseClass =
    'w-[212px] shrink-0 flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-sm leading-tight font-semibold transition-all whitespace-nowrap cursor-pointer';

  return (
    <div className="hidden lg:block bg-gradient-to-r from-[#432818] via-[#5C3A21] to-[#432818] text-white border-b border-[#331D11] shadow-xs sticky top-16 sm:top-18 z-20">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="py-2 sm:py-2.5">
          <nav
            aria-label="Navigasi Menu Gudang Kopi"
            className="flex items-center gap-2.5"
          >
            {/* Tab 1: Pembelian Petani (Dropdown: Pembelian Petani & Titip Kopi) */}
            <div className="relative w-[212px] shrink-0" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsPurchaseDropdownOpen((prev) => !prev)}
                aria-expanded={isPurchaseDropdownOpen}
                aria-haspopup="menu"
                className={`w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-sm leading-tight font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isPurchaseGroupActive
                    ? 'bg-[#FAF7F2] text-[#2D180C] shadow-md font-bold'
                    : 'text-amber-50 hover:text-white hover:bg-[#2D180C]/45'
                }`}
              >
                {isDepositSelected ? (
                  <Archive className={`w-4 h-4 shrink-0 ${isPurchaseGroupActive ? 'text-[#5C3A21]' : 'text-amber-200'}`} />
                ) : (
                  <Scale className={`w-4 h-4 shrink-0 ${isPurchaseGroupActive ? 'text-[#5C3A21]' : 'text-amber-200'}`} />
                )}
                <span>{isDepositSelected ? 'Titip Kopi' : 'Pembelian Petani'}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                    isPurchaseDropdownOpen ? 'rotate-180' : ''
                  } ${isPurchaseGroupActive ? 'text-[#5C3A21]' : 'text-amber-200'}`}
                />
              </button>

              {isPurchaseDropdownOpen && (
                <div
                  role="menu"
                  aria-label="Pilih mode pembelian atau titip kopi"
                  className="absolute left-0 right-0 top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-stone-200 p-1.5 space-y-1 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleSelectSubTab('purchases')}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer text-left ${
                      activeTab === 'purchases'
                        ? 'bg-[#432818] text-white shadow-xs font-bold'
                        : 'text-stone-700 hover:bg-amber-50 hover:text-[#432818]'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Scale className={`w-4 h-4 shrink-0 ${activeTab === 'purchases' ? 'text-amber-300' : 'text-[#5C3A21]'}`} />
                      <span className="truncate">Pembelian Petani</span>
                    </span>
                    {activeTab === 'purchases' && (
                      <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleSelectSubTab('deposits')}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer text-left ${
                      activeTab === 'deposits'
                        ? 'bg-[#432818] text-white shadow-xs font-bold'
                        : 'text-stone-700 hover:bg-amber-50 hover:text-[#432818]'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Archive className={`w-4 h-4 shrink-0 ${activeTab === 'deposits' ? 'text-amber-300' : 'text-[#5C3A21]'}`} />
                      <span className="truncate">Titip Kopi</span>
                    </span>
                    {activeTab === 'deposits' && (
                      <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Tab 2: Stok & Pengiriman */}
            <div className="relative inline-flex w-[212px] shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsPurchaseDropdownOpen(false);
                  onTabChange('stock-and-sales');
                }}
                className={`w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-sm leading-tight font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'stock-and-sales'
                    ? 'bg-[#FAF7F2] text-[#2D180C] shadow-md font-bold'
                    : 'text-amber-50 hover:text-white hover:bg-[#2D180C]/45'
                }`}
              >
                <Truck className={`w-4 h-4 shrink-0 ${activeTab === 'stock-and-sales' ? 'text-[#5C3A21]' : 'text-amber-200'}`} />
                <span>Stok &amp; Pengiriman</span>
              </button>

              {unpaidSalesCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 bg-amber-400 text-[#2D180C] font-extrabold text-[10px] font-mono rounded-full flex items-center justify-center border-2 border-[#432818] shadow-sm animate-in zoom-in duration-150 pointer-events-none"
                  title={`${unpaidSalesCount} transaksi pengiriman masih menunggu pelunasan (piutang)`}
                >
                  {unpaidSalesCount}
                </span>
              )}
            </div>

            {/* Tab 3: Laporan Keuangan */}
            <button
              type="button"
              onClick={() => {
                setIsPurchaseDropdownOpen(false);
                onTabChange('financial-report');
              }}
              className={`${tabBaseClass} ${
                activeTab === 'financial-report'
                  ? 'bg-[#FAF7F2] text-[#2D180C] shadow-md font-bold'
                  : 'text-amber-50 hover:text-white hover:bg-[#2D180C]/45'
              }`}
            >
              <PieChart className={`w-4 h-4 shrink-0 ${activeTab === 'financial-report' ? 'text-[#5C3A21]' : 'text-amber-200'}`} />
              <span>Laporan Keuangan</span>
            </button>

            {/* Tab 4: Kelola Pengguna (Owner / Superadmin only) */}
            {canManageUsers && (
              <button
                type="button"
                onClick={() => {
                  setIsPurchaseDropdownOpen(false);
                  onTabChange('users');
                }}
                className={`${tabBaseClass} ${
                  activeTab === 'users'
                    ? 'bg-[#FAF7F2] text-[#2D180C] shadow-md font-bold'
                    : 'text-amber-50 hover:text-white hover:bg-[#2D180C]/45'
                }`}
              >
                <Users className={`w-4 h-4 shrink-0 ${activeTab === 'users' ? 'text-[#5C3A21]' : 'text-amber-200'}`} />
                <span>Kelola Pengguna</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
};

