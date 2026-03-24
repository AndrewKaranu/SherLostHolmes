'use client';
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, SignOutButton } from '@clerk/nextjs';

interface GameLayoutProps {
  children: ReactNode;
}

export default function GameLayout({ children }: GameLayoutProps) {
  const router = useRouter();
  const { isSignedIn, user } = useUser();

  // Get student ID and name from user metadata
  const studentId = user?.unsafeMetadata?.studentId as string | undefined;
  const userName = user?.firstName || user?.username || 'Detective';

  // Handle Sherlock image click - navigate to admin password page if signed in
  const handleSherlockClick = () => {
    if (isSignedIn) {
      router.push('/admin-password');
    }
  };

  return (
    <main className="font-display min-h-screen flex flex-col pixel-cursor overflow-x-hidden relative">
      {/* Background - Day mode only */}
      <div className="absolute inset-0 bg-concordia-day -z-20"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none -z-10 mix-blend-overlay"></div>
      
      {/* Background Image - Mobile */}
      <div className="absolute inset-x-0 bottom-0 h-[32vh] sm:hidden pointer-events-none -z-10 flex items-end justify-center overflow-hidden">
        <img
          src="/concordia_bg_mobile.png"
          alt="Concordia Campus"
          className="w-full h-full object-cover object-bottom"
        />
      </div>

      {/* Background Image - Desktop split and separated */}
      <div className="hidden sm:flex absolute inset-x-0 bottom-0 h-[48vh] sm:h-3/4 pointer-events-none -z-10 justify-center items-end">
        <div className="relative h-full w-full flex justify-center items-end">
          {/* Left Building */}
          <img 
            src="/concordia_bg.png" 
            alt="Concordia Left" 
            className="h-full w-auto object-contain absolute bottom-0 left-1/2"
            style={{ 
              clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)',
              transform: 'translateX(calc(-50% - clamp(60px, 12vw, 200px)))' 
            }}
          />
          {/* Right Building */}
          <div className="absolute bottom-0 left-1/2 h-full w-auto" style={{ transform: 'translateX(calc(-50% + clamp(60px, 12vw, 200px)))' }}>
            <img 
              src="/concordia_bg.png" 
              alt="Concordia Right" 
              className="h-full w-auto object-contain"
              style={{ 
                clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Lamps */}
      <div className="absolute top-1/3 left-10 w-2 h-32 bg-wood-dark hidden md:block border-l-2 border-white/10">
        <div className="absolute -top-4 -left-3 w-8 h-12 bg-primary-dark/80 border-2 border-black">
          <div className="absolute inset-2 bg-primary rounded-full blur-md lamp-glow"></div>
          <div className="absolute inset-3 bg-white rounded-full opacity-50"></div>
        </div>
      </div>
      <div className="absolute top-1/3 right-10 w-2 h-32 bg-wood-dark hidden md:block border-l-2 border-white/10">
        <div className="absolute -top-4 -left-3 w-8 h-12 bg-primary-dark/80 border-2 border-black">
          <div className="absolute inset-2 bg-primary rounded-full blur-md lamp-glow" style={{ animationDelay: '1s' }}></div>
          <div className="absolute inset-3 bg-white rounded-full opacity-50"></div>
        </div>
      </div>

      {/* Header */}
      <header className="pt-5 md:pt-16 pb-4 text-center relative z-10 px-3 sm:px-4">
        <div className="inline-block relative group cursor-pointer">
          <h1 className="text-[2rem] sm:text-4xl md:text-5xl lg:text-6xl text-primary tracking-widest uppercase drop-shadow-[4px_4px_0_rgba(0,0,0,0.8)] font-display">
            Sher<span className="text-black">LOST</span>Holmes
          </h1>
          <div className="hidden sm:block absolute -right-12 -top-6 text-4xl transform rotate-12 opacity-80 group-hover:scale-110 transition-transform">
            🔍
          </div>
          <p className="mt-2 text-sm md:text-lg text-stone-700 font-bold bg-background-light/90 inline-block px-3 md:px-4 py-1 border-2 border-primary pixel-cursor shadow-pixel-sm">
            EST. 1887 • CONCORDIA LOST & FOUND
          </p>

          {/* Mobile mascot */}
          <div
            className={`sm:hidden mt-3 flex justify-center ${isSignedIn ? 'cursor-pointer active:scale-95 transition-transform' : 'pointer-events-none'}`}
            onClick={handleSherlockClick}
            title={isSignedIn ? 'Access Admin Panel' : undefined}
          >
            <img
              src="/sherlock_fullOnConcordia.png"
              alt="Sherlock Holmes"
              className="w-24 h-auto drop-shadow-lg"
            />
          </div>

          {/* Sherlock Standing Next to "S" - hidden on mobile to prevent overflow */}
          <div
            className={`hidden md:block absolute right-full -mr-16 -top-8 w-48 lg:w-64 z-50 ${isSignedIn ? 'cursor-pointer hover:scale-105 transition-transform' : 'pointer-events-none'}`}
            onClick={handleSherlockClick}
            title={isSignedIn ? 'Access Admin Panel' : undefined}
          >
             <img
                src="/sherlock_fullOnConcordia.png"
                alt="Sherlock Holmes"
                className="w-full h-auto drop-shadow-xl"
              />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center justify-start pt-1 sm:pt-4 relative z-10 w-full max-w-[22rem] sm:max-w-md md:max-w-lg mx-auto">
        {/* Top Chains */}
        <div className="w-full flex justify-between px-10 sm:px-16 -mb-3 sm:-mb-4 relative z-20">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-800 border-2 border-gray-600 rounded-full shadow-lg"></div>
            <div className="w-1.5 sm:w-2 h-12 sm:h-16 bg-chain border-x-2 border-black/30"></div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-800 border-2 border-gray-600 rounded-full shadow-lg"></div>
            <div className="w-1.5 sm:w-2 h-12 sm:h-16 bg-chain border-x-2 border-black/30"></div>
          </div>
        </div>

        {/* Content passed from parent */}
        {children}

      </main>

      {/* Footer */}
      <footer className="w-full border-t-4 border-primary-dark bg-stone-800 text-white p-2 relative z-20">
        <div className="container mx-auto px-1 sm:px-0 flex flex-col md:flex-row justify-between items-center text-xs sm:text-sm md:text-base font-bold tracking-wide gap-1 md:gap-0">
          <div className="flex items-center space-x-3 md:space-x-4 mb-1 md:mb-0">
            <div className="flex items-center text-primary">
              <span className="material-symbols-outlined mr-1 text-base">person</span>
              <span>{isSignedIn && studentId ? studentId : '[Student_ID]'}</span>
            </div>
            <div className="h-4 w-0.5 bg-gray-500"></div>
            <div className="text-gray-300">
                Montreal, 1888
            </div>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            {isSignedIn ? (
              <>
                <div className="flex items-center text-accent-gold">
                  <span className="material-symbols-outlined mr-1">badge</span>
                  <span>Detective {userName}</span>
                </div>
                <div className="h-4 w-0.5 bg-gray-500"></div>
                <SignOutButton>
                  <button className="hover:text-primary flex items-center transition-colors text-gray-300">
                    <span className="material-symbols-outlined mr-1">logout</span>
                    Sign Out
                  </button>
                </SignOutButton>
              </>
            ) : (
              <div className="text-gray-300">
                <span className="material-symbols-outlined mr-1">mystery</span>
                Guest Detective
              </div>
            )}
          </div>
        </div>
        
        {/* News Ticker */}
        <div className="w-full bg-black text-primary text-sm sm:text-base overflow-hidden whitespace-nowrap border-t-2 border-gray-700 mt-2">
          <div className="inline-block animate-[marquee_20s_linear_infinite] px-4">
            +++ BREAKING NEWS: THE CHANCELLOR&apos;S GAVEL IS MISSING +++ STINGERS MASCOT SPOTTED IN LIBRARY +++ EXAM SEASON FOG RISING +++ DETECTIVE NEEDED AT 1455 DE MAISONNEUVE W +++ 
          </div>
        </div>
      </footer>
    </main>
  );
}
