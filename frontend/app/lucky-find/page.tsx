'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

const SYMBOLS = [
  { id: 'violin', emoji: '🎻', label: 'VIOLIN' },
  { id: 'notes', emoji: '📜', label: 'NOTES' },
  { id: 'key', emoji: '🗝️', label: 'KEY' },
];

const SPIN_DURATION_MS = 3000;
const REEL_REVEAL_MS = [800, 1600, 2400];
const WIN_CHANCE = 0.25;

type ArchivedItem = {
  id: string;
  item_name: string;
  description?: string;
  category: string;
  location_name?: string;
  date_found?: string;
};

export default function LuckyFind() {
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState<number[]>([0, 0, 0]);
  const [revealed, setRevealed] = useState<number>(0);
  const [reward, setReward] = useState<ArchivedItem | null>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [loseMessage, setLoseMessage] = useState<string | null>(null);
  const [isWin, setIsWin] = useState(false);
  
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, []);

  const clearAllTimeouts = useCallback(() => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
  }, []);

  const pickRandomArchivedItem = useCallback(async (): Promise<ArchivedItem | null> => {
    try {
      const res = await fetch(`${apiUrl}/api/items/archived`);
      if (!res.ok) return null;
      const data: ArchivedItem[] = await res.json();
      if (!data?.length) return null;
      return data[Math.floor(Math.random() * data.length)] ?? null;
    } catch {
      return null;
    }
  }, [apiUrl]);

  const spin = useCallback(async () => {
    if (spinning) return;
    
    clearAllTimeouts();
    setSpinning(true);
    setLoseMessage(null);
    setReward(null);
    setShowRewardModal(false);
    setRevealed(0);
    setIsWin(false);

    const won = Math.random() < WIN_CHANCE;
    const sym = Math.floor(Math.random() * SYMBOLS.length);
    const final: number[] = won 
      ? [sym, sym, sym] 
      : [
          Math.floor(Math.random() * SYMBOLS.length),
          Math.floor(Math.random() * SYMBOLS.length),
          Math.floor(Math.random() * SYMBOLS.length),
        ];
    
    setReels(final);
    setIsWin(won);

    REEL_REVEAL_MS.forEach((ms, i) => {
      const timeout = setTimeout(() => {
        setRevealed(i + 1);
      }, ms);
      timeoutRefs.current.push(timeout);
    });

    const finalTimeout = setTimeout(async () => {
      setSpinning(false);
      // Check if all three reels actually match (regardless of initial win chance)
      const actualWin = final[0] === final[1] && final[1] === final[2];
      console.log('Spin complete:', { actualWin, reels: final });
      if (actualWin) {
        setIsWin(true);
        // Show modal immediately
        setShowRewardModal(true);
        console.log('Win detected! Showing modal...');
        // Fetch reward in background (non-blocking)
        pickRandomArchivedItem().then((item) => {
          console.log('Reward fetched:', item);
          setReward(item ?? null);
        }).catch((err) => {
          console.error('Failed to fetch reward:', err);
          setReward(null);
        });
      } else {
        setLoseMessage('No match — try again!');
        setIsWin(false);
      }
    }, SPIN_DURATION_MS);
    timeoutRefs.current.push(finalTimeout);
  }, [spinning, pickRandomArchivedItem, clearAllTimeouts]);

  return (
    <div className="bg-background-light min-h-screen flex flex-col font-handwriting text-gray-800">
      <style jsx global>{`
        @keyframes reelScroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-100px); }
        }
        
        @keyframes symbolReveal {
          0% { 
            transform: scale(0.8) rotateY(90deg);
            opacity: 0;
          }
          100% { 
            transform: scale(1) rotateY(0deg);
            opacity: 1;
          }
        }
        
        @keyframes winGlow {
          0%, 100% { 
            box-shadow: 0 0 15px rgba(197, 179, 88, 0.4),
                        inset 0 0 10px rgba(197, 179, 88, 0.2);
          }
          50% { 
            box-shadow: 0 0 25px rgba(197, 179, 88, 0.7),
                        inset 0 0 15px rgba(197, 179, 88, 0.4);
          }
        }
        
        @keyframes loseShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        
        .reel-spinning {
          animation: reelScroll 0.15s linear infinite;
        }
        
        .reel-reveal {
          animation: symbolReveal 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .reel-win {
          animation: winGlow 1.5s ease-in-out infinite;
        }
        
        .lose-shake {
          animation: loseShake 0.4s ease-in-out;
        }
        
        .wood-texture {
          background: 
            linear-gradient(to bottom, #4a2c1a 0%, #3d2415 50%, #2d1a0f 100%),
            url('https://www.transparenttextures.com/patterns/wood-pattern.png');
          background-blend-mode: overlay;
          background-size: 100% 100%, 250px 250px;
          background-repeat: no-repeat, repeat;
          background-position: center, top left;
          position: relative;
        }
        
        .wood-texture::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('https://www.transparenttextures.com/patterns/wood-pattern.png');
          background-size: 250px 250px;
          background-repeat: repeat;
          opacity: 0.6;
          mix-blend-mode: overlay;
          pointer-events: none;
          z-index: 1;
        }
        
        .wood-texture-dark {
          background: 
            linear-gradient(to bottom, #2d1a0f 0%, #25150b 50%, #1d1009 100%),
            url('https://www.transparenttextures.com/patterns/wood-pattern.png');
          background-blend-mode: multiply;
          background-size: 100% 100%, 250px 250px;
          background-repeat: no-repeat, repeat;
          background-position: center, top left;
          position: relative;
        }
        
        .wood-texture-dark::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('https://www.transparenttextures.com/patterns/wood-pattern.png');
          background-size: 250px 250px;
          background-repeat: repeat;
          opacity: 0.7;
          mix-blend-mode: multiply;
          pointer-events: none;
          z-index: 1;
        }
      `}</style>

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
        </div>
      </nav>

      <main className="flex-grow flex flex-col items-center justify-center pt-24 pb-12 px-4 md:p-8 relative">
        <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl md:text-4xl text-primary mb-3 uppercase tracking-wider">
              The Case of the Overdue Item
            </h2>
            <p className="text-gray-600 font-handwriting text-lg max-w-xl mx-auto">
              Unclaimed items enter the archives after 6 months. Spin to claim a forgotten artifact.
            </p>
          </div>

          {/* Lose Message */}
          {loseMessage && (
            <div className="mb-6 bg-amber-50 border-2 border-amber-400 text-amber-900 px-6 py-3 rounded font-display text-sm lose-shake">
              {loseMessage}
            </div>
          )}

          {/* Slot Machine */}
          <div className="w-full max-w-2xl">
            {/* Dark Brown Wooden Frame */}
            <div className="wood-texture border-8 border-[#5d4037] rounded-lg shadow-2xl p-6 md:p-8 relative" style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.3)', zIndex: 1 }}>

              {/* Title Banner */}
              <div className="text-center mb-6 mt-2">
                <div className="wood-texture-dark border-2 border-[#8d6e63] px-6 py-2 inline-block" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)', position: 'relative', zIndex: 2 }}>
                  <h3 className="font-display text-xl md:text-2xl text-accent-gold tracking-widest relative z-10">
                    THE GAME IS AFOOT
                  </h3>
                </div>
              </div>

              {/* Reels Container */}
              <div className="wood-texture-dark border-4 border-[#6b4e37] rounded p-4 md:p-6 mb-6 relative" style={{ boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)', position: 'relative', zIndex: 2 }}>
                {/* Reels */}
                <div className="flex gap-3 md:gap-6 justify-center items-center">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 max-w-[120px] md:max-w-[160px] bg-[#f5e6d3] border-4 border-[#8d6e63] rounded-lg overflow-hidden relative ${
                        !spinning && revealed > i && isWin ? 'reel-win' : ''
                      }`}
                      style={{
                        minHeight: '180px',
                        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.2)',
                        background: 'linear-gradient(to bottom, #f5e6d3 0%, #e8d4b8 100%)',
                      }}
                    >
                      {/* Top/Bottom Shadows */}
                      <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-[#2d1a0f]/80 to-transparent z-10 pointer-events-none" />
                      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#2d1a0f]/80 to-transparent z-10 pointer-events-none" />
                      
                      <div 
                        className="flex flex-col items-center justify-center h-full relative z-0"
                        style={{
                          transform: spinning && revealed <= i 
                            ? 'translateY(-100px)' 
                            : 'translateY(0)',
                          transition: spinning && revealed <= i 
                            ? 'transform 0.15s linear' 
                            : 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}
                      >
                        {spinning && revealed <= i ? (
                          <div className="flex flex-col items-center gap-6 py-4">
                            {SYMBOLS.map((symbol, idx) => (
                              <div key={idx} className="opacity-40 blur-sm">
                                <span className="text-5xl md:text-6xl">{symbol.emoji}</span>
                              </div>
                            ))}
                            <div className="flex flex-col items-center">
                              <span className="text-5xl md:text-6xl">❓</span>
                              <span className="font-display text-xs text-gray-600 mt-2 font-bold">
                                ???
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="reel-reveal flex flex-col items-center justify-center py-4">
                            <span 
                              className="text-5xl md:text-6xl mb-2"
                              style={{
                                filter: isWin && revealed > i 
                                  ? 'drop-shadow(0 0 8px rgba(197, 179, 88, 0.8))' 
                                  : 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
                                transform: isWin && revealed > i ? 'scale(1.1)' : 'scale(1)',
                                transition: 'all 0.3s ease-out',
                              }}
                            >
                              {SYMBOLS[reels[i]]!.emoji}
                            </span>
                            <span 
                              className="font-display text-xs text-ink font-bold tracking-wider"
                              style={{
                                color: isWin && revealed > i ? '#C5B358' : '#2c1810',
                                textShadow: isWin && revealed > i 
                                  ? '0 0 8px rgba(197, 179, 88, 0.8)' 
                                  : 'none',
                                transition: 'all 0.3s ease-out',
                              }}
                            >
                              {SYMBOLS[reels[i]]!.label}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Button */}
              <div className="text-center">
                <button
                  onClick={spin}
                  disabled={spinning}
                  className="bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-display text-lg md:text-xl px-8 py-4 rounded-lg border-4 border-primary-dark shadow-lg hover:shadow-xl transition-all uppercase tracking-wider font-bold"
                  style={{
                    transform: spinning ? 'scale(0.95)' : 'scale(1)',
                    transition: 'all 0.2s ease-out',
                  }}
                >
                  {spinning ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="animate-spin">⚙</span>
                      <span>INVESTIGATING...</span>
                    </span>
                  ) : (
                    'INVESTIGATE'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Recent Wins */}
          <div className="mt-12 w-full max-w-2xl">
            <div className="bg-paper-light border-4 border-ink rounded-lg p-6 shadow-pixel-lg">
              <h3 className="font-display text-lg text-primary mb-4 text-center uppercase tracking-wide">
                Recent Mysteries Solved
              </h3>
              <ul className="space-y-2 font-handwriting text-base text-ink">
                <li className="flex justify-between items-center border-b border-gray-300 border-dashed pb-2">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="font-bold">@Watson_Jr</span>
                  </span>
                  <span className="text-primary">Vintage Calculator</span>
                </li>
                <li className="flex justify-between items-center border-b border-gray-300 border-dashed pb-2">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="font-bold">@MoriartyFan</span>
                  </span>
                  <span className="text-primary">Left Airpod (Gen 2)</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="font-bold">@SherlockH</span>
                  </span>
                  <span className="text-primary">Beige Trenchcoat</span>
                </li>
              </ul>
            </div>
            <div className="mt-4 text-center">
              <p className="font-handwriting text-sm text-gray-500">
                * Win = 3 matching symbols. Your reward is a real unclaimed item (6+ months in archives).
                <a className="underline text-primary hover:text-primary-dark ml-1" href="/report">
                  Report found items
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full border-t-4 border-primary-dark bg-wood-dark text-white p-2 relative z-20">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-lg md:text-xl font-bold tracking-wide">
          <div className="flex items-center space-x-4 mb-2 md:mb-0">
            <div className="flex items-center text-primary">
              <span className="material-icons mr-1 text-base">local_police</span>
              <span>© 2026 SherlostHolmes</span>
            </div>
            <div className="h-4 w-0.5 bg-gray-500" />
            <div className="text-gray-300">Concordia University</div>
          </div>
        </div>
      </footer>

      {/* Win Modal */}
      {showRewardModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowRewardModal(false)}
          style={{ position: 'fixed', zIndex: 9999 }}
        >
          <div
            className="bg-paper-light border-4 border-ink rounded-lg shadow-2xl max-w-md w-full p-6 font-handwriting"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: 'zoom-in-95 0.3s ease-out',
              position: 'relative',
              zIndex: 10000,
            }}
          >
            <h3 className="font-display text-2xl text-primary mb-4 text-center">🎉 Case Solved!</h3>
            {reward ? (
              <>
                <div className="bg-accent-gold/10 border-2 border-accent-gold rounded p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-1">Your reward — unclaimed 6+ months:</p>
                  <p className="text-2xl text-primary mb-2 font-display font-bold">{reward.item_name}</p>
                  {reward.category && (
                    <p className="text-sm text-gray-600">Category: <span className="font-bold">{reward.category}</span></p>
                  )}
                  {reward.location_name && (
                    <p className="text-sm text-gray-600">Found at: <span className="font-bold">{reward.location_name}</span></p>
                  )}
                  {reward.description && (
                    <p className="text-sm text-gray-700 mt-2 italic">{reward.description}</p>
                  )}
                </div>
                <p className="text-xs text-gray-500 text-center mb-4">
                  Contact Lost &amp; Found to claim this item.
                </p>
              </>
            ) : (
              <p className="text-gray-700 text-center">No archived items available right now. Check back later!</p>
            )}
            <button
              onClick={() => setShowRewardModal(false)}
              className="w-full bg-primary text-white font-display py-3 px-4 rounded-lg border-2 border-primary-dark hover:bg-primary-dark transition-colors uppercase tracking-wide font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
