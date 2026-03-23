'use client';
import { useState, useEffect } from 'react';

interface Item {
  id: string;
  name: string;
  description?: string;
  category: string;
  location_name?: string;
  date_found?: string;
  image_url_clear?: string;
  image_url_blurred?: string;
  image_urls?: string[];
}

interface Claimant {
  id: string;
  email?: string;
  student_id?: string;
  trust_rating?: number;
}

interface PendingMatch {
  _id: string;
  session_id: string;
  user_id?: string;
  item_id: string;
  intake_data: {
    category?: string;
    date_lost?: string;
    location_name?: string;
    description?: string;
    unique_features?: string;
    image_urls?: string[];
  };
  semantic_score: number;
  trust_score: number;
  match_score: number;
  match_status: string;
  verification_result?: {
    match_confidence: number;
    matching_features: string[];
    discrepancies: string[];
  };
  created_at: string;
  item?: Item;
  claimant?: Claimant;
  claimant_images?: string[];
  has_multiple_claims: boolean;
  competing_claim_ids: string[];
  claim_count: number;
}

interface ReviewModalProps {
  match: PendingMatch;
  isOpen: boolean;
  onClose: () => void;
  onReview: (matchId: string, decision: 'approve' | 'reject', notes: string) => Promise<void>;
}

