'use client';
import { useState, useEffect } from 'react';

interface LockerItem {
  id: string;
  name: string;
  category: string;
  image_url?: string;
}

interface LockerClaimant {
  id: string;
  email?: string;
  student_id?: string;
}

interface Locker {
  locker_number: number;
  location: string;
  status: 'available' | 'assigned' | 'unlocked' | 'collected';
  password?: string;
  assigned_at?: string;
  unlocked_at?: string;
  collected_at?: string;
  item?: LockerItem;
  claimant?: LockerClaimant;
}

interface LockerStats {
  total: number;
  available: number;
  assigned: number;
  unlocked: number;
  collected: number;
}

interface TrackingData {
  lockers: Locker[];
  stats: LockerStats;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'available':
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-300',
        icon: 'check_circle',
        label: 'Available'
      };
    case 'assigned':
      return {
        bg: 'bg-concordia-gold/20',
        text: 'text-burgundy-dark',
        border: 'border-concordia-gold',
        icon: 'schedule',
        label: 'Awaiting Pickup'
      };
    case 'unlocked':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-300',
        icon: 'lock_open',
        label: 'Unlocked'
      };
    case 'collected':
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        border: 'border-gray-300',
        icon: 'done_all',
        label: 'Collected'
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        border: 'border-gray-300',
        icon: 'help',
        label: 'Unknown'
      };
  }
};

