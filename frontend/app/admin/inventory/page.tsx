'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// Item type based on backend API response
interface Item {
  id: string;
  item_name: string;
  description?: string;
  category: string;
  status: string;
  date_found?: string;
  location_name?: string;
  location_description?: string;
  notes?: string;
  image_url_clear?: string;
  image_url_blurred?: string;
  image_urls?: string[];
  user_id?: string;
  contact_email?: string;
  created_at: string;
}

// Status badge styling
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'unclaimed':
      return {
        bg: 'bg-concordia-burgundy/10',
        text: 'text-concordia-burgundy',
        border: 'border-concordia-burgundy/20',
        icon: null,
        pulse: true,
      };
    case 'returned':
      return {
        bg: 'bg-green-900/10',
        text: 'text-green-900',
        border: 'border-green-900/20',
        icon: 'check',
        pulse: false,
      };
    case 'matched':
      return {
        bg: 'bg-blue-900/10',
        text: 'text-blue-900',
        border: 'border-blue-900/20',
        icon: 'link',
        pulse: false,
      };
    case 'resolved':
      return {
        bg: 'bg-gray-500/10',
        text: 'text-gray-700',
        border: 'border-gray-500/20',
        icon: 'done_all',
        pulse: false,
      };
    default:
      return {
        bg: 'bg-wood-dark/10',
        text: 'text-wood-dark',
        border: 'border-wood-dark/20',
        icon: null,
        pulse: false,
      };
  }
};

// Format date for display
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase(),
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
};

// Edit Modal Component
interface EditModalProps {
  item: Item;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: Partial<Item>) => Promise<void>;
}

