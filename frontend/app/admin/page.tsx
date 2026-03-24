'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Stats {
  pending_matches: number;
  total_items: number;
  items_by_status: {
    unclaimed: number;
    matched: number;
    returned: number;
  };
  locker_stats: {
    total: number;
    available: number;
    assigned: number;
    unlocked: number;
    collected: number;
  };
  multiple_claims: number;
}

interface PendingMatch {
  _id: string;
  match_score: number;
  item?: {
    name: string;
    category: string;
  };
  created_at: string;
  has_multiple_claims: boolean;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentMatches, setRecentMatches] = useState<PendingMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch all data in parallel
      const [matchesRes, itemsRes, lockersRes] = await Promise.all([
        fetch(`${API_URL}/api/matching/pending-review`),
        fetch(`${API_URL}/api/items/`),
        fetch(`${API_URL}/api/lockers/stats`)
      ]);

      const matchesData = await matchesRes.json();
      const itemsData = await itemsRes.json();
      const lockersData = await lockersRes.ok ? await lockersRes.json() : { total_lockers: 10, available: 10, assigned: 0, unlocked: 0, collected: 0 };

      // Calculate item stats
      const itemsByStatus = {
        unclaimed: 0,
        matched: 0,
        returned: 0
      };
      itemsData.forEach((item: { status: string }) => {
        if (item.status === 'unclaimed') itemsByStatus.unclaimed++;
        else if (item.status === 'matched') itemsByStatus.matched++;
        else if (item.status === 'returned') itemsByStatus.returned++;
      });

      setStats({
        pending_matches: matchesData.pending_count || 0,
        total_items: itemsData.length || 0,
        items_by_status: itemsByStatus,
        locker_stats: {
          total: lockersData.total_lockers || 10,
          available: lockersData.available || 0,
          assigned: lockersData.assigned || 0,
          unlocked: lockersData.unlocked || 0,
          collected: lockersData.collected || 0
        },
        multiple_claims: matchesData.items_with_multiple_claims || 0
      });

      // Get recent pending matches (first 5)
      setRecentMatches((matchesData.matches || []).slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-concordia-gold text-3xl md:text-4xl drop-shadow-md">dashboard</span>
            <h1 className="text-parchment text-2xl md:text-4xl lg:text-5xl font-black leading-tight tracking-tight uppercase drop-shadow-[4px_4px_0_rgba(0,0,0,0.5)] font-display">
              Command Center
            </h1>
          </div>
          <p className="text-parchment/80 text-sm md:text-lg max-w-xl font-handwriting">
            <span className="text-concordia-gold font-bold">Welcome, Custodian</span> • Concordia Bureau of Missing Items
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="w-full sm:w-auto px-4 py-3 bg-parchment/10 text-parchment font-bold uppercase tracking-wide md:tracking-widest rounded-sm border-2 border-parchment/20 shadow-pixel-sm flex items-center justify-center gap-2 hover:bg-parchment/20 transition-all"
        >
          <span className="material-symbols-outlined">refresh</span>
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <span className="material-symbols-outlined text-concordia-gold text-5xl animate-spin mb-4">sync</span>
          <p className="text-parchment font-mono uppercase tracking-wider">Loading command center...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
            {/* Pending Reviews */}
            <Link href="/admin/cases">
              <div className="bg-concordia-burgundy p-4 sm:p-6 border-4 border-black/20 shadow-pixel hover:brightness-110 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <span className="material-symbols-outlined text-parchment/60 text-3xl group-hover:scale-110 transition-transform">pending_actions</span>
                  {stats?.multiple_claims && stats.multiple_claims > 0 && (
                    <span className="bg-concordia-gold text-burgundy-dark text-xs font-bold px-2 py-1 rounded-sm animate-pulse">
                      {stats.multiple_claims} CONFLICTS
                    </span>
                  )}
                </div>
                <p className="text-parchment text-3xl md:text-5xl font-black font-display">{stats?.pending_matches || 0}</p>
                <p className="text-parchment/60 text-xs md:text-sm font-bold uppercase tracking-wider mt-2">Pending Reviews</p>
              </div>
            </Link>

            {/* Total Items */}
            <Link href="/admin/inventory">
              <div className="bg-wood-dark p-4 sm:p-6 border-4 border-black/20 shadow-pixel hover:brightness-110 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <span className="material-symbols-outlined text-parchment/60 text-3xl group-hover:scale-110 transition-transform">inventory_2</span>
                </div>
                <p className="text-parchment text-3xl md:text-5xl font-black font-display">{stats?.total_items || 0}</p>
                <p className="text-parchment/60 text-xs md:text-sm font-bold uppercase tracking-wider mt-2">Total Evidence</p>
              </div>
            </Link>

            {/* Unclaimed Items */}
            <div className="bg-parchment p-4 sm:p-6 border-4 border-wood-dark shadow-pixel">
              <div className="flex items-start justify-between mb-4">
                <span className="material-symbols-outlined text-wood-dark/60 text-3xl">search</span>
              </div>
              <p className="text-wood-dark text-3xl md:text-5xl font-black font-display">{stats?.items_by_status.unclaimed || 0}</p>
              <p className="text-wood-dark/60 text-xs md:text-sm font-bold uppercase tracking-wider mt-2">Unclaimed Items</p>
            </div>

            {/* Locker Status */}
            <Link href="/admin/lockers">
              <div className="bg-concordia-gold p-4 sm:p-6 border-4 border-black/20 shadow-pixel hover:brightness-110 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <span className="material-symbols-outlined text-burgundy-dark/60 text-3xl group-hover:scale-110 transition-transform">lock_open</span>
                  {stats?.locker_stats.assigned && stats.locker_stats.assigned > 0 && (
                    <span className="bg-burgundy-dark text-parchment text-xs font-bold px-2 py-1 rounded-sm">
                      {stats.locker_stats.assigned} ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-burgundy-dark text-2xl md:text-4xl lg:text-5xl font-black font-display">{stats?.locker_stats.available || 0}/{stats?.locker_stats.total || 10}</p>
                <p className="text-burgundy-dark/60 text-xs md:text-sm font-bold uppercase tracking-wider mt-2">Lockers Available</p>
              </div>
            </Link>
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="bg-parchment p-4 sm:p-6 border-4 border-wood-dark shadow-pixel">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-wood-dark/20">
                <span className="material-symbols-outlined text-concordia-burgundy text-2xl">bolt</span>
                <h2 className="text-wood-dark text-xl font-bold font-display uppercase tracking-wide">Quick Actions</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Link href="/admin/cases">
                  <button className="w-full py-4 px-4 bg-concordia-burgundy text-parchment text-sm sm:text-base font-bold uppercase tracking-wide md:tracking-widest border-2 border-black/20 shadow-[3px_3px_0_black] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none hover:brightness-110 transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">gavel</span>
                    Review Cases
                  </button>
                </Link>

                <Link href="/admin/inventory">
                  <button className="w-full py-4 px-4 bg-wood-dark text-parchment text-sm sm:text-base font-bold uppercase tracking-wide md:tracking-widest border-2 border-black/20 shadow-[3px_3px_0_black] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none hover:brightness-110 transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">folder_managed</span>
                    Evidence Ledger
                  </button>
                </Link>

                <Link href="/admin/lockers">
                  <button className="w-full py-4 px-4 bg-concordia-gold text-burgundy-dark text-sm sm:text-base font-bold uppercase tracking-wide md:tracking-widest border-2 border-black/20 shadow-[3px_3px_0_black] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none hover:brightness-110 transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">lock</span>
                    Locker Control
                  </button>
                </Link>

                <Link href="/report">
                  <button className="w-full py-4 px-4 bg-parchment text-wood-dark text-sm sm:text-base font-bold uppercase tracking-wide md:tracking-widest border-2 border-wood-dark/30 shadow-[3px_3px_0_rgba(0,0,0,0.2)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none hover:bg-wood-dark/10 transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">add_box</span>
                    Register Item
                  </button>
                </Link>
              </div>
            </div>

            {/* Recent Pending Cases */}
            <div className="bg-parchment p-4 sm:p-6 border-4 border-wood-dark shadow-pixel">
              <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-wood-dark/20">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-concordia-burgundy text-2xl">pending_actions</span>
                  <h2 className="text-wood-dark text-xl font-bold font-display uppercase tracking-wide">Recent Cases</h2>
                </div>
                <Link href="/admin/cases" className="text-concordia-burgundy text-sm font-bold uppercase hover:underline">
                  View All
                </Link>
              </div>

              {recentMatches.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-wood-dark/30 text-4xl mb-2">check_circle</span>
                  <p className="text-wood-dark/60 font-mono uppercase tracking-wider">No pending cases</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentMatches.map((match) => (
                    <Link key={match._id} href="/admin/cases">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-wood-dark/5 hover:bg-wood-dark/10 transition-colors rounded-sm cursor-pointer">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-2 h-2 rounded-full ${match.has_multiple_claims ? 'bg-concordia-gold animate-pulse' : 'bg-concordia-burgundy'}`}></div>
                          <div className="min-w-0">
                            <p className="text-wood-dark font-bold text-sm uppercase truncate">{match.item?.name || 'Unknown Item'}</p>
                            <p className="text-wood-dark/60 text-xs">{formatDate(match.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:justify-end">
                          {match.has_multiple_claims && (
                            <span className="text-concordia-gold text-xs font-bold">CONFLICT</span>
                          )}
                          <span className="text-concordia-burgundy font-bold">{Math.round(match.match_score)}%</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="mt-8 bg-parchment p-4 sm:p-6 border-4 border-wood-dark shadow-pixel">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-wood-dark/20">
              <span className="material-symbols-outlined text-concordia-burgundy text-2xl">analytics</span>
              <h2 className="text-wood-dark text-xl font-bold font-display uppercase tracking-wide">System Status</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="text-center p-4 bg-concordia-burgundy/10 rounded-sm">
                <p className="text-concordia-burgundy text-2xl md:text-3xl font-black font-display">{stats?.items_by_status.unclaimed || 0}</p>
                <p className="text-wood-dark/60 text-xs font-bold uppercase mt-1">Unclaimed</p>
              </div>
              <div className="text-center p-4 bg-blue-100 rounded-sm">
                <p className="text-blue-800 text-2xl md:text-3xl font-black font-display">{stats?.items_by_status.matched || 0}</p>
                <p className="text-wood-dark/60 text-xs font-bold uppercase mt-1">Matched</p>
              </div>
              <div className="text-center p-4 bg-green-100 rounded-sm">
                <p className="text-green-800 text-2xl md:text-3xl font-black font-display">{stats?.items_by_status.returned || 0}</p>
                <p className="text-wood-dark/60 text-xs font-bold uppercase mt-1">Returned</p>
              </div>
              <div className="text-center p-4 bg-concordia-gold/20 rounded-sm">
                <p className="text-burgundy-dark text-2xl md:text-3xl font-black font-display">
                  {(stats?.locker_stats.assigned || 0) + (stats?.locker_stats.unlocked || 0)}
                </p>
                <p className="text-wood-dark/60 text-xs font-bold uppercase mt-1">Awaiting Pickup</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
