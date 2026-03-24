'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path ? "text-concordia-gold border-b-2 border-concordia-gold pb-1" : "text-parchment/60 hover:text-parchment transition-colors";
  };

  return (
    <div className="bg-concordia-burgundy font-display text-parchment overflow-x-hidden min-h-screen pixel-cursor">
      {/* Background */}
      <div className="fixed inset-0 wood-texture z-0"></div>
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none z-0 mix-blend-overlay"></div>
      
      <div className="relative z-10 layout-container flex h-full grow flex-col">
        <header className="border-b-4 border-double border-parchment/20 px-3 sm:px-4 md:px-8 py-3 md:py-4 backdrop-blur-md bg-black/40 shadow-pixel sticky top-0 z-50">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-4 text-parchment min-w-0">
                <div className="size-8 sm:size-10 bg-concordia-burgundy flex items-center justify-center rounded-sm border-2 border-parchment/20 shadow-pixel-sm shrink-0">
                  <span className="material-symbols-outlined text-parchment text-lg sm:text-xl">inventory_2</span>
                </div>
                <div className="min-w-0">
                  <h2 className="text-parchment text-lg sm:text-xl md:text-2xl font-bold leading-tight tracking-widest uppercase drop-shadow-md font-display truncate">
                    SHER<span className="text-black">LOST</span>HOLMES
                  </h2>
                  <p className="text-[8px] sm:text-[10px] text-concordia-gold font-bold uppercase tracking-[0.16em] sm:tracking-[0.2em] font-sans truncate">Evidence Custodian</p>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3 shrink-0">
                <button className="flex items-center justify-center rounded-sm h-8 w-8 sm:h-10 sm:w-10 bg-white/5 hover:bg-white/10 text-parchment transition-all border-2 border-parchment/10 shadow-pixel-sm hover:translate-y-px hover:shadow-none">
                  <span className="material-symbols-outlined text-sm sm:text-base">search</span>
                </button>
                <button className="flex items-center justify-center rounded-sm h-8 w-8 sm:h-10 sm:w-10 bg-white/5 hover:bg-white/10 text-parchment transition-all border-2 border-parchment/10 shadow-pixel-sm hover:translate-y-px hover:shadow-none">
                  <span className="material-symbols-outlined text-sm sm:text-base">person</span>
                </button>
              </div>
            </div>

            <nav className="overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-4 sm:gap-6 w-max pr-2">
                <Link className={`text-xs sm:text-sm font-bold tracking-wider uppercase ${isActive('/admin')}`} href="/admin">
                  Dashboard
                </Link>
                <Link className={`text-xs sm:text-sm font-bold tracking-wider uppercase ${isActive('/admin/cases')}`} href="/admin/cases">
                  Cases
                </Link>
                <Link className={`text-xs sm:text-sm font-bold tracking-wider uppercase ${isActive('/admin/inventory')}`} href="/admin/inventory">
                  Evidence Ledger
                </Link>
                <Link className={`text-xs sm:text-sm font-bold tracking-wider uppercase ${isActive('/admin/lockers')}`} href="/admin/lockers">
                  Lockers
                </Link>
              </div>
            </nav>
          </div>
        </header>
        
        <main className="flex-1 px-3 sm:px-4 md:px-8 lg:px-10 py-4 sm:py-6 md:py-10 lg:py-12">
            {children}
        </main>

        {/* Decorative Corners */}
        <div className="hidden md:block fixed top-0 left-0 p-4 opacity-30 pointer-events-none z-50">
          <div className="border-t-4 border-l-4 border-parchment w-32 h-32"></div>
        </div>
        <div className="hidden md:block fixed bottom-0 right-0 p-4 opacity-30 pointer-events-none z-50">
          <div className="border-b-4 border-r-4 border-parchment w-32 h-32"></div>
        </div>
      </div>
    </div>
  );
}
