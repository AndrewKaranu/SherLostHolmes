'use client';

import React from 'react';

export default function EvidenceBoard() {
  return (
    <div className="bg-background-light font-handwriting min-h-screen text-gray-900 overflow-x-hidden selection:bg-primary selection:text-white transition-colors duration-300">
      <style jsx global>{`
        .pixel-border {
          border-style: solid;
          border-width: 4px;
          border-image-slice: 4;
          border-image-width: 4px;
          border-image-outset: 0;
          border-image-source: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAH0lEQVQYV2NkQAKM+Cwkw4gsihEuh6wIJs7AwEA6AAAjCgIZN+uOkAAAAABJRU5ErkJggg==');
          border-color: #3e2723;
        }
        .yarn-line {
          position: absolute;
          height: 4px;
          background-color: #912338;
          transform-origin: 0 50%;
          z-index: 10;
          box-shadow: 2px 2px 0px rgba(0,0,0,0.3);
        }
        .scanlines::before {
          content: " ";
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03));
          z-index: 2;
          background-size: 100% 2px, 3px 100%;
          pointer-events: none;
        }
        .pixel-logo-c {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-template-rows: repeat(5, 1fr);
          width: 32px;
          height: 40px;
          gap: 2px;
        }
        .pixel-dot {
          background-color: #912338;
        }
        .pixel-dot-gold {
          background-color: #ffd700;
        }
        .bg-cork-pattern {
           background-image: url('https://www.transparenttextures.com/patterns/cork-board.png');
        }
      `}</style>
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 px-4 py-3 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-between items-start pointer-events-auto">
          <div className="bg-wood-dark border-4 border-ink p-2 shadow-pixel text-paper-light flex items-center gap-4">
            <div className="flex flex-col">
              <span className="font-display text-xs text-accent-gold mb-1">SHERLOST HOLMES</span>
              <div className="flex items-center gap-2 text-xl leading-none">
                <span className="material-icons text-green-400 text-base">search</span>
                <span>LVL: DETECTIVE</span>
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

      <main className="relative w-full min-h-screen flex items-center justify-center pt-24 pb-12 px-4 scanlines bg-cork-pattern">
        <div className="relative w-full max-w-6xl h-[800px] bg-wood-dark border-[12px] border-wood-face shadow-2xl rounded-sm p-8 bg-cork-pattern overflow-hidden">
          <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
          
          {/* Header Note */}
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
            <div className="bg-paper-light px-6 py-3 shadow-pixel transform rotate-1 border-2 border-gray-600">
              <div className="w-4 h-4 rounded-full bg-primary absolute -top-2 left-1/2 transform -translate-x-1/2 shadow-sm border border-black"></div>
              <h1 className="font-display text-lg sm:text-2xl text-primary uppercase tracking-widest text-center">Case #402: The Missing Tabby</h1>
              <p className="text-center text-base sm:text-lg text-gray-700 italic border-t border-gray-400 mt-1 pt-1 font-handwriting">Matching Evidence</p>
            </div>
          </div>

          {/* Mittens Card */}
          <div className="absolute top-1/3 left-4 md:left-24 transform -rotate-3 hover:scale-105 transition-transform z-10 w-48 md:w-64">
            <div className="w-6 h-6 rounded-full bg-red-600 absolute -top-3 left-1/2 transform -translate-x-1/2 shadow-md border-2 border-red-800 z-20"></div>
            <div className="bg-white p-3 pt-4 pb-8 shadow-pixel-lg border border-gray-300">
              <div className="bg-gray-800 h-32 md:h-40 w-full mb-3 relative overflow-hidden flex items-center justify-center">
                <img 
                  alt="Pixelated Cat" 
                  className="object-cover w-full h-full opacity-90 contrast-125 saturate-50" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPzxXHm2Wk5qBL_RYvulGJU0V1QhAVnYxnZDAmWnNPHdjQnWBiEG5Jl-VDv-nEILpQ3GZmOVOKb2gaTzq19XvwGhggFWzVLnlBcE39PAzJZLWR9u7oREfUlA0DkHGcTV--vn_wXGPlsXQQIv2R1lwzi0LXeoiO9fKNdUKq-dvIvb801CHRTh2QKxED9BtS1Z85a9Er6zmOaejk293cL2s71xpoxeUAmkuNTpfL2MWsn-V9_tJcaw5mYzyTnkDhNjBLyfLWggLrAao" 
                  style={{imageRendering: 'pixelated'}}
                />
                <span className="absolute top-2 right-2 bg-red-600 text-white font-display text-[10px] px-1 py-0.5 border border-white">LOST</span>
              </div>
              <h3 className="font-display text-sm mb-1 text-black">"Mittens"</h3>
              <p className="text-lg leading-5 text-gray-800 font-bold border-b-2 border-dashed border-gray-400 pb-2 mb-2 font-handwriting">Orange Tabby</p>
              <ul className="text-base leading-tight text-gray-600 space-y-1 font-handwriting">
                <li><span className="font-bold">Date:</span> Oct 12</li>
                <li><span className="font-bold">Loc:</span> Central Park</li>
                <li><span className="font-bold">Item:</span> Red Collar</li>
              </ul>
            </div>
          </div>

          {/* Found Evidence Card */}
          <div className="absolute bottom-1/4 right-4 md:right-32 transform rotate-2 hover:scale-105 transition-transform z-10 w-48 md:w-60">
            <div className="w-6 h-6 rounded-full bg-yellow-500 absolute -top-3 right-4 shadow-md border-2 border-yellow-700 z-20"></div>
            <div className="bg-paper-light p-4 shadow-pixel-lg border-2 border-[#d2b48c] relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-8 bg-white/40 rotate-1 border-l border-r border-white/20 transform backdrop-blur-sm"></div>
              <h3 className="font-display text-xs text-gray-500 uppercase mb-2">Evidence #992</h3>
              <div className="bg-gray-700 h-24 md:h-32 w-full mb-3 relative border-4 border-white shadow-inner">
                <img 
                  alt="Found Cat Image" 
                  className="object-cover w-full h-full opacity-90 sepia-[.3]" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgBvZ4AHrRR_woOUgZhGNolJboOe0LcuroAcEdQl9Us7XJicfiCV7P-OXdrH96R51nfkqD3ZyTE3-TwC_EFp4u5C8sut2NKwZqwOyLQEs6BfUQBC8r1BJqyAP44MZ4dK1WOQRvPREr0Ec0ZB10zT0lb-ZwjDXOQFnBmHM287y9iRS0pJ2k0gFmCknsJnBDRiZoWflem55lf72eTyfhvARactRwhLuNCEHCJ41eTyYTHSRth7FnpEjNjXfejfNkG4c1--idsnZyhdE" 
                  style={{imageRendering: 'pixelated'}}
                />
                <span className="absolute bottom-0 left-0 bg-green-600 text-white font-display text-[10px] px-1 py-0.5 border-t border-r border-white">FOUND</span>
              </div>
              <p className="text-lg leading-5 text-gray-800 font-handwriting">Spotted near the old bakery.</p>
              <div className="mt-2 text-primary font-bold text-lg rotate-1 border-2 border-primary inline-block px-1 font-display">
                MATCH 92%
              </div>
            </div>
          </div>

          {/* Yarn Connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 filter drop-shadow-md">
            <line stroke="#912338" strokeDasharray="5,5" strokeWidth="3" x1="25%" x2="50%" y1="40%" y2="50%"></line>
            <line stroke="#912338" strokeWidth="3" x1="75%" x2="50%" y1="65%" y2="50%"></line>
          </svg>

          {/* Center Match Action */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center">
            <div className="relative group">
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-[12px] border-gray-800 bg-[#e0f7fa] shadow-2xl flex items-center justify-center overflow-hidden relative z-10">
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white opacity-40 z-20"></div>
                <span className="material-icons text-6xl md:text-8xl text-primary opacity-80 animate-pulse">fingerprint</span>
                <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')] opacity-10 pointer-events-none"></div>
              </div>
              <div className="w-8 h-32 bg-wood-dark border-4 border-ink absolute top-[85%] left-1/2 -translate-x-1/2 -rotate-45 -z-10 shadow-lg"></div>
            </div>
            
            <div className="mt-8 bg-wood-light p-1 border-4 border-ink shadow-pixel-lg">
              <div className="bg-wood-dark p-4 flex flex-col gap-3 items-center min-w-[280px]">
                <p className="font-display text-primary-dark text-xs text-center mb-2 animate-bounce bg-white/10 p-1">TOP MATCH FOUND!</p>
                <div className="flex w-full gap-3">
                  <button className="flex-1 bg-[#4caf50] hover:bg-[#43a047] text-white font-display text-xs py-3 px-2 border-b-4 border-[#2e7d32] active:border-b-0 active:translate-y-1 transition-all">
                    CONFIRM
                  </button>
                  <button className="flex-1 bg-primary hover:bg-primary-dark text-white font-display text-xs py-3 px-2 border-b-4 border-[#561521] active:border-b-0 active:translate-y-1 transition-all">
                    DENY
                  </button>
                </div>
                <button className="text-paper-light hover:text-white underline font-handwriting text-xl decoration-dotted">
                  Keep Searching...
                </button>
              </div>
            </div>
          </div>

          {/* Sticky Notes */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-yellow-300 shadow-md transform rotate-6 p-2 z-0 hidden md:block">
            <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mb-1 border border-black"></div>
            <p className="font-handwriting text-xl leading-5 text-gray-800">Remember to check the alleyway cams.</p>
          </div>
          
          <div className="absolute bottom-10 left-10 w-40 h-24 bg-pink-300 shadow-md transform -rotate-2 p-2 z-0 hidden md:block border-l-8 border-black/10">
            <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1 border border-black opacity-80"></div>
            <p className="font-handwriting text-xl text-gray-800 text-center mt-2">DO NOT REMOVE</p>
          </div>
        </div>
      </main>

      {/* Footer System Log */}
      <div className="fixed bottom-0 left-0 w-full z-40 px-4 pb-4 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <div className="bg-wood-dark border-4 border-wood-face p-1 shadow-pixel-lg relative">
            <div className="absolute -top-12 right-0 bg-wood-dark p-1 border-4 border-wood-face border-b-0 shadow-lg" title="Concordia University">
              <div className="pixel-logo-c">
                <div className="pixel-dot col-span-4"></div>
                <div className="pixel-dot"></div>
                <div className="col-span-3"></div>
                <div className="pixel-dot"></div>
                <div className="col-span-1"></div>
                <div className="pixel-dot-gold col-span-2"></div> 
                <div className="pixel-dot"></div>
                <div className="col-span-3"></div>
                <div className="pixel-dot col-span-4"></div>
              </div>
            </div>
            <div className="border-2 border-wood-dark bg-black/80 p-3 h-24 overflow-y-auto font-handwriting text-xl text-green-400">
              <p><span className="text-blue-400">[System]</span> Scanning database...</p>
              <p><span className="text-blue-400">[System]</span> Image recognition complete. 1 Match found.</p>
              <p className="animate-pulse"><span className="text-yellow-400">[Holmes_AI]</span> "High probability this is the missing cat from the flyer."</p>
            </div>
            <div className="mt-1 flex bg-[#3e2723]">
              <span className="text-paper-light px-2 py-1 font-display text-xs self-center">&gt;</span>
              <input className="w-full bg-transparent border-none text-paper-light font-handwriting text-xl focus:ring-0 placeholder-gray-500 p-1" placeholder="Add a note to the case file..." type="text"/>
              <button className="bg-wood-dark text-white px-3 font-display text-[10px] hover:bg-wood-light">LOG</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
