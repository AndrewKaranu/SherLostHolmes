'use client';

import React from 'react';

export default function LuckyFind() {
  return (
    <div className="bg-background-light min-h-screen flex flex-col font-handwriting text-gray-800 transition-colors duration-300">
      <style jsx global>{`
        .pixel-border {
            border-style: solid;
            border-width: 4px;
        }
        .pixel-text {
            text-shadow: 2px 2px 0px rgba(0,0,0,0.3);
        }
        .scanlines {
            background: linear-gradient(
                to bottom,
                rgba(255,255,255,0),
                rgba(255,255,255,0) 50%,
                rgba(0,0,0,0.1) 50%,
                rgba(0,0,0,0.1)
            );
            background-size: 100% 4px;
        }
        .bulb-glow {
            box-shadow: 0 0 15px 5px rgba(255, 215, 0, 0.6);
        }
        /* Override primary color to match app */
        :root {
            --color-primary: #912338;
            --color-primary-dark: #631726;
        }
      `}</style>

      {/* Navbar matching Evidence Board */}
      <nav className="fixed top-0 w-full z-50 px-4 py-3 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-between items-start pointer-events-auto">
          <div className="bg-wood-dark border-4 border-ink p-2 shadow-pixel text-paper-light flex items-center gap-4">
            <div className="flex flex-col">
              <span className="font-display text-xs text-accent-gold mb-1">SHERLOST HOLMES</span>
              <div className="flex items-center gap-2 text-xl leading-none">
                <span className="material-icons text-green-400 text-base">casino</span>
                <span>LVL: GAMBLER</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <button className="bg-wood-dark border-4 border-ink p-2 shadow-pixel text-paper-light hover:translate-y-1 hover:shadow-none transition-transform active:bg-primary-dark">
              <span className="material-icons">settings</span>
            </button>
            <button className="bg-wood-dark border-4 border-ink p-2 shadow-pixel text-paper-light hover:translate-y-1 hover:shadow-none transition-transform active:bg-primary-dark">
              <span className="material-icons">inventory_2</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow flex flex-col items-center justify-center pt-24 pb-12 px-4 md:p-8 relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
            <div className="absolute inset-0 bg-concordia-day -z-20"></div>
            <div className="absolute top-20 left-10 transform -rotate-12">
            <span className="material-icons text-9xl text-wood-dark opacity-10">fingerprint</span>
            </div>
            <div className="absolute bottom-20 right-10 transform rotate-12">
            <span className="material-icons text-9xl text-wood-dark opacity-10">policy</span>
            </div>
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
            <div className="text-center mb-8 bg-paper-light border-4 border-ink p-4 shadow-pixel-lg rotate-1">
                <h2 className="font-display text-2xl md:text-3xl text-primary mb-2 uppercase tracking-wide">The Case of the Overdue Item</h2>
                <p className="max-w-xl mx-auto text-sm md:text-base text-gray-700 font-handwriting">
                    Unclaimed items from the Concordia Lost &amp; Found enter the archives after 90 days. 
                    Spin the lucky reels to give these forgotten artifacts a new home!
                </p>
            </div>

            <div className="relative flex items-end justify-center perspective-1000">
                {/* Slot Machine Body - Sherlock Edition */}
                <div className="bg-gradient-to-b from-[#2c1e14] via-[#4e342e] to-[#1a0f0a] border-[8px] border-[#2d1b12] rounded-t-3xl rounded-b-lg shadow-[0_20px_50px_rgba(0,0,0,0.7)] w-[340px] md:w-[500px] flex flex-col items-center relative z-20 overflow-visible bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')]">
                    
                    {/* Decorative Top Crest - Detective Hat */}
                    <div className="absolute -top-16 w-48 h-18 bg-[#1a0f0a] rounded-t-full border-8 border-double border-[#8d6e63] z-0 flex items-center justify-center shadow-lg pt-2">
                        <span className="text-5xl filter drop-shadow-md opacity-90">🕵️</span>
                    </div>

                    {/* Lights Top - Gaslight Style */}
                    <div className="absolute -top-3 w-full flex justify-center gap-4 md:gap-8 px-8 z-10">
                        <div className="w-6 h-6 rounded-full bg-amber-600 border-2 border-[#544] shadow-[0_0_15px_rgba(255,140,0,0.8)] animate-pulse"></div>
                        <div className="w-6 h-6 rounded-full bg-yellow-100 border-2 border-[#544] shadow-[0_0_15px_rgba(255,255,200,0.6)]"></div>
                        <div className="w-6 h-6 rounded-full bg-amber-600 border-2 border-[#544] shadow-[0_0_15px_rgba(255,140,0,0.8)] animate-pulse"></div>
                        <div className="w-6 h-6 rounded-full bg-yellow-100 border-2 border-[#544] shadow-[0_0_15px_rgba(255,255,200,0.6)]"></div>
                        <div className="w-6 h-6 rounded-full bg-amber-600 border-2 border-[#544] shadow-[0_0_15px_rgba(255,140,0,0.8)] animate-pulse"></div>
                    </div>

                    {/* Title Plate */}
                    <div className="mt-10 mb-6 bg-[#0f0a08] border-4 border-[#8d6e63] px-6 py-2 transform -skew-x-6 shadow-[0_4px_0_rgba(0,0,0,0.5)] relative group">
                        <div className="absolute inset-0 bg-yellow-900/10 skew-x-12 animate-pulse"></div>
                        <h3 className="font-display text-2xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 text-center tracking-widest drop-shadow-sm font-serif">
                            THE GAME IS AFOOT
                        </h3>
                    </div>

                    {/* Reel Window Frame - Brass & Leather */}
                    <div className="bg-gradient-to-br from-[#8d6e63] via-[#bcaaa4] to-[#5d4037] p-2 rounded-lg shadow-xl mb-6 w-11/12 relative">
                        {/* Metallic Glare on Frame */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none rounded-lg z-10"></div>
                        
                        <div className="bg-[#1a120b] p-4 md:p-6 rounded border-4 border-[#3e2723] inset-shadow-lg relative overflow-hidden">
                            
                            {/* Glass Reflection Overlay */}
                            <div className="absolute top-0 right-0 w-full h-1/3 bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-30 transform skew-y-3"></div>
                            <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-white/5 to-transparent pointer-events-none z-30 transform -skew-y-3"></div>

                            {/* Payline - Magnifying Glass Style */}
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-800/80 z-40 pointer-events-none shadow-[0_0_5px_rgba(255,0,0,0.5)]"></div>
                            <div className="absolute top-1/2 -left-4 transform -translate-y-1/2 z-50 text-2xl text-amber-500">🔍</div>
                            <div className="absolute top-1/2 -right-4 transform -translate-y-1/2 z-50 text-2xl text-amber-500 scale-x-[-1]">🔍</div>
                            
                            <div className="flex gap-2 md:gap-4 justify-center">
                                {/* Reel 1 - Parchment Style */}
                                <div className="bg-[#e8e4c9] opacity-90 border-x-2 border-[#5d4037] w-20 h-28 md:w-32 md:h-40 overflow-hidden relative rounded-sm shadow-[inset_0_0_20px_rgba(62,39,35,0.6)]">
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] opacity-50 z-0"></div>
                                    <div className="flex flex-col items-center justify-center h-full animate-bounce relative z-10">
                                        <span className="text-4xl md:text-6xl filter drop-shadow-sm sepia">🎻</span>
                                        <span className="font-display text-xs text-[#3e2723] mt-2 font-bold tracking-widest font-serif">VIOLIN</span>
                                    </div>
                                </div>
                                {/* Reel 2 - Parchment Style */}
                                <div className="bg-[#e8e4c9] opacity-90 border-x-2 border-[#5d4037] w-20 h-28 md:w-32 md:h-40 overflow-hidden relative rounded-sm shadow-[inset_0_0_20px_rgba(62,39,35,0.6)]">
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] opacity-50 z-0"></div>
                                    <div className="flex flex-col items-center justify-center h-full relative z-10">
                                        <span className="text-4xl md:text-6xl filter drop-shadow-sm sepia">📜</span>
                                        <span className="font-display text-xs text-[#3e2723] mt-2 font-bold tracking-widest font-serif">NOTES</span>
                                    </div>
                                </div>
                                {/* Reel 3 - Parchment Style */}
                                <div className="bg-[#e8e4c9] opacity-90 border-x-2 border-[#5d4037] w-20 h-28 md:w-32 md:h-40 overflow-hidden relative rounded-sm shadow-[inset_0_0_20px_rgba(62,39,35,0.6)]">
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] opacity-50 z-0"></div>
                                    <div className="flex flex-col items-center justify-center h-full animate-bounce relative z-10">
                                        <span className="text-4xl md:text-6xl filter drop-shadow-sm grayscale contrast-125">🗝️</span>
                                        <span className="font-display text-xs text-[#3e2723] mt-2 font-bold tracking-widest font-serif">KEY</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Control Panel - Wood & Brass */}
                    <div className="w-full bg-[#1a0f0a] h-36 md:h-44 flex flex-col items-center justify-end pb-6 border-t-[6px] border-[#8d6e63] relative rounded-b-lg shadow-inner bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]">
                        
                        {/* Coin Slot */}
                        <div className="absolute top-6 right-8 flex flex-col items-center z-10">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#d7ccc8] to-[#8d6e63] rounded-full shadow-lg flex justify-center items-center border border-[#3e2723]">
                                <div className="w-1 h-6 bg-[#2d1b12] shadow-inner"></div>
                            </div>
                            <span className="font-display text-[#d7ccc8] text-[10px] mt-1 tracking-widest text-shadow uppercase font-serif">Insert<br/>Shilling</span>
                        </div>
                        
                        {/* Spin Button */}
                        <div className="relative group w-1/2 z-10">
                            <div className="absolute inset-x-0 bottom-0 h-full bg-[#2e1915] rounded-xl transform translate-y-2 translate-x-1 shadow-lg"></div>
                            <button className="relative w-full bg-gradient-to-b from-[#912338] via-[#701c2a] to-[#4a121c] hover:from-[#a62840] hover:to-[#5e1723] active:translate-y-2 transition-all border-2 border-[#3e2723] text-[#e0e0e0] font-display text-xl md:text-2xl px-6 py-4 rounded-xl shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)] active:shadow-none tracking-[0.1em] text-shadow border-b-8 border-b-[#2e1915] active:border-b-0 font-serif">
                                INVESTIGATE
                            </button>
                        </div>
                        
                        {/* Coin Tray */}
                        <div className="mt-6 w-3/4 h-8 bg-[#2d1b12] border-x-2 border-b-2 border-[#1a0f0a] rounded-b-xl shadow-inner flex items-center justify-center overflow-hidden z-10 relative">
                             {/* Scattered Coins - Silver/Gold */}
                             <div className="w-4 h-4 rounded-full bg-[#cfd8dc] border border-gray-400 shadow-sm absolute left-4 top-2 transform rotate-45"></div>
                             <div className="w-5 h-5 rounded-full bg-[#ffd700] border border-yellow-600 opacity-60 shadow-sm absolute right-12 top-1 transform -rotate-12"></div>
                        </div>
                    </div>
                </div>

                {/* Lever Arm - Walking Stick Style */}
                <div className="hidden md:flex flex-col items-center justify-end h-[400px] ml-[-10px] relative z-10 transform translate-y-10 group cursor-pointer perspective-500">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#5d4037] to-[#2d1b12] rounded-full border-4 border-[#3e2723] shadow-[5px_5px_10px_rgba(0,0,0,0.6)] group-hover:scale-110 transition-transform z-20 relative top-2 group-active:top-[150px] transition-all duration-300">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-50 rounded-full"></div>
                        <div className="absolute top-3 left-3 w-4 h-4 bg-white/10 rounded-full filter blur-sm"></div>
                    </div>
                    <div className="w-4 h-40 bg-gradient-to-r from-[#d7ccc8] via-white to-[#a1887f] border-x border-[#5d4037] z-10 relative -top-2 group-active:h-10 transition-all duration-300 origin-bottom shadow-lg"></div>
                    <div className="w-12 h-20 bg-gradient-to-b from-[#8d6e63] to-[#4e342e] border-2 border-[#2d1b12] rounded-r-2xl shadow-xl flex items-center justify-center -ml-2">
                        <div className="w-6 h-6 bg-[#2d1b12] rounded-full opacity-60 shadow-inner"></div>
                    </div>
                </div>
            </div>

            {/* Recent Winners Section */}
            <div className="mt-12 w-full max-w-2xl">
                <div className="bg-paper-light border-4 border-ink rounded-sm p-6 shadow-pixel-lg relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-ink text-paper-light px-4 py-1 font-display text-sm">
                        RECENT MYSTERIES SOLVED
                    </div>
                    <ul className="space-y-3 font-handwriting text-lg md:text-xl text-ink mt-4">
                        <li className="flex justify-between items-center border-b border-gray-400 border-dashed pb-1">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full border border-black"></span>
                                <span className="font-bold">@Watson_Jr</span> claimed:
                            </span>
                            <span className="text-primary">Vintage Calculator</span>
                        </li>
                        <li className="flex justify-between items-center border-b border-gray-400 border-dashed pb-1">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full border border-black"></span>
                                <span className="font-bold">@MoriartyFan</span> claimed:
                            </span>
                            <span className="text-primary">Left Airpod (Gen 2)</span>
                        </li>
                        <li className="flex justify-between items-center">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full border border-black"></span>
                                <span className="font-bold">@SherlockH</span> claimed:
                            </span>
                            <span className="text-primary">Beige Trenchcoat</span>
                        </li>
                    </ul>
                </div>
                
                <div className="mt-4 text-center">
                    <p className="font-handwriting text-sm text-gray-500">
                        * Tokens are earned by reporting found items. 
                        <a className="underline text-primary hover:text-red-500 ml-1" href="#">Learn more</a>
                    </p>
                </div>
            </div>
        </div>
      </main>

      {/* Footer matching standard layout style */}
      <footer className="w-full border-t-4 border-primary-dark bg-wood-dark text-white p-2 relative z-20">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-lg md:text-xl font-bold tracking-wide">
          <div className="flex items-center space-x-4 mb-2 md:mb-0">
             <div className="flex items-center text-primary">
               <span className="material-icons mr-1 text-base">local_police</span>
               <span>© 2023 SherlostHolmes</span>
             </div>
             <div className="h-4 w-0.5 bg-gray-500"></div>
             <div className="text-gray-300">Concordia University</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