export default function LockersPage() {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'unlocked' | 'available'>('all');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    fetchLockerData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchLockerData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLockerData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/lockers/tracking`);
      if (!response.ok) throw new Error('Failed to fetch locker data');
      const data = await response.json();
      setTrackingData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching locker data:', err);
      setError('Failed to load locker status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReleaseLocker = async (lockerNumber: number) => {
    if (!confirm(`Are you sure you want to release Locker #${lockerNumber}? This will remove the assigned item.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/lockers/release/${lockerNumber}`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to release locker');

      await fetchLockerData();
      setSelectedLocker(null);
    } catch (err) {
      console.error('Error releasing locker:', err);
      alert('Failed to release locker');
    }
  };

  const filteredLockers = trackingData?.lockers.filter((locker) => {
    if (filter === 'all') return true;
    return locker.status === filter;
  }) || [];

  const formatTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSince = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-concordia-gold text-4xl drop-shadow-md">lock</span>
            <h1 className="text-parchment text-4xl md:text-5xl font-black leading-tight tracking-tight uppercase drop-shadow-[4px_4px_0_rgba(0,0,0,0.5)] font-display">
              Locker Control
            </h1>
          </div>
          <p className="text-parchment/80 text-lg max-w-xl font-handwriting">
            <span className="text-concordia-gold font-bold">Real-time tracking</span> • ESP32 Hardware Integration
          </p>
        </div>
        <div className="flex gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-4 py-3 bg-parchment text-wood-dark font-bold uppercase tracking-widest rounded-sm border-2 border-wood-dark shadow-pixel-sm"
          >
            <option value="all">All Lockers</option>
            <option value="assigned">Awaiting Pickup</option>
            <option value="unlocked">Unlocked</option>
            <option value="available">Available</option>
          </select>
          <button
            onClick={fetchLockerData}
            className="px-4 py-3 bg-parchment/10 text-parchment font-bold uppercase tracking-widest rounded-sm border-2 border-parchment/20 shadow-pixel-sm flex items-center gap-2 hover:bg-parchment/20 transition-all"
          >
            <span className="material-symbols-outlined">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {trackingData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-parchment p-4 border-4 border-wood-dark shadow-pixel text-center">
            <p className="text-wood-dark text-3xl font-black font-display">{trackingData.stats.total}</p>
            <p className="text-wood-dark/60 text-xs font-bold uppercase mt-1">Total</p>
          </div>
          <div className="bg-green-100 p-4 border-4 border-green-300 shadow-pixel text-center">
            <p className="text-green-800 text-3xl font-black font-display">{trackingData.stats.available}</p>
            <p className="text-green-700/60 text-xs font-bold uppercase mt-1">Available</p>
          </div>
          <div className="bg-concordia-gold/30 p-4 border-4 border-concordia-gold shadow-pixel text-center">
            <p className="text-burgundy-dark text-3xl font-black font-display">{trackingData.stats.assigned}</p>
            <p className="text-burgundy-dark/60 text-xs font-bold uppercase mt-1">Assigned</p>
          </div>
          <div className="bg-blue-100 p-4 border-4 border-blue-300 shadow-pixel text-center">
            <p className="text-blue-800 text-3xl font-black font-display">{trackingData.stats.unlocked}</p>
            <p className="text-blue-700/60 text-xs font-bold uppercase mt-1">Unlocked</p>
          </div>
          <div className="bg-gray-100 p-4 border-4 border-gray-300 shadow-pixel text-center">
            <p className="text-gray-700 text-3xl font-black font-display">{trackingData.stats.collected}</p>
            <p className="text-gray-600/60 text-xs font-bold uppercase mt-1">Collected</p>
          </div>
        </div>
      )}

      {/* Locker Grid */}
      <div className="bg-parchment p-8 shadow-pixel border-4 border-wood-dark">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-wood-dark/20">
          <span className="material-symbols-outlined text-concordia-burgundy text-2xl">grid_view</span>
          <h2 className="text-wood-dark text-xl font-bold font-display uppercase tracking-wide">Locker Status</h2>
          <span className="ml-auto text-wood-dark/40 text-xs font-mono">Auto-refresh: 30s</span>
        </div>

        {isLoading && !trackingData ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="material-symbols-outlined text-concordia-burgundy text-5xl animate-spin mb-4">sync</span>
            <p className="text-wood-dark font-mono uppercase tracking-wider">Loading locker status...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="material-symbols-outlined text-red-600 text-5xl mb-4">error</span>
            <p className="text-red-700 font-mono uppercase tracking-wider mb-4">{error}</p>
            <button onClick={fetchLockerData} className="px-4 py-2 bg-concordia-burgundy text-parchment font-bold uppercase rounded-sm">
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {filteredLockers.map((locker) => {
              const config = getStatusConfig(locker.status);
              return (
                <div
                  key={locker.locker_number}
                  onClick={() => setSelectedLocker(locker)}
                  className={`p-4 rounded-sm border-2 ${config.border} ${config.bg} cursor-pointer hover:brightness-95 transition-all relative`}
                >
                  {/* Locker Number */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-black font-display text-wood-dark">#{locker.locker_number}</span>
                    <span className={`material-symbols-outlined ${config.text}`}>{config.icon}</span>
                  </div>

                  {/* Status */}
                  <span className={`inline-block px-2 py-1 text-[10px] font-bold uppercase ${config.bg} ${config.text} rounded-sm`}>
                    {config.label}
                  </span>

                  {/* Item Preview */}
                  {locker.item && (
                    <div className="mt-3 pt-3 border-t border-wood-dark/10">
                      <p className="text-wood-dark text-xs font-bold truncate">{locker.item.name}</p>
                      {locker.assigned_at && (
                        <p className="text-wood-dark/50 text-[10px] mt-1">{getTimeSince(locker.assigned_at)}</p>
                      )}
                    </div>
                  )}

                  {/* Pulse animation for active lockers */}
                  {(locker.status === 'assigned' || locker.status === 'unlocked') && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-concordia-gold animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Locker Detail Modal */}
      {selectedLocker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedLocker(null)} />

          <div className="relative bg-parchment w-full max-w-lg border-4 border-wood-dark shadow-pixel">
            {/* Header */}
            <div className={`p-6 ${getStatusConfig(selectedLocker.status).bg} border-b-4 border-wood-dark/20`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-black font-display text-wood-dark">#{selectedLocker.locker_number}</span>
                  <div>
                    <span className={`inline-block px-3 py-1 text-xs font-bold uppercase ${getStatusConfig(selectedLocker.status).text} rounded-sm`}>
                      {getStatusConfig(selectedLocker.status).label}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedLocker(null)} className="p-2 hover:bg-wood-dark/10 rounded-sm">
                  <span className="material-symbols-outlined text-wood-dark text-2xl">close</span>
                </button>
              </div>
              <p className="text-wood-dark/70 text-sm mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">location_on</span>
                {selectedLocker.location}
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Item Info */}
              {selectedLocker.item ? (
                <div className="p-4 bg-wood-dark/5 rounded-sm">
                  <h3 className="text-wood-dark font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">inventory_2</span>
                    Assigned Item
                  </h3>
                  <div className="flex gap-4">
                    {selectedLocker.item.image_url && (
                      <div className="size-20 bg-white border-2 border-wood-dark/20 overflow-hidden">
                        <img src={selectedLocker.item.image_url} alt={selectedLocker.item.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div>
                      <p className="text-wood-dark font-bold">{selectedLocker.item.name}</p>
                      <p className="text-wood-dark/60 text-sm">{selectedLocker.item.category}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-wood-dark/5 rounded-sm text-center">
                  <span className="material-symbols-outlined text-wood-dark/30 text-3xl">inbox</span>
                  <p className="text-wood-dark/60 text-sm mt-2">No item assigned</p>
                </div>
              )}

              {/* Claimant Info */}
              {selectedLocker.claimant && (
                <div className="p-4 bg-wood-dark/5 rounded-sm">
                  <h3 className="text-wood-dark font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">person</span>
                    Claimant
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-wood-dark/60 text-xs uppercase">Email</p>
                      <p className="text-wood-dark text-sm font-mono">{selectedLocker.claimant.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-wood-dark/60 text-xs uppercase">Student ID</p>
                      <p className="text-wood-dark text-sm font-mono">{selectedLocker.claimant.student_id || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Access Code */}
              {selectedLocker.password && selectedLocker.status !== 'available' && (
                <div className="p-4 bg-concordia-burgundy text-parchment text-center rounded-sm">
                  <p className="text-parchment/70 text-xs uppercase mb-1">Access Code</p>
                  <p className="text-3xl font-black font-display tracking-[0.3em]">{selectedLocker.password}</p>
                </div>
              )}

              {/* Timeline */}
              <div className="p-4 bg-wood-dark/5 rounded-sm">
                <h3 className="text-wood-dark font-bold uppercase tracking-wider mb-3">Timeline</h3>
                <div className="space-y-2 text-sm">
                  {selectedLocker.assigned_at && (
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-concordia-gold text-sm">schedule</span>
                      <span className="text-wood-dark/60">Assigned:</span>
                      <span className="text-wood-dark">{formatTime(selectedLocker.assigned_at)}</span>
                    </div>
                  )}
                  {selectedLocker.unlocked_at && (
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-blue-600 text-sm">lock_open</span>
                      <span className="text-wood-dark/60">Unlocked:</span>
                      <span className="text-wood-dark">{formatTime(selectedLocker.unlocked_at)}</span>
                    </div>
                  )}
                  {selectedLocker.collected_at && (
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-green-600 text-sm">done_all</span>
                      <span className="text-wood-dark/60">Collected:</span>
                      <span className="text-wood-dark">{formatTime(selectedLocker.collected_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            {selectedLocker.status !== 'available' && (
              <div className="p-6 border-t-2 border-wood-dark/20">
                <button
                  onClick={() => handleReleaseLocker(selectedLocker.locker_number)}
                  className="w-full py-3 bg-red-600 text-white font-bold uppercase tracking-widest border-2 border-black/20 shadow-[3px_3px_0_black] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">lock_reset</span>
                  Release Locker
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
