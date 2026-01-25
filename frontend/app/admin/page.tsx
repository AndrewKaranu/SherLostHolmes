'use client';
import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-concordia-gold text-4xl drop-shadow-md">menu_book</span>
            <h1 className="text-parchment text-4xl md:text-5xl font-black leading-tight tracking-tight uppercase drop-shadow-[4px_4px_0_rgba(0,0,0,0.5)] font-display">Case Ledger</h1>
          </div>
          <p className="text-parchment/80 text-lg max-w-xl font-handwriting">Reviewing <span className="text-parchment font-bold underline decoration-concordia-gold decoration-4 underline-offset-4">12 high-confidence matches</span> synthesized by the Sherlock AI engine.</p>
        </div>
        <div className="flex gap-4">
          {/* Active Cases box removed */}
        </div>
      </div>
      <div className="relative bg-parchment p-8 md:p-12 shadow-pixel rounded-none border-4 border-wood-dark">
        <div className="absolute inset-y-0 left-1/2 w-12 bg-gradient-to-r from-black/5 via-transparent to-black/5 -translate-x-1/2 pointer-events-none"></div>
        {/* Binder Rings */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-32 pointer-events-none z-20">
             <div className="w-8 h-12 rounded-full bg-gray-400 border-2 border-gray-600 shadow-md"></div>
             <div className="w-8 h-12 rounded-full bg-gray-400 border-2 border-gray-600 shadow-md"></div>
             <div className="w-8 h-12 rounded-full bg-gray-400 border-2 border-gray-600 shadow-md"></div>
        </div>
        
        <div className="flex justify-between items-start mb-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-12 h-1 bg-concordia-burgundy"></div>
              <span className="text-concordia-burgundy/80 font-mono text-xs uppercase tracking-[0.3em]">Confidential Protocol</span>
            </div>
            <h3 className="text-desk-wood text-3xl font-bold font-display uppercase tracking-wider">Investigation Log #007</h3>
          </div>
          <div className="text-right">
            <p className="text-desk-wood/80 font-mono text-sm uppercase">Date: OCT 24, 2023</p>
            <p className="text-desk-wood/80 font-mono text-sm uppercase">Station: Hall Building (H-702)</p>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[600px] bg-white/40 border-2 border-dashed border-wood-dark/30 custom-scrollbar p-1">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-wood-dark text-parchment">
                <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-widest border-r border-parchment/10">Evidence (L/F)</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest border-r border-parchment/10">Subject Details</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest border-r border-parchment/10 w-64">Confidence</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wood-dark/20 text-desk-wood">
              <tr className="hover:bg-wood-dark/5 transition-colors group">
                <td className="p-4 border-r border-wood-dark/20 align-top">
                  <div className="flex items-center gap-2">
                    <div className="size-16 bg-black/10 border-2 border-wood-dark/20 overflow-hidden shadow-sm">
                      <img className="w-full h-full object-cover grayscale pixelated" data-alt="Pixelated photo of a lost blue keychain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCetwmfgqL4YKSDZRLkjueyHvutenqLPDmvhZxqiOY4mTC6XR8BwdHrFLJCEWFLy13Kw3YThVuUJ_WMgQr1s0eNsxZAc5PDD-WvNqRjPqP15cVhYh22yk_i2SFbhqe-zAEhJT-WyzqPUyrHleMh7T1GAvA6FzFYS50neXqoXLl6e0fy6oP4kZ73XTNZvfhWms_dEi7XAea-HZ57prX4LJHE-wmy_K2o2qQfYEe129dWvIFFzQSuUc50j93Ga23dlEd-RyP-_Rsp3A8"/>
                    </div>
                    <span className="text-wood-dark font-black text-xl leading-none">×</span>
                    <div className="size-16 bg-black/10 border-2 border-wood-dark/20 overflow-hidden shadow-sm">
                      <img className="w-full h-full object-cover pixelated" data-alt="Found blue keychain close-up photo" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWEVhnt16mK3U5EP49u6B0bAUImJYhu7rWnZOAwuM9vAbP55U5dGJpMKm4xF6z2dbnsUFcqwMwpqRQl57kvhCDzfqiO-sDD_6Yg6HXRoHcXJgmkxC_N6wCDTOeeZnIO_LkpPtVqWBfRu2k25TB1aIiVYHpX19o9XozKo6DucB7X4P9aqHdeRNWb1gqsRD5_OaDxqaCZWfBHNqGXc1xLNSydyrOrA00ae9LNSsu8YVCBs8MlSqv5W9Qht6ID87h_wV1OHeyOzQX21E"/>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 border-r border-wood-dark/20 align-top">
                  <div className="flex flex-col">
                    <span className="text-wood-dark font-bold text-lg font-display uppercase tracking-wide">Sapphire Keychain</span>
                    <span className="text-concordia-burgundy text-sm font-bold mt-1">Found: LB Library, 3rd Floor</span>
                    <span className="text-desk-wood/60 text-xs font-mono mt-0.5">Reported: 2 hours ago</span>
                  </div>
                </td>
                <td className="px-6 py-4 border-r border-wood-dark/20 align-top">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                      <span className="text-concordia-burgundy font-black text-[10px] uppercase">Extreme Match</span>
                      <span className="text-wood-dark font-bold text-lg leading-none font-display">96%</span>
                    </div>
                    <div className="w-full h-4 bg-black/10 border border-black/20 p-0.5">
                      <div className="bg-concordia-burgundy h-full w-[96%] shadow-[2px_0_0_rgba(0,0,0,0.2)]"></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 align-top">
                  <div className="flex flex-col gap-2">
                    <button className="w-full py-2 bg-concordia-burgundy text-parchment text-[10px] font-black uppercase tracking-widest border-2 border-black/20 shadow-[2px_2px_0_black] active:translate-x-px active:translate-y-px active:shadow-none hover:brightness-110 transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-sm">check_circle</span> Validate
                    </button>
                    <button className="w-full py-2 bg-wood-dark text-parchment/80 text-[10px] font-bold uppercase tracking-widest border-2 border-black/20 shadow-[2px_2px_0_black] active:translate-x-px active:translate-y-px active:shadow-none hover:bg-black transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-sm">close</span> Dismiss
                    </button>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-wood-dark/5 transition-colors group">
                <td className="p-4 border-r border-wood-dark/20 align-top">
                  <div className="flex items-center gap-2">
                    <div className="size-16 bg-black/10 border-2 border-wood-dark/20 overflow-hidden shadow-sm">
                      <img className="w-full h-full object-cover grayscale pixelated" data-alt="Lost red plaid shirt" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuqqzZ9mhx2a0cgD4cG9ORuJ18Slw2X_Nd7_FA9GKKT-dtpxFJ0cgPkw6J5271Mt1es94zV1bOsmXvFzV6ozz6JRYAI_cRfAoFZJb_Qkyg_PQmeTilTFBwr9LHMCc-466u3r-UGjyCL5FkAh9cl4E8TkcCvX9xZioNwzqTg27YgALE-1YYMqDZGXOLXYPdZtv8KXnSWBEKrIi6zkl4J39tHpr94zOZRcA_57QlqBlw0J9SLbwDqZnXVQyHhZ878ItjiBqYxsLUJTU"/>
                    </div>
                    <span className="text-wood-dark font-black text-xl leading-none">×</span>
                    <div className="size-16 bg-black/10 border-2 border-wood-dark/20 overflow-hidden shadow-sm">
                      <img className="w-full h-full object-cover pixelated" data-alt="Found red plaid shirt in gym" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4Eop_ObNOvZedIlT_OtGBChDjZ0GpYMtRu99v1XHgf6FuC-rs8-kbirugdsDRyYainAQZXoqON6ht5yGi5l9N45jYK9Vz8pyzQK3QiLp_APhVJFmpUI74m2wM0QchpFW6vF3Hz50W7us0qmmEglMxo3wjg2E-FH4D7NCYaCCCOUQ7Y1gEC1dzCeIJ52XTbAkRiXD-z5GUH529wq5mnHj4eBTqz05fWDA9U4EUDOPswUjKUE79imwc908-DTdVOmrfATsDq9_SeSw"/>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 border-r border-wood-dark/20 align-top">
                  <div className="flex flex-col">
                    <span className="text-wood-dark font-bold text-lg font-display uppercase tracking-wide">Crimson Hoodie</span>
                    <span className="text-concordia-burgundy text-sm font-bold mt-1">Found: Loyola Athletics</span>
                    <span className="text-desk-wood/60 text-xs font-mono mt-0.5">Reported: Yesterday</span>
                  </div>
                </td>
                <td className="px-6 py-4 border-r border-wood-dark/20 align-top">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                      <span className="text-wood-dark/60 font-black text-[10px] uppercase">Possible</span>
                      <span className="text-wood-dark font-bold text-lg leading-none font-display">45%</span>
                    </div>
                    <div className="w-full h-4 bg-black/10 border border-black/20 p-0.5">
                      <div className="bg-wood-dark/40 h-full w-[45%] shadow-[2px_0_0_rgba(0,0,0,0.2)]"></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 align-top">
                  <div className="flex flex-col gap-2">
                    <button className="w-full py-2 bg-concordia-burgundy text-parchment text-[10px] font-black uppercase tracking-widest border-2 border-black/20 shadow-[2px_2px_0_black] active:translate-x-px active:translate-y-px active:shadow-none hover:brightness-110 transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-sm">check_circle</span> Validate
                    </button>
                    <button className="w-full py-2 bg-wood-dark text-parchment/80 text-[10px] font-bold uppercase tracking-widest border-2 border-black/20 shadow-[2px_2px_0_black] active:translate-x-px active:translate-y-px active:shadow-none hover:bg-black transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-sm">close</span> Dismiss
                    </button>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-wood-dark/5 transition-colors group">
                <td className="p-4 border-r border-wood-dark/20 align-top">
                  <div className="flex items-center gap-2">
                    <div className="size-16 bg-black/10 border-2 border-wood-dark/20 overflow-hidden shadow-sm">
                      <img className="w-full h-full object-cover grayscale pixelated" data-alt="Lost silver laptop report photo" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAzXdKDcoePiWblCqdLAdy7MXIz3mD5IeOFgexcsB4fJZTse2uJA_oXdOQx78YggU7tLOD5xvFd3fPKSPaxVMXmYoGOdPkWNtjvtd1KJfsntB2eOv6PTRiprCO703xgBYiPqexXR33dUWPo48lmQE5uAjIQgMaS9VDhq6-Sx7-9JIFlGyVsrcwYPlwZV0j165m2novZGFURSmMFTm6R4KFBo81BctLp5SwrH0lYvaGDVZX7SxtcKVlUOlGllxvqsnaE17273eOADjQ"/>
                    </div>
                    <span className="text-wood-dark font-black text-xl leading-none">×</span>
                    <div className="size-16 bg-black/10 border-2 border-wood-dark/20 overflow-hidden shadow-sm">
                      <img className="w-full h-full object-cover pixelated" data-alt="Found silver laptop at security desk" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDsbrmRsVsBFmo6SZVneZAP89yS49dIbs8OF6wUIkm6S_NPOQ9uN0s0pmUZi3RxGylpekodWLC2KOCJs-y8YNG6H-Nx03OjrRVKGpL6SxBD0QOdfR2L97vzHs6lUYP0W-TglqKeNnUNFeIqboMS9-SpG-Z-YTzqOHFtrwUbf5n_8Smf60KL7ymjZ3bcAJA5JpyahJJPeaDMqO4M9ghsYUcb8fGL14s0ynlrhKSKjGOa9hmNazApZplh3pK3XFaK25QIAB2n0zvVStg"/>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 border-r border-wood-dark/20 align-top">
                  <div className="flex flex-col">
                    <span className="text-wood-dark font-bold text-lg font-display uppercase tracking-wide">MacBook Air</span>
                    <span className="text-concordia-burgundy text-sm font-bold mt-1">Found: Grey Nuns Lounge</span>
                    <span className="text-desk-wood/60 text-xs font-mono mt-0.5">Reported: Oct 21</span>
                  </div>
                </td>
                <td className="px-6 py-4 border-r border-wood-dark/20 align-top">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                      <span className="text-concordia-burgundy font-black text-[10px] uppercase">Likely Match</span>
                      <span className="text-wood-dark font-bold text-lg leading-none font-display">72%</span>
                    </div>
                    <div className="w-full h-4 bg-black/10 border border-black/20 p-0.5">
                      <div className="bg-concordia-burgundy h-full w-[72%] shadow-[2px_0_0_rgba(0,0,0,0.2)]"></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 align-top">
                  <div className="flex flex-col gap-2">
                    <button className="w-full py-2 bg-concordia-burgundy text-parchment text-[10px] font-black uppercase tracking-widest border-2 border-black/20 shadow-[2px_2px_0_black] active:translate-x-px active:translate-y-px active:shadow-none hover:brightness-110 transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-sm">check_circle</span> Validate
                    </button>
                    <button className="w-full py-2 bg-wood-dark text-parchment/80 text-[10px] font-bold uppercase tracking-widest border-2 border-black/20 shadow-[2px_2px_0_black] active:translate-x-px active:translate-y-px active:shadow-none hover:bg-black transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-sm">close</span> Dismiss
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-8 flex justify-between items-center text-desk-wood/60 font-mono text-xs">
          <div className="flex items-center gap-4">
            <span className="bg-wood-dark/10 px-2 py-1 rounded-sm border border-wood-dark/10">MATCH_ALGO_V2.4</span>
            <span className="flex items-center gap-1 text-wood-dark/80">
              <span className="material-symbols-outlined text-sm">fingerprint</span> IDENTITY_VERIFIED
            </span>
          </div>
          <div className="flex gap-4 items-center">
            <span className="uppercase italic tracking-wider">Scroll for more evidence...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