function ReviewModal({ match, isOpen, onClose, onReview }: ReviewModalProps) {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'evidence' | 'claimant' | 'analysis'>('evidence');

  if (!isOpen) return null;

  const handleReview = async (decision: 'approve' | 'reject') => {
    setIsSubmitting(true);
    try {
      await onReview(match._id, decision, notes);
      onClose();
    } catch (error) {
      console.error('Review failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 80) return { label: 'Extreme Match', color: 'text-concordia-burgundy' };
    if (score >= 60) return { label: 'Likely Match', color: 'text-blue-700' };
    if (score >= 40) return { label: 'Possible', color: 'text-wood-dark/60' };
    return { label: 'Unlikely', color: 'text-red-600' };
  };

  const confidence = getConfidenceLabel(match.match_score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-parchment w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border-4 border-wood-dark shadow-pixel">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-4 border-wood-dark/20 bg-concordia-burgundy">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-parchment text-3xl">gavel</span>
            <div>
              <h2 className="text-parchment text-2xl font-bold font-display uppercase tracking-wide">Case Review</h2>
              <p className="text-parchment/70 text-sm">{match.item?.name || 'Unknown Item'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-parchment/10 rounded-sm transition-colors">
            <span className="material-symbols-outlined text-parchment text-2xl">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-wood-dark/20">
          {(['evidence', 'claimant', 'analysis'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 text-sm font-bold uppercase tracking-wider transition-colors ${
                activeTab === tab
                  ? 'bg-wood-dark/10 text-concordia-burgundy border-b-2 border-concordia-burgundy'
                  : 'text-wood-dark/60 hover:bg-wood-dark/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'evidence' && (
            <div className="space-y-6">
              {/* Multiple Claims Warning */}
              {match.has_multiple_claims && (
                <div className="flex items-center gap-3 p-4 bg-concordia-gold/20 border-2 border-concordia-gold rounded-sm">
                  <span className="material-symbols-outlined text-burgundy-dark text-2xl">warning</span>
                  <div>
                    <p className="text-burgundy-dark font-bold uppercase">Multiple Claims Detected</p>
                    <p className="text-burgundy-dark/70 text-sm">{match.claim_count} people have claimed this item. Review carefully.</p>
                  </div>
                </div>
              )}

              {/* Image Comparison */}
              <div className="grid grid-cols-2 gap-6">
                {/* Claimant's Evidence */}
                <div>
                  <h3 className="text-wood-dark font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">person</span>
                    Claimant's Evidence
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {match.claimant_images && match.claimant_images.length > 0 ? (
                      match.claimant_images.map((url, i) => (
                        <div key={i} className="aspect-square bg-white border-2 border-wood-dark/20 overflow-hidden">
                          <img src={url} alt={`Claimant evidence ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 aspect-video bg-wood-dark/10 flex items-center justify-center">
                        <span className="text-wood-dark/40 font-mono">No images provided</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Found Item */}
                <div>
                  <h3 className="text-wood-dark font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">inventory_2</span>
                    Found Item
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {match.item?.image_url_clear ? (
                      <div className="col-span-2 aspect-video bg-white border-2 border-wood-dark/20 overflow-hidden">
                        <img src={match.item.image_url_clear} alt={match.item?.name} className="w-full h-full object-cover" />
                      </div>
                    ) : match.item?.image_urls && match.item.image_urls.length > 0 ? (
                      match.item.image_urls.slice(0, 4).map((url, i) => (
                        <div key={i} className="aspect-square bg-white border-2 border-wood-dark/20 overflow-hidden">
                          <img src={url} alt={`Found item ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 aspect-video bg-wood-dark/10 flex items-center justify-center">
                        <span className="text-wood-dark/40 font-mono">No images available</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 bg-wood-dark/5 border-l-4 border-concordia-burgundy">
                  <h4 className="text-wood-dark/60 text-xs font-bold uppercase mb-2">Claimant's Description</h4>
                  <p className="text-wood-dark">{match.intake_data?.description || 'No description'}</p>
                  {match.intake_data?.unique_features && (
                    <p className="text-concordia-burgundy text-sm mt-2">
                      <strong>Unique Features:</strong> {match.intake_data.unique_features}
                    </p>
                  )}
                </div>
                <div className="p-4 bg-wood-dark/5 border-l-4 border-wood-dark">
                  <h4 className="text-wood-dark/60 text-xs font-bold uppercase mb-2">Found Item Description</h4>
                  <p className="text-wood-dark">{match.item?.description || 'No description'}</p>
                  <p className="text-wood-dark/60 text-sm mt-2">
                    <strong>Location:</strong> {match.item?.location_name || 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'claimant' && (
            <div className="space-y-6">
              <div className="p-6 bg-wood-dark/5 rounded-sm">
                <h3 className="text-wood-dark font-bold uppercase tracking-wider mb-4">Claimant Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-wood-dark/60 text-xs uppercase mb-1">Email</p>
                    <p className="text-wood-dark font-mono">{match.claimant?.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-wood-dark/60 text-xs uppercase mb-1">Student ID</p>
                    <p className="text-wood-dark font-mono">{match.claimant?.student_id || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-wood-dark/60 text-xs uppercase mb-1">Trust Rating</p>
                    <p className="text-wood-dark font-bold">{match.claimant?.trust_rating?.toFixed(1) || '5.0'} / 5.0</p>
                  </div>
                  <div>
                    <p className="text-wood-dark/60 text-xs uppercase mb-1">Claim Date</p>
                    <p className="text-wood-dark font-mono">{new Date(match.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-wood-dark/5 rounded-sm">
                <h3 className="text-wood-dark font-bold uppercase tracking-wider mb-4">Claim Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-wood-dark/60 text-xs uppercase mb-1">Category</p>
                    <p className="text-wood-dark">{match.intake_data?.category || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-wood-dark/60 text-xs uppercase mb-1">Date Lost</p>
                    <p className="text-wood-dark font-mono">
                      {match.intake_data?.date_lost
                        ? new Date(match.intake_data.date_lost).toLocaleDateString()
                        : 'Not specified'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-wood-dark/60 text-xs uppercase mb-1">Location Lost</p>
                    <p className="text-wood-dark">{match.intake_data?.location_name || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {/* Scores */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-concordia-burgundy text-parchment text-center rounded-sm">
                  <p className="text-3xl font-black font-display">{Math.round(match.match_score)}%</p>
                  <p className="text-parchment/70 text-xs uppercase mt-1">Overall Match</p>
                </div>
                <div className="p-4 bg-wood-dark text-parchment text-center rounded-sm">
                  <p className="text-3xl font-black font-display">{Math.round(match.semantic_score * 100)}%</p>
                  <p className="text-parchment/70 text-xs uppercase mt-1">Semantic Score</p>
                </div>
                <div className="p-4 bg-concordia-gold text-burgundy-dark text-center rounded-sm">
                  <p className="text-3xl font-black font-display">{Math.round(match.trust_score)}%</p>
                  <p className="text-burgundy-dark/70 text-xs uppercase mt-1">Trust Score</p>
                </div>
              </div>

              {/* Verification Result */}
              {match.verification_result && (
                <div className="p-6 bg-wood-dark/5 rounded-sm">
                  <h3 className="text-wood-dark font-bold uppercase tracking-wider mb-4">AI Verification Analysis</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-wood-dark/60 text-xs uppercase mb-1">Match Confidence</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-wood-dark/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-concordia-burgundy"
                            style={{ width: `${match.verification_result.match_confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-wood-dark font-bold">
                          {Math.round(match.verification_result.match_confidence * 100)}%
                        </span>
                      </div>
                    </div>

                    {match.verification_result.matching_features.length > 0 && (
                      <div>
                        <p className="text-wood-dark/60 text-xs uppercase mb-1">Matching Features</p>
                        <div className="flex flex-wrap gap-2">
                          {match.verification_result.matching_features.map((feature, i) => (
                            <span key={i} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-sm">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {match.verification_result.discrepancies.length > 0 && (
                      <div>
                        <p className="text-wood-dark/60 text-xs uppercase mb-1">Discrepancies</p>
                        <div className="flex flex-wrap gap-2">
                          {match.verification_result.discrepancies.map((disc, i) => (
                            <span key={i} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-sm">
                              {disc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Confidence Assessment */}
              <div className="p-6 bg-wood-dark/5 rounded-sm">
                <h3 className="text-wood-dark font-bold uppercase tracking-wider mb-4">System Assessment</h3>
                <div className={`text-2xl font-bold ${confidence.color}`}>{confidence.label}</div>
                <p className="text-wood-dark/60 text-sm mt-2">
                  Based on semantic similarity, interrogation trust score, and verification results.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Actions */}
        <div className="p-6 border-t-4 border-wood-dark/20 bg-wood-dark/5">
          <div className="mb-4">
            <label className="block text-wood-dark text-xs font-bold uppercase tracking-wider mb-2">
              Review Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about your decision..."
              rows={2}
              className="w-full px-4 py-2 bg-white border-2 border-wood-dark/30 rounded-sm font-mono text-wood-dark resize-none focus:border-concordia-burgundy focus:outline-none"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => handleReview('reject')}
              disabled={isSubmitting}
              className="flex-1 py-4 bg-wood-dark text-parchment font-bold uppercase tracking-widest border-2 border-black/20 shadow-[3px_3px_0_black] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">close</span>
              Reject Match
            </button>
            <button
              onClick={() => handleReview('approve')}
              disabled={isSubmitting}
              className="flex-1 py-4 bg-concordia-burgundy text-parchment font-bold uppercase tracking-widest border-2 border-black/20 shadow-[3px_3px_0_black] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  Processing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">check_circle</span>
                  Approve Match
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CasesPage() {
  const [matches, setMatches] = useState<PendingMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<PendingMatch | null>(null);
  const [filter, setFilter] = useState<'all' | 'multiple_claims' | 'high_confidence'>('all');

  const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/matching/pending-review`);
      if (!response.ok) throw new Error('Failed to fetch pending matches');
      const data = await response.json();
      setMatches(data.matches || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError('Failed to load pending cases');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (matchId: string, decision: 'approve' | 'reject', notes: string) => {
    const response = await fetch(`${API_URL}/api/matching/review/${matchId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, notes })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Review failed');
    }

    // Refresh the list
    await fetchMatches();
  };

  const filteredMatches = matches.filter((match) => {
    if (filter === 'multiple_claims') return match.has_multiple_claims;
    if (filter === 'high_confidence') return match.match_score >= 80;
    return true;
  });

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'bg-concordia-burgundy';
    if (score >= 60) return 'bg-blue-600';
    if (score >= 40) return 'bg-wood-dark/40';
    return 'bg-red-600';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-concordia-gold text-4xl drop-shadow-md">gavel</span>
            <h1 className="text-parchment text-4xl md:text-5xl font-black leading-tight tracking-tight uppercase drop-shadow-[4px_4px_0_rgba(0,0,0,0.5)] font-display">
              Case Review
            </h1>
          </div>
          <p className="text-parchment/80 text-lg max-w-xl font-handwriting">
            <span className="text-concordia-gold font-bold">{matches.length} pending</span> cases awaiting your verdict
          </p>
        </div>
        <div className="flex gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-4 py-3 bg-parchment text-wood-dark font-bold uppercase tracking-widest rounded-sm border-2 border-wood-dark shadow-pixel-sm"
          >
            <option value="all">All Cases</option>
            <option value="multiple_claims">Multiple Claims</option>
            <option value="high_confidence">High Confidence</option>
          </select>
          <button
            onClick={fetchMatches}
            className="px-4 py-3 bg-parchment/10 text-parchment font-bold uppercase tracking-widest rounded-sm border-2 border-parchment/20 shadow-pixel-sm flex items-center gap-2 hover:bg-parchment/20 transition-all"
          >
            <span className="material-symbols-outlined">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-parchment p-8 md:p-12 shadow-pixel rounded-none border-4 border-wood-dark">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="material-symbols-outlined text-concordia-burgundy text-5xl animate-spin mb-4">sync</span>
            <p className="text-wood-dark font-mono uppercase tracking-wider">Loading cases...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="material-symbols-outlined text-red-600 text-5xl mb-4">error</span>
            <p className="text-red-700 font-mono uppercase tracking-wider mb-4">{error}</p>
            <button onClick={fetchMatches} className="px-4 py-2 bg-concordia-burgundy text-parchment font-bold uppercase rounded-sm">
              Retry
            </button>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="material-symbols-outlined text-wood-dark/40 text-5xl mb-4">check_circle</span>
            <p className="text-wood-dark/60 font-mono uppercase tracking-wider mb-2">No pending cases</p>
            <p className="text-wood-dark/40 text-sm">All cases have been reviewed</p>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[600px]">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-wood-dark text-parchment">
                  <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-widest">Evidence</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Details</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest w-48">Confidence</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wood-dark/20">
                {filteredMatches.map((match) => (
                  <tr key={match._id} className="hover:bg-wood-dark/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {/* Claimant image */}
                        <div className="size-16 bg-black/10 border-2 border-wood-dark/20 overflow-hidden">
                          {match.claimant_images && match.claimant_images[0] ? (
                            <img src={match.claimant_images[0]} alt="Claimant evidence" className="w-full h-full object-cover grayscale" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-wood-dark/30">person</span>
                            </div>
                          )}
                        </div>
                        <span className="text-wood-dark font-black text-xl">×</span>
                        {/* Found item image */}
                        <div className="size-16 bg-black/10 border-2 border-wood-dark/20 overflow-hidden">
                          {match.item?.image_url_clear ? (
                            <img src={match.item.image_url_clear} alt={match.item?.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-wood-dark/30">inventory_2</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-wood-dark font-bold text-lg font-display uppercase tracking-wide">
                            {match.item?.name || 'Unknown Item'}
                          </span>
                          {match.has_multiple_claims && (
                            <span className="px-2 py-0.5 bg-concordia-gold text-burgundy-dark text-[10px] font-bold rounded-sm animate-pulse">
                              {match.claim_count} CLAIMS
                            </span>
                          )}
                        </div>
                        <span className="text-concordia-burgundy text-sm font-bold mt-1">
                          Found: {match.item?.location_name || 'Unknown'}
                        </span>
                        <span className="text-desk-wood/60 text-xs font-mono mt-0.5">
                          Submitted: {formatDate(match.created_at)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-end">
                          <span className={`font-black text-[10px] uppercase ${
                            match.match_score >= 80 ? 'text-concordia-burgundy' :
                            match.match_score >= 60 ? 'text-blue-700' : 'text-wood-dark/60'
                          }`}>
                            {match.match_score >= 80 ? 'Extreme Match' :
                             match.match_score >= 60 ? 'Likely Match' : 'Possible'}
                          </span>
                          <span className="text-wood-dark font-bold text-lg font-display">{Math.round(match.match_score)}%</span>
                        </div>
                        <div className="w-full h-4 bg-black/10 border border-black/20 p-0.5">
                          <div
                            className={`h-full ${getConfidenceColor(match.match_score)}`}
                            style={{ width: `${match.match_score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedMatch(match)}
                        className="w-full py-2 bg-concordia-burgundy text-parchment text-[10px] font-black uppercase tracking-widest border-2 border-black/20 shadow-[2px_2px_0_black] active:translate-x-px active:translate-y-px active:shadow-none hover:brightness-110 transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedMatch && (
        <ReviewModal
          match={selectedMatch}
          isOpen={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onReview={handleReview}
        />
      )}
    </div>
  );
}
