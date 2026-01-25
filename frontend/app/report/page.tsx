'use client';
import { useState, ChangeEvent } from 'react';

export default function FileReport() {
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newUrls = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      setEvidenceImages(prev => [...prev, ...newUrls]);
    }
    // Reset file input so the same file can be selected again if needed
    e.target.value = '';
  };

  const removeImage = (indexToRemove: number) => {
    setEvidenceImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="bg-wood-light dark:bg-background-dark min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      
      {/* Background Decor - Ink Stain */}
      <div className="absolute top-10 left-10 w-32 h-32 opacity-80 pointer-events-none hidden lg:block transform -rotate-12 mix-blend-multiply dark:mix-blend-normal">
        <img 
          alt="Ink stain" 
          className="w-full h-full drop-shadow-sm opacity-60" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbf-2kcPGC_RhxY4qh5wDaapNd4l5k0Rq30ILOJ350L2xzn-nYw8Vf_9G8a57kCkdN3JRbQ1_m__u3XzGKn5dnxgyP60YnIRAoSxtmp-RzyJBNC4taHg3xVBV16JVlKHH3A3EYdwM56XWvhhu0taplU6k8UFdNug8ZYq3KrqYsXronlFYq2I7W-1fUzU8_ve_5CpHfWwwMuDcOaLOvwowBH1AA76O8LcgUsVygrjl2oxwXaKGTY5Szq1Kume_x8RRexlyD4jiTzg0" 
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Background Decor - Pipe */}
      <div className="absolute bottom-5 right-10 w-48 h-32 pointer-events-none hidden lg:block">
        <img 
          alt="Pixel art of a detective's pipe" 
          className="w-full h-full drop-shadow-xl transform rotate-6" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-bI6DpLsLoO2IRZ74e_k2Isn95kxH-I6kGbjEzWblUgh3GOuJkw2RrAF0a7y06XFe7Q3z4kTpoDkq6Ra0umq8azx8aMBH0bxP6eCauZazv2NK_3KWWmKb4fsUqzWLRyltEy_7IxSmDPnJJQF3x2yKK-BK9RrbiYIPrxDq2r-Zn-8NFDLKHn7CtQKe72wJA5WYgFpaycrzBOJwNnIa6xMuqZjOuRnLUlPyB5wlX__O5JOEkXZQG5s25QviZx37yUKpeJWEbvFlh_I" 
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      <main className="relative z-10 w-full max-w-4xl">
        <div className="flex justify-between items-end px-4">
          <div className="bg-primary text-white dark:text-gray-900 px-6 py-2 rounded-t-lg border-x-4 border-t-4 border-wood-dark dark:border-gray-600 shadow-pixel transform translate-y-1">
            <h2 className="font-display text-xs md:text-sm tracking-widest uppercase">Case File #882</h2>
          </div>
          <button 
            className="group mb-4 bg-gray-800 dark:bg-gray-200 border-4 border-gray-600 dark:border-gray-400 p-2 shadow-pixel hover:translate-y-1 active:shadow-none transition-all" 
            onClick={toggleDarkMode}
          >
            <span className="material-symbols-outlined text-yellow-400 dark:text-gray-800 text-sm md:text-base group-hover:animate-pulse">
                light_mode
            </span>
          </button>
        </div>

        <div className="bg-paper-light dark:bg-paper-dark border-4 border-wood-dark dark:border-gray-600 rounded-lg shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>
          <div className="absolute inset-0 pointer-events-none dark:block hidden scanlines opacity-20"></div>

          <div className="p-8 md:p-12 relative">
            <div className="absolute top-4 right-6 transform rotate-12 opacity-80 border-4 border-burgundy dark:border-red-500 rounded-full p-2 w-24 h-24 flex items-center justify-center text-center">
              <span className="font-display text-[10px] text-burgundy dark:text-red-500 leading-tight">OFFICIAL<br/>SHERLOST<br/>HOLMES<br/>AGENCY</span>
            </div>

            <div className="text-center mb-10 border-b-4 border-dashed border-wood-dark dark:border-gray-500 pb-4">
              <h1 className="font-display text-2xl md:text-4xl text-wood-dark dark:text-primary mb-2 text-shadow">LOST ITEM REPORT</h1>
              <p className="font-handwriting text-xl text-gray-600 dark:text-gray-400">Please fill out the details with utmost precision.</p>
            </div>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div 
                className="space-y-0 bg-lined-paper dark:bg-lined-paper-dark p-0 rounded shadow-inner-pixel bg-opacity-30 flex flex-col pt-0"
              >
                <div className="relative h-16 border-b border-transparent">
                  <label className="absolute top-1 left-2 font-display text-[10px] text-wood-dark dark:text-gray-400 uppercase tracking-widest opacity-70" htmlFor="itemName">Item Name / Description</label>
                  <input className="pixel-input absolute bottom-1 left-0 w-full px-2 text-ink dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 bg-transparent h-8 mb-0 text-xl font-handwriting" id="itemName" placeholder="e.g. Grandma's Emerald Ring" type="text"/>
                </div>
                <div className="relative h-16 border-b border-transparent">
                  <label className="absolute top-1 left-2 font-display text-[10px] text-wood-dark dark:text-gray-400 uppercase tracking-widest opacity-70" htmlFor="lastSeen">Last Seen Location</label>
                  <input className="pixel-input absolute bottom-1 left-0 w-full px-2 text-ink dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 bg-transparent h-8 mb-0 text-xl font-handwriting" id="lastSeen" placeholder="e.g. The Tavern at pixel coordinates 45,12" type="text"/>
                </div>
                <div className="relative h-16 border-b border-transparent">
                  <label className="absolute top-1 left-2 font-display text-[10px] text-wood-dark dark:text-gray-400 uppercase tracking-widest opacity-70" htmlFor="dateLost">Date of Incident</label>
                  <input className="pixel-input absolute bottom-1 left-0 w-full px-2 text-ink dark:text-gray-200 bg-transparent uppercase h-8 mb-0 text-xl font-handwriting" id="dateLost" type="date" />
                </div>
                <div className="relative h-32 border-b border-transparent">
                  <label className="absolute top-1 left-2 font-display text-[10px] text-wood-dark dark:text-gray-400 uppercase tracking-widest opacity-70" htmlFor="notes">Witnesses / Notes</label>
                  <textarea className="pixel-input w-full px-2 text-ink dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 bg-transparent resize-none font-handwriting text-xl absolute bottom-0 leading-[2rem]" id="notes" placeholder="Describe any suspicious NPCs..." rows={4} style={{lineHeight: '2rem', height: '8rem'}}></textarea>
                </div>
              </div>

              <div className="flex flex-col items-center justify-start space-y-6 pt-8">
                 <div 
                  className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center cursor-pointer group perspective-1000"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                    {/* Image Stack Logic */}
                     {evidenceImages.length === 0 && (
                        <div className="absolute inset-0 border-4 border-dashed border-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center text-gray-500 transition-colors group-hover:bg-gray-200 dark:group-hover:bg-gray-700 z-10 shadow-md transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                          <span className="material-symbols-outlined text-4xl mb-2">add_a_photo</span>
                          <span className="font-display text-[10px]">UPLOAD EVIDENCE</span>
                          <input 
                            className="opacity-0 absolute inset-0 cursor-pointer w-full h-full" 
                            type="file" 
                            onChange={handleImageUpload} 
                            accept="image/*" 
                            multiple 
                          />
                        </div>
                      )}
                    {evidenceImages.length > 0 && (
                        <>
                             {!isHovered && (
                                 <input 
                                    className="opacity-0 absolute inset-0 z-[100] cursor-pointer w-full h-full" 
                                    type="file" 
                                    onChange={handleImageUpload} 
                                    accept="image/*" 
                                    multiple 
                                />
                            )}
                            {evidenceImages.map((src, index) => {
                                const totalItems = evidenceImages.length + 1;
                                const centerOffset = index - (totalItems - 1) / 2;
                                const stackRotate = ((index * 7) % 10) - 5;
                                const spreadX = centerOffset * 50; 
                                const spreadRotate = centerOffset * 5;
                                const isFocused = focusedIndex === index;
                                return (
                                    <div
                                        key={src}
                                        className="absolute bg-white p-2 pb-8 shadow-xl border border-gray-300 transition-all duration-300 ease-out origin-bottom"
                                        onMouseEnter={(e) => { e.stopPropagation(); setFocusedIndex(index); }}
                                        onMouseLeave={(e) => { e.stopPropagation(); setFocusedIndex(null); }}
                                        style={{
                                            width: '180px',
                                            height: '220px',
                                            transform: isHovered 
                                                ? (isFocused 
                                                    ? `translateX(${spreadX}px) translateY(-40px) scale(1.1) rotate(0deg)` 
                                                    : `translateX(${spreadX}px) rotate(${spreadRotate}deg) scale(0.9)`
                                                  )
                                                : `rotate(${stackRotate}deg) scale(0.9)`, 
                                            zIndex: isFocused ? 300 : (isHovered ? 10 + index : index), 
                                        }}
                                    >
                                        <div className="w-full h-36 bg-gray-200 overflow-hidden mb-2 relative pointer-events-none">
                                            <img src={src} alt="Evidence" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="font-handwriting text-black text-center text-lg leading-none transform rotate-1 opacity-80 pointer-events-none">
                                            Exhibit #{index + 1}
                                        </div>
                                         <button 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                e.preventDefault();
                                                removeImage(index); 
                                            }}
                                            className={`absolute -top-3 -left-3 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-700 transition-all duration-200 z-50 ${isHovered ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
                                            title="Remove Evidence"
                                        >
                                            <span className="material-symbols-outlined text-sm font-bold">close</span>
                                        </button>
                                    </div>
                                );
                            })}
                             {/* The "Add New" Card */}
                            <div
                                className="absolute bg-gray-100 dark:bg-gray-800 p-2 pb-8 shadow-xl border-2 border-dashed border-gray-400 transition-all duration-500 ease-out origin-bottom flex flex-col items-center justify-center"
                                style={{
                                    width: '180px',
                                    height: '220px',
                                    transform: isHovered 
                                        ? `translateX(${((evidenceImages.length - (evidenceImages.length) / 2) * 50)}px) rotate(${((evidenceImages.length - (evidenceImages.length) / 2) * 5)}deg) scale(0.9)` 
                                        : `rotate(5deg) scale(0.9) translateZ(-10px)`, 
                                    zIndex: isHovered ? 10 + evidenceImages.length : -1, 
                                    opacity: isHovered ? 1 : 0, 
                                }}
                            >
                                <div className="flex flex-col items-center justify-center text-gray-500 h-full w-full">
                                    <span className="material-symbols-outlined text-4xl mb-2">add_photo_alternate</span>
                                    <span className="font-display text-xs text-center">ADD MORE<br/>EVIDENCE</span>
                                </div>
                                <input 
                                    className="opacity-0 absolute inset-0 cursor-pointer w-full h-full" 
                                    type="file" 
                                    onChange={handleImageUpload} 
                                    accept="image/*" 
                                    multiple 
                                />
                            </div>
                        </>
                    )}
                </div>
                <div className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded border-2 border-dashed border-gray-400 mt-8">
                  <span className="material-symbols-outlined text-primary animate-pulse text-sm">auto_awesome</span>
                  <span className="font-display text-[10px] text-gray-600 dark:text-gray-300">AI DETECTIVE STANDING BY</span>
                </div>
              </div>
            </form>

            <div className="mt-12 flex justify-between items-center border-t-4 border-wood-dark dark:border-gray-600 pt-8">
              <div className="hidden md:block">
                <p className="font-display text-[10px] text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
                    By affixing your seal, you agree to the Sherlockian terms of deduction. The game is afoot.
                </p>
              </div>
              <button className="relative group">
                <div className="w-24 h-24 bg-burgundy dark:bg-red-800 rounded-full flex items-center justify-center shadow-lg border-4 border-burgundy-dark dark:border-red-950 group-hover:scale-105 transition-transform duration-200">
                  <div className="w-20 h-20 border-2 border-dashed border-burgundy-dark rounded-full flex items-center justify-center">
                    <span className="font-display text-xs text-red-100 dark:text-red-200 drop-shadow-md">SUBMIT</span>
                  </div>
                </div>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 -z-10 flex space-x-1">
                  <div className="w-6 h-12 bg-burgundy dark:bg-red-800 clip-ribbon"></div>
                  <div className="w-6 h-10 bg-burgundy-dark dark:bg-red-900 clip-ribbon"></div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>

      <div className="absolute -right-2 top-20 hidden md:block">
        <div className="w-8 h-24 bg-paper-light border-2 border-wood-dark shadow-pixel flex flex-col items-center justify-around py-2">
            <div className="w-4 h-4 rounded-full bg-primary"></div>
            <div className="w-4 h-4 rounded-full bg-primary opacity-50"></div>
            <div className="w-4 h-4 rounded-full bg-primary opacity-50"></div>
        </div>
      </div>
    </div>
  );
}
