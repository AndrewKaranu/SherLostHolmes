'use client';

import { useState } from 'react';

export interface Hotspot {
  x: number;
  y: number;
  name: string;
}

const hotspots: Hotspot[] = [
  { x: 530, y: 127, name: 'EM Building' },
  { x: 562, y: 127, name: 'X Building' },
  { x: 593, y: 127, name: 'Z Building' },
  { x: 623, y: 127, name: 'PR Building' },
  { x: 653, y: 127, name: 'V Building' },
  { x: 693, y: 107, name: 'M Building' },
  { x: 723, y: 107, name: 'S Building' },
  { x: 753, y: 107, name: 'JI Building' },
  { x: 815, y: 168, name: 'B Building' },
  { x: 815, y: 188, name: 'K Building' },
  { x: 815, y: 208, name: 'D Building' },
  { x: 815, y: 228, name: 'MI Building' },
  { x: 815, y: 258, name: 'H Building (Hall)' },
  { x: 438, y: 135, name: 'GS Building' },
  { x: 440, y: 194, name: 'CR Building' },
  { x: 438, y: 230, name: 'RA Building' },
  { x: 438, y: 252, name: 'R Building' },
  { x: 438, y: 270, name: 'MR Building' },
  { x: 438, y: 318, name: 'LS Building' },
  { x: 610, y: 387, name: 'GM Building' },
  { x: 340, y: 420, name: 'MB Building (JMSB)' },
  { x: 340, y: 509, name: 'CL Building' },
  { x: 340, y: 538, name: 'TD Building' },
  { x: 340, y: 562, name: 'FS Building' },
  { x: 240, y: 615, name: 'PG Building' },
  { x: 363, y: 701, name: 'GA Building (Grey Nuns)' },
  { x: 363, y: 741, name: 'GN Building (Grey Nuns)' },
  { x: 850, y: 425, name: 'LB Building (Webster Library)' },
  { x: 850, y: 497, name: 'LD Building' },
  { x: 710, y: 570, name: 'EV Building' },
  { x: 870, y: 800, name: 'VA Building' },
  { x: 503, y: 355, name: 'BIXI Station - Place Norman-Béthune' },
  { x: 670, y: 260, name: 'BIXI Station - Hall Building' },
  { x: 378, y: 370, name: 'BIXI Station - Rue Mackay' },
  { x: 650, y: 425, name: 'BIXI Station - Rue Sainte-Catherine' },
  { x: 510, y: 650, name: 'BIXI Station - Boul. René-Lévesque' },
  { x: 655, y: 470, name: 'Parking - P' },
  { x: 540, y: 350, name: 'Place Norman-Béthune' },
  { x: 503, y: 430, name: 'NEF - Complexe des escaliers' },
];

const MAP_WIDTH = 905;
const MAP_HEIGHT = 900;
const HOTSPOT_SIZE = 24;

interface MapSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (location: string) => void;
}

export default function MapSelector({ isOpen, onClose, onSelectLocation }: MapSelectorProps) {
  const [hoveredSpot, setHoveredSpot] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelect = (name: string) => {
    onSelectLocation(name);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div 
        className="relative bg-paper-light border-4 border-wood-dark rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary text-white px-6 py-3 flex justify-between items-center border-b-4 border-wood-dark">
          <div>
            <h3 className="font-display text-lg tracking-widest uppercase">Select Location on Campus</h3>
            <p className="font-handwriting text-sm text-background-light/80">Click on a building or location</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-burgundy-dark hover:bg-red-900 rounded-full flex items-center justify-center transition-colors border-2 border-white/20"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-white">close</span>
          </button>
        </div>

        {/* Map Container */}
        <div className="relative overflow-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          <div 
            className="relative mx-auto"
            style={{ 
              width: '100%',
              maxWidth: '905px',
              aspectRatio: '905 / 900'
            }}
          >
            <img
              src="/concordia_map.png"
              alt="Concordia campus map"
              className="w-full h-full object-contain"
              draggable={false}
            />
            
            {/* Hotspots */}
            {hotspots.map((h, i) => (
              <button
                key={i}
                type="button"
                className="absolute border-none rounded-full cursor-pointer p-0 transition-all duration-200 hover:scale-150"
                style={{
                  left: `${((h.x - HOTSPOT_SIZE / 2) / MAP_WIDTH) * 100}%`,
                  top: `${((h.y - HOTSPOT_SIZE / 2) / MAP_HEIGHT) * 100}%`,
                  width: `${(HOTSPOT_SIZE / MAP_WIDTH) * 100}%`,
                  height: `${(HOTSPOT_SIZE / MAP_HEIGHT) * 100}%`,
                  minWidth: '16px',
                  minHeight: '16px',
                  background: hoveredSpot === h.name ? 'rgba(145, 35, 56, 0.9)' : 'rgba(145, 35, 56, 0.6)',
                  boxShadow: hoveredSpot === h.name ? '0 0 12px rgba(145, 35, 56, 0.8)' : 'none',
                }}
                onClick={() => handleSelect(h.name)}
                onMouseEnter={() => setHoveredSpot(h.name)}
                onMouseLeave={() => setHoveredSpot(null)}
                aria-label={h.name}
                title={h.name}
              />
            ))}
          </div>
        </div>

        {/* Footer with hovered location */}
        <div className="bg-wood-dark text-paper-light px-6 py-3 border-t-4 border-wood-face">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-accent-gold">location_on</span>
              <span className="font-handwriting text-xl">
                {hoveredSpot ? hoveredSpot : 'Hover over a location to see its name'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm font-display text-gray-400">
              <span className="w-3 h-3 rounded-full bg-primary"></span>
              <span>Click to select</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
