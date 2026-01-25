'use client';
import Link from 'next/link';
import Image from 'next/image';

export default function EvidenceInventoryLedger() {
  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-concordia-gold text-4xl drop-shadow-md">folder_managed</span>
            <h1 className="text-parchment text-4xl md:text-5xl font-black leading-tight tracking-tight uppercase drop-shadow-[4px_4px_0_rgba(0,0,0,0.5)] font-display">Inventory Ledger</h1>
          </div>
          <p className="text-parchment/80 text-lg max-w-xl font-handwriting">
            <span className="text-concordia-gold font-bold">Authorized Personnel Only</span> • Concordia Bureau of Missing Items
          </p>
        </div>
        <button className="px-6 py-3 bg-concordia-gold text-burgundy-dark font-black uppercase tracking-widest rounded-sm pixel-border shadow-[4px_4px_0_rgba(0,0,0,0.5)] flex items-center gap-2 hover:brightness-110 active:translate-y-1 active:shadow-none transition-all">
          <span className="material-symbols-outlined">add_box</span>
          Register New Item
        </button>
      </div>

      <div className="relative bg-parchment p-8 md:p-12 shadow-pixel rounded-none border-4 border-wood-dark">
        {/* Ledger Binding (Stitched/Bound look) */}
        <div className="absolute left-8 top-0 bottom-0 w-8 border-l-2 border-r-2 border-dashed border-wood-dark/20 flex flex-col items-center justify-around py-4 z-10 pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
             <div key={i} className="w-1.5 h-1.5 rounded-full bg-wood-dark/40"></div>
          ))}
        </div>
        <div className="absolute top-0 left-12 bottom-0 w-px bg-black/5"></div>

        <div className="pl-12">
            <div className="flex justify-between items-end mb-10 border-b-2 border-wood-dark/20 pb-4">
            <div>
                <span className="text-concordia-burgundy/80 font-mono text-xs uppercase tracking-[0.3em]">Registry Volume IV</span>
                <h3 className="text-desk-wood text-3xl font-bold font-serif italic">General Evidence Log</h3>
            </div>
            <div className="text-right">
                <p className="text-desk-wood/80 font-mono text-sm uppercase">Last Audit: OCT 24, 2023</p>
                <p className="text-desk-wood/60 font-mono text-[10px] uppercase">Ref: CON-LOG-IV-2023</p>
            </div>
            </div>

            <div className="overflow-y-auto max-h-[600px] border-2 border-dashed border-wood-dark/30 custom-scrollbar relative">
            <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-parchment shadow-sm">
                <tr className="border-b-4 border-wood-dark text-wood-dark">
                    <th className="px-4 py-4 text-[11px] font-black uppercase tracking-widest">Evidence</th>
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">Description</th>
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">Registry Date</th>
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">Location</th>
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">Status</th>
                    <th className="px-4 py-4 text-right text-[11px] font-black uppercase tracking-widest">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-wood-dark/10 text-desk-wood font-mono text-sm">
                <tr className="group hover:bg-wood-dark/5 transition-colors">
                    <td className="p-4">
                    <div className="size-20 bg-white border-2 border-wood-dark/20 p-1 shadow-sm overflow-hidden">
                        <img className="w-full h-full object-cover pixelated" alt="Found silver watch" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDsbrmRsVsBFmo6SZVneZAP89yS49dIbs8OF6wUIkm6S_NPOQ9uN0s0pmUZi3RxGylpekodWLC2KOCJs-y8YNG6H-Nx03OjrRVKGpL6SxBD0QOdfR2L97vzHs6lUYP0W-TglqKeNnUNFeIqboMS9-SpG-Z-YTzqOHFtrwUbf5n_8Smf60KL7ymjZ3bcAJA5JpyahJJPeaDMqO4M9ghsYUcb8fGL14s0ynlrhKSKjGOa9hmNazApZplh3pK3XFaK25QIAB2n0zvVStg"/>
                    </div>
                    </td>
                    <td className="px-6 py-4">
                    <div className="font-bold text-wood-dark uppercase font-display tracking-wide text-base">Silver Analog Watch</div>
                    <div className="text-xs text-wood-dark/60 mt-1">Cracked face, leather strap</div>
                    </td>
                    <td className="px-6 py-4">
                    OCT 23, 2023 <br/> <span className="text-[10px] opacity-60">14:30 PM</span>
                    </td>
                    <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">location_on</span> Security Desk
                    </div>
                    <div className="text-[10px] text-wood-dark/60 mt-1 font-bold">BIN #402</div>
                    </td>
                    <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-concordia-burgundy/10 text-concordia-burgundy rounded text-[10px] font-bold uppercase tracking-wider border border-concordia-burgundy/20">
                        <span className="size-1.5 rounded-full bg-concordia-burgundy animate-pulse"></span> Unclaimed
                    </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                    <button className="text-wood-dark hover:text-concordia-burgundy transition-colors">
                        <span className="material-symbols-outlined">more_vert</span>
                    </button>
                    </td>
                </tr>
                <tr className="group hover:bg-wood-dark/5 transition-colors">
                    <td className="p-4">
                    <div className="size-20 bg-white border-2 border-wood-dark/20 p-1 shadow-sm overflow-hidden">
                        <img className="w-full h-full object-cover pixelated grayscale opacity-70" alt="Generic textbook" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCetwmfgqL4YKSDZRLkjueyHvutenqLPDmvhZxqiOY4mTC6XR8BwdHrFLJCEWFLy13Kw3YThVuUJ_WMgQr1s0eNsxZAc5PDD-WvNqRjPqP15cVhYh22yk_i2SFbhqe-zAEhJT-WyzqPUyrHleMh7T1GAvA6FzFYS50neXqoXLl6e0fy6oP4kZ73XTNZvfhWms_dEi7XAea-HZ57prX4LJHE-wmy_K2o2qQfYEe129dWvIFFzQSuUc50j93Ga23dlEd-RyP-_Rsp3A8"/>
                    </div>
                    </td>
                    <td className="px-6 py-4">
                    <div className="font-bold text-wood-dark uppercase font-display tracking-wide text-base">Calculus Textbook</div>
                    <div className="text-xs text-wood-dark/60 mt-1">"Stewart" - 8th Edition</div>
                    </td>
                    <td className="px-6 py-4">
                    OCT 22, 2023 <br/> <span className="text-[10px] opacity-60">09:15 AM</span>
                    </td>
                    <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">location_on</span> H-Building
                    </div>
                    <div className="text-[10px] text-wood-dark/60 mt-1 font-bold">BIN #112</div>
                    </td>
                    <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-900/10 text-green-900 rounded text-[10px] font-bold uppercase tracking-wider border border-green-900/20">
                        <span className="material-symbols-outlined text-[12px]">check</span> Returned
                    </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                    <button className="text-wood-dark hover:text-concordia-burgundy transition-colors">
                        <span className="material-symbols-outlined">more_vert</span>
                    </button>
                    </td>
                </tr>
                {/* Empty Rows for visuals */}
                {Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="h-24 hover:bg-wood-dark/5 transition-colors">
                        <td className="p-4 border-r border-dashed border-wood-dark/10 opacity-30 text-center font-display uppercase tracking-widest text-[10px]">
                            slot_{i+3}
                        </td>
                        <td colSpan={5}></td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
            
            <div className="mt-4 pt-2 border-t-2 border-wood-dark/10 flex justify-end items-center text-wood-dark/50 font-mono text-xs uppercase">
                <span>Concordia Security Services • End of Log</span>
            </div>
        </div>
      </div>
    </div>
  );
}