function EditModal({ item, isOpen, onClose, onSave }: EditModalProps) {
  const [formData, setFormData] = useState({
    item_name: item.item_name,
    description: item.description || '',
    category: item.category,
    status: item.status,
    location_name: item.location_name || '',
    notes: item.notes || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData({
      item_name: item.item_name,
      description: item.description || '',
      category: item.category,
      status: item.status,
      location_name: item.location_name || '',
      notes: item.notes || '',
    });
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save item:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-parchment w-full max-w-lg mx-4 p-6 border-4 border-wood-dark shadow-pixel rounded-sm animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-wood-dark/20">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-concordia-burgundy text-2xl">edit_document</span>
            <h2 className="text-xl font-bold font-display uppercase tracking-wide text-wood-dark">Edit Evidence</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-wood-dark/10 rounded-sm transition-colors"
          >
            <span className="material-symbols-outlined text-wood-dark">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-wood-dark mb-1">Item Name</label>
            <input
              type="text"
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              className="w-full px-3 py-2 bg-white border-2 border-wood-dark/30 rounded-sm font-mono text-wood-dark focus:border-concordia-burgundy focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-wood-dark mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-white border-2 border-wood-dark/30 rounded-sm font-mono text-wood-dark focus:border-concordia-burgundy focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-wood-dark mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-white border-2 border-wood-dark/30 rounded-sm font-mono text-wood-dark focus:border-concordia-burgundy focus:outline-none"
              >
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="jewelry">Jewelry</option>
                <option value="bags">Bags</option>
                <option value="keys">Keys</option>
                <option value="books">Books</option>
                <option value="sports">Sports</option>
                <option value="food">Food</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-wood-dark mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-white border-2 border-wood-dark/30 rounded-sm font-mono text-wood-dark focus:border-concordia-burgundy focus:outline-none"
              >
                <option value="unclaimed">Unclaimed</option>
                <option value="matched">Matched</option>
                <option value="resolved">Resolved</option>
                <option value="returned">Returned</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-wood-dark mb-1">Location</label>
            <input
              type="text"
              value={formData.location_name}
              onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
              className="w-full px-3 py-2 bg-white border-2 border-wood-dark/30 rounded-sm font-mono text-wood-dark focus:border-concordia-burgundy focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-wood-dark mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-white border-2 border-wood-dark/30 rounded-sm font-mono text-wood-dark focus:border-concordia-burgundy focus:outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t-2 border-wood-dark/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-wood-dark/10 text-wood-dark font-bold uppercase tracking-widest border-2 border-wood-dark/20 hover:bg-wood-dark/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 bg-concordia-burgundy text-parchment font-bold uppercase tracking-widest border-2 border-black/20 shadow-[3px_3px_0_black] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">save</span>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EvidenceInventoryLedger() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

  // Fetch items from backend
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/items/`);
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      const data = await response.json();
      setItems(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('Failed to load inventory. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update item
  const handleUpdateItem = async (updatedData: Partial<Item>) => {
    if (!editingItem) return;

    const response = await fetch(`${API_URL}/api/items/${editingItem.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
      throw new Error('Failed to update item');
    }

    // Refresh items list
    await fetchItems();
  };

  // Delete item
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this evidence? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      // Refresh items list
      await fetchItems();
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item. Please try again.');
    }
  };

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
        <div className="flex gap-4 items-center">
          <button
            onClick={fetchItems}
            className="px-4 py-3 bg-parchment/10 text-parchment font-bold uppercase tracking-widest rounded-sm border-2 border-parchment/20 shadow-pixel-sm flex items-center gap-2 hover:bg-parchment/20 transition-all"
          >
            <span className="material-symbols-outlined">refresh</span>
            Refresh
          </button>
          <Link href="/report">
            <button className="px-6 py-3 bg-concordia-gold text-burgundy-dark font-black uppercase tracking-widest rounded-sm pixel-border shadow-[4px_4px_0_rgba(0,0,0,0.5)] flex items-center gap-2 hover:brightness-110 active:translate-y-1 active:shadow-none transition-all">
              <span className="material-symbols-outlined">add_box</span>
              Register New Item
            </button>
          </Link>
        </div>
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
                <p className="text-desk-wood/80 font-mono text-sm uppercase">Total Items: {items.length}</p>
                <p className="text-desk-wood/60 font-mono text-[10px] uppercase">Ref: CON-LOG-IV-2025</p>
            </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16">
                <span className="material-symbols-outlined text-concordia-burgundy text-5xl animate-spin mb-4">sync</span>
                <p className="text-wood-dark font-mono uppercase tracking-wider">Loading evidence records...</p>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="flex flex-col items-center justify-center py-16">
                <span className="material-symbols-outlined text-red-600 text-5xl mb-4">error</span>
                <p className="text-red-700 font-mono uppercase tracking-wider mb-4">{error}</p>
                <button
                  onClick={fetchItems}
                  className="px-4 py-2 bg-concordia-burgundy text-parchment font-bold uppercase tracking-wider rounded-sm hover:brightness-110"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <span className="material-symbols-outlined text-wood-dark/40 text-5xl mb-4">inventory_2</span>
                <p className="text-wood-dark/60 font-mono uppercase tracking-wider mb-2">No evidence on record</p>
                <p className="text-wood-dark/40 text-sm">Register new items to begin cataloging</p>
              </div>
            )}

            {/* Items Table */}
            {!isLoading && !error && items.length > 0 && (
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
                    {items.map((item) => {
                      const statusStyle = getStatusBadge(item.status);
                      const dateInfo = formatDate(item.date_found || item.created_at);

                      return (
                        <tr key={item.id} className="group hover:bg-wood-dark/5 transition-colors">
                          <td className="p-4">
                            <div className="size-20 bg-white border-2 border-wood-dark/20 p-1 shadow-sm overflow-hidden">
                              {item.image_url_clear ? (
                                <img
                                  className="w-full h-full object-cover pixelated"
                                  alt={item.item_name}
                                  src={item.image_url_clear}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-wood-dark/10">
                                  <span className="material-symbols-outlined text-wood-dark/40 text-2xl">image</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-wood-dark uppercase font-display tracking-wide text-base">{item.item_name}</div>
                            <div className="text-xs text-wood-dark/60 mt-1">{item.description || 'No description'}</div>
                            <div className="text-[10px] text-concordia-burgundy/80 mt-1 uppercase">{item.category}</div>
                          </td>
                          <td className="px-6 py-4">
                            {typeof dateInfo === 'string' ? dateInfo : <>{dateInfo.date} <br /> <span className="text-[10px] opacity-60">{dateInfo.time}</span></>}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">location_on</span> {item.location_name || 'Unknown'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 ${statusStyle.bg} ${statusStyle.text} rounded text-[10px] font-bold uppercase tracking-wider border ${statusStyle.border}`}>
                              {statusStyle.pulse && <span className="size-1.5 rounded-full bg-current animate-pulse"></span>}
                              {statusStyle.icon && <span className="material-symbols-outlined text-[12px]">{statusStyle.icon}</span>}
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right relative">
                            <button
                              onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                              className="text-wood-dark hover:text-concordia-burgundy transition-colors p-1"
                            >
                              <span className="material-symbols-outlined">more_vert</span>
                            </button>

                            {/* Dropdown Menu */}
                            {activeDropdown === item.id && (
                              <div className="absolute right-4 top-full mt-1 bg-white border-2 border-wood-dark/20 shadow-lg rounded-sm z-20 min-w-[140px]">
                                <button
                                  onClick={() => {
                                    setEditingItem(item);
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm font-bold uppercase tracking-wider hover:bg-wood-dark/10 flex items-center gap-2"
                                >
                                  <span className="material-symbols-outlined text-base">edit</span>
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    handleDeleteItem(item.id);
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm font-bold uppercase tracking-wider hover:bg-red-50 text-red-700 flex items-center gap-2"
                                >
                                  <span className="material-symbols-outlined text-base">delete</span>
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 pt-2 border-t-2 border-wood-dark/10 flex justify-end items-center text-wood-dark/50 font-mono text-xs uppercase">
                <span>Concordia Security Services • End of Log</span>
            </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <EditModal
          item={editingItem}
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleUpdateItem}
        />
      )}

      {/* Click outside to close dropdown */}
      {activeDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setActiveDropdown(null)}
        />
      )}
    </div>
  );
}
