'use client';

import { ReactNode } from 'react';
import Image from 'next/image';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Textures (Matching Admin) */}
        <div className="absolute inset-0 wood-texture -z-20"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none -z-10 mix-blend-overlay"></div>
        
        {/* Decorative corner elements */}
        <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-parchment/20 rounded-tl-3xl m-8 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-parchment/20 rounded-br-3xl m-8 pointer-events-none"></div>

        <div className="w-full max-w-md flex flex-col items-center relative z-10">
            {/* Header / Logo */}
            <div className="mb-8 text-center animate-in slide-in-from-top-4 duration-700">
                <div className="inline-block p-4 bg-black/20 backdrop-blur-sm rounded-lg border-2 border-parchment/10 mb-4 shadow-pixel">
                    <span className="material-symbols-outlined text-concordia-gold text-5xl drop-shadow-md">local_police</span>
                </div>
                <h1 className="text-4xl md:text-5xl text-parchment tracking-widest uppercase drop-shadow-[4px_4px_0_rgba(0,0,0,0.8)] font-display mb-2">
                    Sher<span className="text-concordia-gold">LOST</span>Holmes
                </h1>
                <p className="text-parchment/60 font-mono text-sm uppercase tracking-[0.2em] bg-black/30 px-4 py-1 rounded-full inline-block">
                    Concordia Bureau of Missing Items
                </p>
            </div>

            {/* Main Card */}
            <div className="w-full bg-parchment text-desk-wood p-1 rounded-sm shadow-pixel border-4 border-wood-dark relative">
                {/* Visual "Clip" at top */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-6 bg-wood-face rounded-sm border-2 border-wood-dark shadow-sm z-20 flex items-center justify-center">
                    <div className="w-24 h-1 bg-black/10 rounded-full"></div>
                </div>

                <div className="bg-white/50 border-2 border-dashed border-wood-dark/20 p-8 pt-10">
                    {(title || subtitle) && (
                        <div className="text-center mb-6 border-b-2 border-wood-dark/10 pb-4">
                            {title && <h2 className="text-2xl font-bold font-display uppercase tracking-wide text-wood-dark">{title}</h2>}
                            {subtitle && <p className="text-concordia-burgundy font-bold text-sm uppercase tracking-wider mt-1">{subtitle}</p>}
                        </div>
                    )}
                    
                    {children}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-parchment/40 text-xs font-mono uppercase">
                <p>Secure Access Terminal v2.4</p>
                <p>Authorized Personnel Only</p>
            </div>
        </div>
    </div>
  );
}
