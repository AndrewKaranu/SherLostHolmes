'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path ? "text-concordia-gold border-b-2 border-concordia-gold pb-1" : "text-parchment/60 hover:text-parchment transition-colors";
  };

  return (
    <div className="bg-concordia-burgundy font-display text-parchment overflow-x-hidden min-h-screen pixel-cursor">
      {/* Background - Reusing consistent texture approach */}
      <div className="fixed inset-0 wood-texture z-0"></div>
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none z-0 mix-blend-overlay"></div>
      
      {/* Pixelated decorative bottom (optional, matching homepage style) */}
      <div className="fixed bottom-0 left-0 w-full h-32 z-0 pointer-events-none opacity-20 flex items-end justify-center">
         {/* We can use the layout from GameLayout for consistency if desired, or keep it simple */}
      </div>

      <div className="relative z-10 layout-container flex h-full grow flex-col">
        <header className="flex items-center justify-between whitespace-nowrap border-b-4 border-double border-parchment/20 px-10 py-4 backdrop-blur-md bg-black/40 shadow-pixel">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4 text-parchment">
              <div className="size-10 bg-concordia-burgundy flex items-center justify-center rounded-sm border-2 border-parchment/20 shadow-pixel-sm">
                <span className="material-symbols-outlined text-parchment text-xl">inventory_2</span>
              </div>
              <div>
                <h2 className="text-parchment text-xl md:text-2xl font-bold leading-tight tracking-widest uppercase drop-shadow-md font-display">
                  SHER<span className="text-black">LOST</span>HOLMES
                </h2>
                <p className="text-[10px] text-concordia-gold font-bold uppercase tracking-[0.2em] font-sans">Evidence Custodian</p>
              </div>
            </div>
            <div className="flex items-center gap-8 ml-8">
              <Link className={`text-sm font-bold tracking-wider uppercase ${isActive('/admin')}`} href="/admin">
                Investigation
              </Link>
              <Link className={`text-sm font-bold tracking-wider uppercase ${isActive('/admin/inventory')}`} href="/admin/inventory">
                Evidence Ledger
              </Link>
              <Link className="text-parchment/60 text-sm font-bold tracking-wider uppercase hover:text-parchment transition-colors" href="#">
                Lockers
              </Link>
            </div>
          </div>
          
          <div className="flex flex-1 justify-end gap-6 items-center">
            <div className="flex gap-3">
              <button className="flex items-center justify-center rounded-sm h-10 w-10 bg-white/5 hover:bg-white/10 text-parchment transition-all border-2 border-parchment/10 shadow-pixel-sm hover:translate-y-px hover:shadow-none">
                <span className="material-symbols-outlined">search</span>
              </button>
              <button className="flex items-center justify-center rounded-sm h-10 w-10 bg-white/5 hover:bg-white/10 text-parchment transition-all border-2 border-parchment/10 shadow-pixel-sm hover:translate-y-px hover:shadow-none">
                <span className="material-symbols-outlined">person</span>
              </button>
            </div>
          </div>
        </header>
        
        <main className="flex-1 px-10 py-12">
            {children}
        </main>

        {/* Decorative Corners matching GameLayout vibe */}
        <div className="fixed top-0 left-0 p-4 opacity-30 pointer-events-none">
          <div className="border-t-4 border-l-4 border-parchment w-32 h-32"></div>
        </div>
        <div className="fixed bottom-0 right-0 p-4 opacity-30 pointer-events-none">
          <div className="border-b-4 border-r-4 border-parchment w-32 h-32"></div>
        </div>
      </div>
    </div>
  );
}
