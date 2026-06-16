'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  LogOut, Save, Plus, Trash2, Edit3, Eye, Settings, Users, FolderOpen,
  CalendarDays, FileText, Sliders, CheckCircle, Ban, RefreshCw,
  Clock, UserCheck, UserX, AlertCircle, Search, Shield, Video, History,
  Mail, ExternalLink, Upload, IndianRupee, X,
  Handshake, HeartHandshake, Globe, Brain,
} from 'lucide-react';
import { useStore } from '@/lib/store';


// ── Pillar Icon Options ──────────────────────────────────────
const PILLAR_ICON_OPTIONS = [
  { value: 'Handshake', label: 'Club Service', Icon: Handshake },
  { value: 'HeartHandshake', label: 'Community Service', Icon: HeartHandshake },
  { value: 'Globe', label: 'International Service', Icon: Globe },
  { value: 'Brain', label: 'Personality Development', Icon: Brain },
] as const;

const pillarIconMap: Record<string, React.ElementType> = {
  Handshake, HeartHandshake, Globe, Brain,
};

// ── Admin Auth State (password-based, persisted in sessionStorage) ──
const ADMIN_AUTH_KEY = 'rcb-admin-auth';
const ADMIN_AUTH_PW_KEY = 'rcb-admin-pw';
const ADMIN_PASSWORD = 'rotaract@2025';

function setAdminAuthenticated(password: string) {
  sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
  sessionStorage.setItem(ADMIN_AUTH_PW_KEY, password);
  adminAuthListeners.forEach(fn => fn());
}

function getAdminPassword(): string {
  return sessionStorage.getItem(ADMIN_AUTH_PW_KEY) || '';
}

function clearAdminAuth() {
  sessionStorage.removeItem(ADMIN_AUTH_KEY);
  sessionStorage.removeItem(ADMIN_AUTH_PW_KEY);
  adminAuthListeners.forEach(fn => fn());
}

// ── Subscribe to admin auth changes for useSyncExternalStore ──
const adminAuthListeners = new Set<() => void>();

function subscribeAdminAuth(callback: () => void) {
  adminAuthListeners.add(callback);
  return () => { adminAuthListeners.delete(callback); };
}

function getAdminAuthSnapshot(): boolean {
  return sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true';
}

function getAdminAuthServerSnapshot(): boolean {
  return false;
}

function adminHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-admin-password': getAdminPassword(),
  };
}

// ── File Upload Helper ───────────────────────────────────────
function FileUploadField({ label, value, folder, onUploaded }: {
  label: string;
  value?: string;
  folder: 'avatars' | 'videos';
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputClass = "w-full px-4 py-3 rounded-xl bg-dark-surface border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-accent transition-colors text-sm";
  const labelClass = "block text-sm font-medium text-white/70 mb-2";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const pw = getAdminPassword();
      const res = await fetch(`/api/upload?folder=${folder}`, {
        method: 'POST',
        headers: { 'x-admin-password': pw },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.data?.url) {
        onUploaded(data.data.url);
      } else {
        setError(data.error || data.message || 'Upload failed');
      }
    } catch { setError('Network error'); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <label className={labelClass}>{label}</label>
      {value && (
        <div className="mb-2">
          {folder === 'avatars' ? (
            <img src={value} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-white/10" />
          ) : (
            <a href={value} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">Current file</a>
          )}
        </div>
      )}
      <label className={`${inputClass} cursor-pointer flex items-center gap-2 ${uploading ? 'opacity-50' : ''}`}>
        <Upload size={14} className="text-white/40" />
        <span className="text-white/40 text-sm">{uploading ? 'Uploading...' : 'Choose file'}</span>
        <input type="file" className="hidden" accept={folder === 'avatars' ? 'image/*' : 'video/*,image/*'} onChange={handleUpload} disabled={uploading} />
      </label>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

// ── Types ────────────────────────────────────────────────────
interface AdminMember {
  member_id: string;
  full_name: string;
  email: string;
  username: string;
  role: string;
  is_approved: boolean;
  is_active: boolean;
  member_type: string;
  created_at: string;
  payment_method?: string | null;
  payment_proof_url?: string | null;
}

// ── Login Form ───────────────────────────────────────────────
function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!password) { setError('Enter the admin password'); return; }
    if (password === ADMIN_PASSWORD) {
      setAdminAuthenticated(password);
      onLogin();
    } else {
      setError('Incorrect password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="font-display text-3xl text-white">Admin Panel</h1>
          <p className="text-white/50 text-sm mt-2">Enter admin password to continue</p>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Admin password"
            className="w-full px-4 py-3 rounded-xl bg-dark-surface border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-accent transition-colors"
          />
          <button
            onClick={handleLogin}
            className="w-full py-3 bg-accent hover:bg-accent-light text-white rounded-xl font-semibold transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Members Management Tab ───────────────────────────────────
function MembersTab() {
  const [view, setView] = useState<'pending' | 'all'>('pending');
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [paymentModal, setPaymentModal] = useState<AdminMember | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = view === 'pending' ? '/admin/members/pending' : '/admin/members/all';
      const res = await fetch(`/api${endpoint}`, { headers: adminHeaders() });
      const data = await res.json();
      setMembers(data.data || []);
    } catch {
      setMessage({ text: 'Failed to fetch members', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const endpoint = view === 'pending' ? '/admin/members/pending' : '/admin/members/all';
        const res = await fetch(`/api${endpoint}`, { headers: adminHeaders() });
        const data = await res.json();
        if (!cancelled) setMembers(data.data || []);
      } catch {
        if (!cancelled) setMessage({ text: 'Failed to fetch members', type: 'error' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [view]);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const doAction = async (memberId: string, action: string, label: string) => {
    setActionLoading(memberId);
    try {
      const res = await fetch(`/api/admin/members/${memberId}/${action}`, {
        method: 'PATCH',
        headers: adminHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage(data.message || `${label} successful`, 'success');
        fetchMembers();
      } else {
        showMessage(data.message || `${label} failed`, 'error');
      }
    } catch {
      showMessage('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const doDelete = async (memberId: string, name: string) => {
    setActionLoading(memberId);
    try {
      const res = await fetch(`/api/admin/members/${memberId}/delete`, {
        method: 'DELETE',
        headers: adminHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage(data.message || `${name} deleted`, 'success');
        fetchMembers();
      } else {
        showMessage(data.message || 'Delete failed', 'error');
      }
    } catch {
      showMessage('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = members.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.username.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (m: AdminMember) => {
    if (!m.is_active) return <span className="px-2 py-0.5 text-[10px] rounded-full bg-red-500/10 text-red-400 font-medium">Blocked</span>;
    if (!m.is_approved) return <span className="px-2 py-0.5 text-[10px] rounded-full bg-yellow-500/10 text-yellow-400 font-medium">Pending</span>;
    return <span className="px-2 py-0.5 text-[10px] rounded-full bg-green-500/10 text-green-400 font-medium">Active</span>;
  };

  const getRoleBadge = (m: AdminMember) => {
    if (m.role === 'admin') return <span className="px-2 py-0.5 text-[10px] rounded-full bg-accent/10 text-accent font-medium">Admin</span>;
    return null;
  };

  return (
    <div className="space-y-4">
      {/* View toggle + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 p-1 rounded-xl bg-dark-surface border border-white/5">
          <button onClick={() => setView('pending')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'pending' ? 'bg-accent text-white' : 'text-white/50 hover:text-white'
            }`}>
            <Clock size={14} /> Pending
          </button>
          <button onClick={() => setView('all')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'all' ? 'bg-accent text-white' : 'text-white/50 hover:text-white'
            }`}>
            <Users size={14} /> All Members
          </button>
        </div>

        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, username..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-dark-surface border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-accent transition-colors text-sm"
          />
        </div>

        <button onClick={fetchMembers}
          className="p-2.5 rounded-xl bg-dark-surface border border-white/10 text-white/50 hover:text-white hover:border-accent transition-all">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-green-500/10 border border-green-500/20 text-green-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {message.text}
        </div>
      )}

      {/* Stats bar */}
      {view === 'all' && !loading && (
        <div className="flex gap-3 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-dark-surface text-white/50">
            Total: <span className="text-white font-medium">{members.length}</span>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-green-500/5 text-green-400/70">
            Active: <span className="text-green-400 font-medium">{members.filter(m => m.is_active && m.is_approved).length}</span>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-yellow-500/5 text-yellow-400/70">
            Pending: <span className="text-yellow-400 font-medium">{members.filter(m => m.is_active && !m.is_approved).length}</span>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-red-500/5 text-red-400/70">
            Blocked: <span className="text-red-400 font-medium">{members.filter(m => !m.is_active).length}</span>
          </span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-12">
          <Users size={32} className="text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">
            {view === 'pending' ? 'No pending members' : 'No members found'}
          </p>
        </div>
      )}

      {/* Member list */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map(m => {
            const initials = m.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            const isProcessing = actionLoading === m.member_id;
            const joinDate = new Date(m.created_at).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
            });

            return (
              <div key={m.member_id}
                className="bg-dark-card rounded-xl border border-white/5 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/80 to-accent-light flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-white font-medium text-sm truncate">{m.full_name}</h4>
                      {getStatusBadge(m)}
                      {getRoleBadge(m)}
                    </div>
                    <p className="text-white/30 text-xs truncate">
                      @{m.username} &middot; {m.email}
                    </p>
                    <p className="text-white/20 text-[10px]">
                      {m.member_type.replace('_', ' ')} &middot; Joined {joinDate}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isProcessing ? (
                    <div className="h-5 w-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                  ) : (
                    <>
                      {/* Payment info */}
                      {m.payment_method && (
                        <button onClick={() => setPaymentModal(m)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors text-xs font-medium"
                          title="Payment info">
                          <IndianRupee size={13} />
                        </button>
                      )}

                      {/* Approve — show if pending (active but not approved) */}
                      {m.is_active && !m.is_approved && m.role !== 'admin' && (
                        <button onClick={() => doAction(m.member_id, 'approve', 'Approve')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-xs font-medium"
                          title="Approve">
                          <UserCheck size={13} /> Approve
                        </button>
                      )}

                      {/* Reject — show if pending */}
                      {m.is_active && !m.is_approved && m.role !== 'admin' && (
                        <button onClick={() => doAction(m.member_id, 'reject', 'Reject')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-xs font-medium"
                          title="Reject">
                          <UserX size={13} /> Reject
                        </button>
                      )}

                      {/* Block — show if active & approved */}
                      {m.is_active && m.is_approved && m.role !== 'admin' && (
                        <button onClick={() => doAction(m.member_id, 'deactivate', 'Block')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-xs font-medium"
                          title="Block member">
                          <Ban size={13} /> Block
                        </button>
                      )}

                      {/* Unblock — show if inactive */}
                      {!m.is_active && m.role !== 'admin' && (
                        <button onClick={() => doAction(m.member_id, 'reactivate', 'Unblock')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-xs font-medium"
                          title="Unblock member">
                          <RefreshCw size={13} /> Unblock
                        </button>
                      )}

                      {/* Delete — always available for non-admin */}
                      {m.role !== 'admin' && (
                        <button onClick={() => {
                          if (confirm(`Permanently delete "${m.full_name}" and all their data? This cannot be undone.`)) {
                            doDelete(m.member_id, m.full_name);
                          }
                        }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-xs font-medium"
                          title="Permanently delete member">
                          <Trash2 size={13} /> Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Info Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setPaymentModal(null)}>
          <div className="bg-dark-card rounded-2xl border border-white/10 p-6 max-w-md w-full relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPaymentModal(null)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
              <X size={18} />
            </button>
            <h3 className="text-white font-semibold text-lg mb-1">Payment Details</h3>
            <p className="text-white/40 text-sm mb-4">{paymentModal.full_name}</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-dark-surface border border-white/5">
                <span className="text-white/50 text-sm">Method</span>
                <span className={`font-medium text-sm ${paymentModal.payment_method === 'online' ? 'text-accent' : 'text-amber-400'}`}>
                  {paymentModal.payment_method === 'online' ? 'Online' : 'Cash'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-dark-surface border border-white/5">
                <span className="text-white/50 text-sm">Amount</span>
                <span className="text-white font-bold">&#8377;3,500</span>
              </div>
              {paymentModal.payment_method === 'online' && paymentModal.payment_proof_url && (
                <div>
                  <p className="text-white/50 text-sm mb-2">Payment Proof</p>
                  <a href={paymentModal.payment_proof_url} target="_blank" rel="noreferrer">
                    <img src={paymentModal.payment_proof_url} alt="Payment proof"
                      className="w-full rounded-xl border border-white/10 max-h-80 object-contain bg-black" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Content Management Tab ───────────────────────────────────
interface SiteContentData {
  hero_title: string; hero_subtitle: string; hero_tagline: string;
  about_text: string; about_image: string; vision_text: string;
  pillars: { icon: string; title: string; description: string }[];
  stats: { value: string; label: string }[];
  contact_email: string; contact_phone: string; contact_address: string;
  social_links: { platform: string; url: string }[];
}

function ContentTab() {
  const [data, setData] = useState<SiteContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const inputClass = "w-full px-4 py-3 rounded-xl bg-dark-surface border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-accent transition-colors text-sm";
  const labelClass = "block text-sm font-medium text-white/70 mb-2";

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/content`, { headers: adminHeaders() });
        const json = await res.json();
        if (!cancelled && json.data) setData(json.data);
      } catch { if (!cancelled) showMsg('Failed to load content', 'error'); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const update = (partial: Partial<SiteContentData>) => {
    setData(d => d ? { ...d, ...partial } : d);
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/content`, {
        method: 'PATCH', headers: adminHeaders(),
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok) showMsg(json.message || 'Saved', 'success');
      else showMsg(json.message || 'Failed', 'error');
    } catch { showMsg('Network error', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" /></div>;
  if (!data) return <p className="text-white/30 text-sm text-center py-12">Content not found. Create the site_content table first.</p>;

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {message.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {message.text}
        </div>
      )}

      {/* Hero */}
      <div className="bg-dark-card rounded-2xl border border-white/5 p-6">
        <h3 className="text-lg font-semibold mb-4">Hero Section</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClass}>Title</label><input value={data.hero_title} onChange={e => update({ hero_title: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Subtitle</label><input value={data.hero_subtitle} onChange={e => update({ hero_subtitle: e.target.value })} className={inputClass} /></div>
        </div>
        <div className="mt-4"><label className={labelClass}>Tagline</label><input value={data.hero_tagline} onChange={e => update({ hero_tagline: e.target.value })} className={inputClass} /></div>
      </div>

      {/* About */}
      <div className="bg-dark-card rounded-2xl border border-white/5 p-6">
        <h3 className="text-lg font-semibold mb-4">About Section</h3>
        <textarea value={data.about_text} onChange={e => update({ about_text: e.target.value })} rows={5} className={`${inputClass} resize-none mb-4`} />
        <FileUploadField label="About Image" value={data.about_image} folder="avatars" onUploaded={url => update({ about_image: url })} />
      </div>

      {/* Vision */}
      <div className="bg-dark-card rounded-2xl border border-white/5 p-6">
        <h3 className="text-lg font-semibold mb-4">Vision</h3>
        <textarea value={data.vision_text} onChange={e => update({ vision_text: e.target.value })} rows={4} className={`${inputClass} resize-none`} />
      </div>

      {/* Stats */}
      <div className="bg-dark-card rounded-2xl border border-white/5 p-6">
        <h3 className="text-lg font-semibold mb-4">Stats</h3>
        <div className="space-y-3">
          {data.stats.map((stat, i) => (
            <div key={i} className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-dark-surface">
              <div><label className={labelClass}>Value</label><input value={stat.value} onChange={e => { const s = [...data.stats]; s[i] = { ...s[i], value: e.target.value }; update({ stats: s }); }} className={inputClass} /></div>
              <div><label className={labelClass}>Label</label><input value={stat.label} onChange={e => { const s = [...data.stats]; s[i] = { ...s[i], label: e.target.value }; update({ stats: s }); }} className={inputClass} /></div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-dark-card rounded-2xl border border-white/5 p-6">
        <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className={labelClass}>Email</label><input value={data.contact_email} onChange={e => update({ contact_email: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Phone</label><input value={data.contact_phone} onChange={e => update({ contact_phone: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Address</label><input value={data.contact_address} onChange={e => update({ contact_address: e.target.value })} className={inputClass} /></div>
        </div>
      </div>

      {/* Pillars */}
      <div className="bg-dark-card rounded-2xl border border-white/5 p-6">
        <h3 className="text-lg font-semibold mb-4">Pillars</h3>
        <div className="space-y-4">
          {data.pillars.map((pillar, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-dark-surface">
              <div>
                <label className={labelClass}>Icon</label>
                <div className="flex items-center gap-2">
                  {(() => { const PIcon = pillarIconMap[pillar.icon]; return PIcon ? <PIcon size={18} className="text-accent flex-shrink-0" /> : null; })()}
                  <select value={pillar.icon} onChange={e => { const p = [...data.pillars]; p[i] = { ...p[i], icon: e.target.value }; update({ pillars: p }); }} className={inputClass}>
                    <option value="">Select icon</option>
                    {PILLAR_ICON_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label} ({opt.value})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div><label className={labelClass}>Title</label><input value={pillar.title} onChange={e => { const p = [...data.pillars]; p[i] = { ...p[i], title: e.target.value }; update({ pillars: p }); }} className={inputClass} /></div>
              <div><label className={labelClass}>Description</label><input value={pillar.description} onChange={e => { const p = [...data.pillars]; p[i] = { ...p[i], description: e.target.value }; update({ pillars: p }); }} className={inputClass} /></div>
            </div>
          ))}
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-dark-card rounded-2xl border border-white/5 p-6">
        <h3 className="text-lg font-semibold mb-4">Social Links</h3>
        <div className="space-y-3">
          {data.social_links.map((link, i) => (
            <div key={i} className="grid grid-cols-3 gap-3">
              <input value={link.platform} onChange={e => { const l = [...data.social_links]; l[i] = { ...l[i], platform: e.target.value }; update({ social_links: l }); }} className={inputClass} placeholder="Platform" />
              <div className="col-span-2"><input value={link.url} onChange={e => { const l = [...data.social_links]; l[i] = { ...l[i], url: e.target.value }; update({ social_links: l }); }} className={inputClass} placeholder="URL" /></div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-accent hover:bg-accent-light text-white rounded-xl font-semibold text-sm transition-all flex items-center gap-2 disabled:opacity-50">
        <Save size={14} /> {saving ? 'Saving...' : 'Save All Changes'}
      </button>
    </div>
  );
}

// ── Board Management Tab ────────────────────────────────────
interface BodMember {
  bod_id: string;
  full_name: string;
  designation: string;
  linkedin_url?: string;
  instagram_url?: string;
  gmail?: string;
  avatar_url?: string;
  description?: string;
  riy_year: string;
  is_current: boolean;
  sort_order: number;
  was_previous_bod: boolean;
  previous_designation?: string;
  previous_description?: string;
  previous_riy_year?: string;
}

const EMPTY_BOD: Omit<BodMember, 'bod_id'> = {
  full_name: '', designation: '', linkedin_url: '', instagram_url: '',
  gmail: '', avatar_url: '', description: '', riy_year: new Date().getFullYear() + '-' + String(new Date().getFullYear() + 1).slice(2),
  is_current: true, sort_order: 0, was_previous_bod: false, previous_designation: '', previous_description: '', previous_riy_year: '',
};

function BoardTab() {
  const [members, setMembers] = useState<BodMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<BodMember>>({});
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState(EMPTY_BOD);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-dark-surface border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-accent transition-colors text-sm";
  const labelClass = "block text-sm font-medium text-white/70 mb-2";

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bod`, { headers: adminHeaders() });
      const data = await res.json();
      setMembers(data.data || []);
    } catch { showMsg('Failed to fetch BOD', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/bod`, { headers: adminHeaders() });
        const data = await res.json();
        if (!cancelled) setMembers(data.data || []);
      } catch { if (!cancelled) showMsg('Failed to fetch BOD', 'error'); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleCreate = async () => {
    try {
      const res = await fetch(`/api/bod`, {
        method: 'POST', headers: adminHeaders(),
        body: JSON.stringify(newForm),
      });
      const data = await res.json();
      if (res.ok) { showMsg(data.message || 'Created', 'success'); setAdding(false); setNewForm(EMPTY_BOD); fetchMembers(); }
      else showMsg(data.error || data.message || 'Failed', 'error');
    } catch { showMsg('Network error', 'error'); }
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`/api/bod/${id}`, {
        method: 'PATCH', headers: adminHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) { showMsg(data.message || 'Updated', 'success'); setEditing(null); fetchMembers(); }
      else showMsg(data.error || 'Failed', 'error');
    } catch { showMsg('Network error', 'error'); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/bod/${id}`, {
        method: 'DELETE', headers: adminHeaders(),
      });
      if (res.ok) { showMsg('Deleted', 'success'); fetchMembers(); }
      else showMsg('Delete failed', 'error');
    } catch { showMsg('Network error', 'error'); }
  };

  const startEdit = (m: BodMember) => {
    setEditing(m.bod_id);
    setForm({ full_name: m.full_name, designation: m.designation, linkedin_url: m.linkedin_url, instagram_url: m.instagram_url, gmail: m.gmail, avatar_url: m.avatar_url, description: m.description, riy_year: m.riy_year, is_current: m.is_current, sort_order: m.sort_order ?? 0, was_previous_bod: m.was_previous_bod ?? false, previous_designation: m.previous_designation ?? '', previous_description: m.previous_description ?? '', previous_riy_year: m.previous_riy_year ?? '' });
  };

  const renderForm = (
    values: Record<string, unknown>,
    onChange: (key: string, val: unknown) => void,
    onSave: () => void,
    onCancel: () => void,
  ) => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div><label className={labelClass}>Full Name *</label><input value={String(values.full_name || '')} onChange={e => onChange('full_name', e.target.value)} className={inputClass} /></div>
        <div><label className={labelClass}>Designation *</label><input value={String(values.designation || '')} onChange={e => onChange('designation', e.target.value)} className={inputClass} placeholder="e.g. President, Secretary" /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div><label className={labelClass}>Instagram URL</label><input value={String(values.instagram_url || '')} onChange={e => onChange('instagram_url', e.target.value)} className={inputClass} placeholder="https://instagram.com/..." /></div>
        <div><label className={labelClass}>LinkedIn URL</label><input value={String(values.linkedin_url || '')} onChange={e => onChange('linkedin_url', e.target.value)} className={inputClass} placeholder="https://linkedin.com/in/..." /></div>
        <div><label className={labelClass}>Gmail</label><input value={String(values.gmail || '')} onChange={e => onChange('gmail', e.target.value)} className={inputClass} placeholder="name@gmail.com" /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FileUploadField label="Avatar" value={String(values.avatar_url || '')} folder="avatars" onUploaded={url => onChange('avatar_url', url)} />
        <div><label className={labelClass}>RIY Year *</label><input value={String(values.riy_year || '')} onChange={e => onChange('riy_year', e.target.value)} className={inputClass} placeholder="2025-26" /></div>
      </div>
      <div><label className={labelClass}>Description</label><textarea value={String(values.description || '')} onChange={e => onChange('description', e.target.value)} className={`${inputClass} resize-none`} rows={2} /></div>
      <div className="flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
          <input type="checkbox" checked={Boolean(values.is_current)} onChange={e => onChange('is_current', e.target.checked)} className="accent-accent" /> Current BOD
        </label>
        <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
          <input type="checkbox" checked={Boolean(values.was_previous_bod)} onChange={e => onChange('was_previous_bod', e.target.checked)} className="accent-accent" /> Was in Previous BOD
        </label>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-white/70">Sort Order</label>
          <input type="number" value={values.sort_order !== undefined && values.sort_order !== null ? String(values.sort_order) : '0'} onChange={e => onChange('sort_order', e.target.value ? Number(e.target.value) : 0)} className="w-20 px-3 py-2 rounded-xl bg-dark-surface border border-white/10 text-white outline-none focus:border-accent transition-colors text-sm" />
        </div>
      </div>
      {Boolean(values.was_previous_bod) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
          <div><label className={labelClass}>Previous RIY Year</label><input value={String(values.previous_riy_year || '')} onChange={e => onChange('previous_riy_year', e.target.value)} className={inputClass} placeholder="2024-25" /></div>
          <div><label className={labelClass}>Previous Designation</label><input value={String(values.previous_designation || '')} onChange={e => onChange('previous_designation', e.target.value)} className={inputClass} placeholder="e.g. Secretary, Treasurer" /></div>
          <div className="md:col-span-1"><label className={labelClass}>Previous BOD Description</label><textarea value={String(values.previous_description || '')} onChange={e => onChange('previous_description', e.target.value)} className={`${inputClass} resize-none`} rows={2} placeholder="Brief description of previous role" /></div>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={onSave} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium">Save</button>
        <button onClick={onCancel} className="px-4 py-2 bg-dark-surface text-white/50 rounded-lg text-sm">Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Board of Directors ({members.length})</h3>
        <div className="flex gap-2">
          <button onClick={fetchMembers} className="p-2.5 rounded-xl bg-dark-surface border border-white/10 text-white/50 hover:text-white hover:border-accent transition-all">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => { setAdding(true); setNewForm(EMPTY_BOD); }}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-light text-white rounded-xl text-sm font-medium transition-colors">
            <Plus size={14} /> Add BOD Member
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {message.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {message.text}
        </div>
      )}

      {adding && (
        <div className="bg-dark-card rounded-2xl border border-accent/20 p-5">
          <h4 className="text-sm font-semibold text-accent mb-3">New BOD Member</h4>
          {renderForm(
            newForm as unknown as Record<string, unknown>,
            (k, v) => setNewForm(prev => ({ ...prev, [k]: v })),
            handleCreate,
            () => setAdding(false),
          )}
        </div>
      )}

      {loading && <div className="flex justify-center py-12"><div className="h-6 w-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" /></div>}

      {!loading && members.length === 0 && !adding && (
        <div className="text-center py-12"><Users size={32} className="text-white/10 mx-auto mb-3" /><p className="text-white/30 text-sm">No BOD members yet</p></div>
      )}

      {!loading && members.map(m => (
        <div key={m.bod_id} className="bg-dark-card rounded-2xl border border-white/5 p-5">
          {editing === m.bod_id ? (
            renderForm(
              form as unknown as Record<string, unknown>,
              (k, v) => setForm(prev => ({ ...prev, [k]: v })),
              () => handleUpdate(m.bod_id),
              () => setEditing(null),
            )
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/80 to-accent-light flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {m.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white">{m.full_name}</h4>
                    {m.is_current && <span className="px-2 py-0.5 text-[10px] rounded-full bg-green-500/10 text-green-400 font-medium">Current</span>}
                    {m.was_previous_bod && <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-500/10 text-blue-400 font-medium">Prev BOD</span>}
                  </div>
                  <p className="text-sm text-white/50">{m.designation} &middot; {m.riy_year} &middot; <span className="text-white/30">#{m.sort_order ?? 0}</span></p>
                  {m.was_previous_bod && m.previous_designation && (
                    <p className="text-xs text-blue-400/60">Previously: {m.previous_designation}</p>
                  )}
                  <div className="flex gap-2 mt-1">
                    {m.instagram_url && <a href={m.instagram_url} target="_blank" rel="noreferrer" className="text-white/30 hover:text-accent"><ExternalLink size={12} /></a>}
                    {m.linkedin_url && <a href={m.linkedin_url} target="_blank" rel="noreferrer" className="text-white/30 hover:text-accent"><ExternalLink size={12} /></a>}
                    {m.gmail && <a href={`mailto:${m.gmail}`} className="text-white/30 hover:text-accent"><Mail size={12} /></a>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(m)} className="p-2 rounded-lg text-white/50 hover:text-accent hover:bg-white/5"><Edit3 size={14} /></button>
                <button onClick={() => handleDelete(m.bod_id)} className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/5"><Trash2 size={14} /></button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Legacy Management Tab ───────────────────────────────────
interface LegacyYear {
  legacy_id: string;
  riy_year: string;
  year_video_url?: string;
  bod_members?: BodMember[];
}

function LegacyTab() {
  const [years, setYears] = useState<LegacyYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ riy_year: '', year_video_url: '' });
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const inputClass = "w-full px-4 py-3 rounded-xl bg-dark-surface border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-accent transition-colors text-sm";
  const labelClass = "block text-sm font-medium text-white/70 mb-2";

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const fetchYears = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/legacy`, { headers: adminHeaders() });
      const data = await res.json();
      setYears(data.data || []);
    } catch { showMsg('Failed to fetch legacy data', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/legacy`, { headers: adminHeaders() });
        const data = await res.json();
        if (!cancelled) setYears(data.data || []);
      } catch { if (!cancelled) showMsg('Failed to fetch legacy data', 'error'); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleCreate = async () => {
    try {
      const res = await fetch(`/api/legacy`, {
        method: 'POST', headers: adminHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) { showMsg(data.message || 'Created', 'success'); setAdding(false); setForm({ riy_year: '', year_video_url: '' }); fetchYears(); }
      else showMsg(data.error || data.message || 'Failed', 'error');
    } catch { showMsg('Network error', 'error'); }
  };

  const handleUpdate = async (riyYear: string) => {
    try {
      const res = await fetch(`/api/legacy/${riyYear}`, {
        method: 'PATCH', headers: adminHeaders(),
        body: JSON.stringify({ year_video_url: form.year_video_url }),
      });
      const data = await res.json();
      if (res.ok) { showMsg(data.message || 'Updated', 'success'); setEditing(null); fetchYears(); }
      else showMsg(data.error || 'Failed', 'error');
    } catch { showMsg('Network error', 'error'); }
  };

  const handleDelete = async (riyYear: string) => {
    try {
      const res = await fetch(`/api/legacy/${riyYear}`, {
        method: 'DELETE', headers: adminHeaders(),
      });
      if (res.ok) { showMsg('Deleted', 'success'); fetchYears(); }
      else showMsg('Delete failed', 'error');
    } catch { showMsg('Network error', 'error'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Legacy Years ({years.length})</h3>
        <div className="flex gap-2">
          <button onClick={fetchYears} className="p-2.5 rounded-xl bg-dark-surface border border-white/10 text-white/50 hover:text-white hover:border-accent transition-all">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => { setAdding(true); setForm({ riy_year: '', year_video_url: '' }); }}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-light text-white rounded-xl text-sm font-medium transition-colors">
            <Plus size={14} /> Add Legacy Year
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {message.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {message.text}
        </div>
      )}

      <p className="text-xs text-white/30">Legacy years link to BOD members via RIY year. Add BOD members in the Board tab with matching year.</p>

      {adding && (
        <div className="bg-dark-card rounded-2xl border border-accent/20 p-5 space-y-3">
          <h4 className="text-sm font-semibold text-accent">New Legacy Year</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className={labelClass}>RIY Year *</label><input value={form.riy_year} onChange={e => setForm(f => ({ ...f, riy_year: e.target.value }))} className={inputClass} placeholder="2024-25" /></div>
            <FileUploadField label="Year Video" value={form.year_video_url} folder="videos" onUploaded={url => setForm(f => ({ ...f, year_video_url: url }))} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium">Create</button>
            <button onClick={() => setAdding(false)} className="px-4 py-2 bg-dark-surface text-white/50 rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      )}

      {loading && <div className="flex justify-center py-12"><div className="h-6 w-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" /></div>}

      {!loading && years.length === 0 && !adding && (
        <div className="text-center py-12"><History size={32} className="text-white/10 mx-auto mb-3" /><p className="text-white/30 text-sm">No legacy years yet</p></div>
      )}

      {!loading && years.map(y => (
        <div key={y.legacy_id} className="bg-dark-card rounded-2xl border border-white/5 p-5">
          {editing === y.riy_year ? (
            <div className="space-y-3">
              <FileUploadField label="Year Video" value={form.year_video_url} folder="videos" onUploaded={url => setForm(f => ({ ...f, year_video_url: url }))} />
              <div className="flex gap-2">
                <button onClick={() => handleUpdate(y.riy_year)} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium">Save</button>
                <button onClick={() => setEditing(null)} className="px-4 py-2 bg-dark-surface text-white/50 rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/80 to-accent-light flex items-center justify-center text-white text-xs font-bold">
                    {y.riy_year.slice(0, 4)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">RIY {y.riy_year}</h4>
                    {y.year_video_url && <a href={y.year_video_url} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline flex items-center gap-1"><Video size={10} /> Video</a>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(y.riy_year); setForm({ riy_year: y.riy_year, year_video_url: y.year_video_url || '' }); }} className="p-2 rounded-lg text-white/50 hover:text-accent hover:bg-white/5"><Edit3 size={14} /></button>
                  <button onClick={() => handleDelete(y.riy_year)} className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/5"><Trash2 size={14} /></button>
                </div>
              </div>
              {y.bod_members && y.bod_members.length > 0 && (
                <div className="mt-2 pl-13">
                  <p className="text-xs text-white/40 mb-1">BOD Members ({y.bod_members.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {y.bod_members.map(b => (
                      <span key={b.bod_id} className="px-2 py-1 text-xs rounded-lg bg-dark-surface text-white/60">{b.full_name} — {b.designation}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Multi-File Upload Helper ─────────────────────────────────
function MultiFileUpload({ label, urls, folder, onUpdated }: {
  label: string;
  urls: string[];
  folder: 'avatars' | 'videos';
  onUpdated: (urls: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const labelClass = "block text-sm font-medium text-white/70 mb-2";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const newUrls = [...urls];
    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`/api/upload?folder=${folder}`, {
          method: 'POST',
          headers: { 'x-admin-password': getAdminPassword() },
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.data?.url) newUrls.push(data.data.url);
      } catch { /* skip failed */ }
    }
    onUpdated(newUrls);
    setUploading(false);
  };

  const remove = (idx: number) => onUpdated(urls.filter((_, i) => i !== idx));

  return (
    <div>
      <label className={labelClass}>{label} ({urls.length})</label>
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {urls.map((url, i) => (
            <div key={i} className="relative group">
              {folder === 'avatars' ? (
                <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-white/10" />
              ) : (
                <video src={url} className="w-24 h-16 rounded-lg object-cover border border-white/10" />
              )}
              <button onClick={() => remove(i)} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
            </div>
          ))}
        </div>
      )}
      <label className="w-full px-4 py-3 rounded-xl bg-dark-surface border border-white/10 text-white/40 text-sm cursor-pointer flex items-center gap-2 hover:border-accent transition-colors">
        <Upload size={14} /> {uploading ? 'Uploading...' : `Add ${folder === 'avatars' ? 'images' : 'videos'}`}
        <input type="file" className="hidden" accept={folder === 'avatars' ? 'image/*' : 'video/*'} multiple onChange={handleUpload} disabled={uploading} />
      </label>
    </div>
  );
}

// ── FOMO Management Tab ─────────────────────────────────────
interface FomoItem {
  fomo_id: string;
  category: string;
  name: string;
  description?: string;
  thumbnail?: string;
  images?: string[];
  videos?: string[];
  event_id?: string;
  events?: { event_id: string; event_name: string; event_date?: string } | null;
}

const EMPTY_FOMO = {
  category: '', name: '', description: '', thumbnail: '', images: [] as string[], videos: [] as string[], event_id: '',
};

function FomoTab() {
  const [items, setItems] = useState<FomoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState(EMPTY_FOMO);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const inputClass = "w-full px-4 py-3 rounded-xl bg-dark-surface border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-accent transition-colors text-sm";
  const labelClass = "block text-sm font-medium text-white/70 mb-2";

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/fomo`, { headers: adminHeaders() });
      const data = await res.json();
      setItems(data.data || []);
    } catch { showMsg('Failed to fetch FOMO', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/fomo`, { headers: adminHeaders() });
        const data = await res.json();
        if (!cancelled) setItems(data.data || []);
      } catch { if (!cancelled) showMsg('Failed to fetch FOMO', 'error'); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleCreate = async () => {
    try {
      const payload = { ...newForm };
      if (!payload.event_id) delete (payload as Record<string, unknown>).event_id;
      const res = await fetch(`/api/fomo`, {
        method: 'POST', headers: adminHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) { showMsg(data.message || 'Created', 'success'); setAdding(false); setNewForm(EMPTY_FOMO); fetchItems(); }
      else showMsg(data.error || data.message || 'Failed', 'error');
    } catch { showMsg('Network error', 'error'); }
  };

  const handleUpdate = async (id: string) => {
    try {
      const payload = { ...form };
      if (!payload.event_id) delete payload.event_id;
      const res = await fetch(`/api/fomo/${id}`, {
        method: 'PATCH', headers: adminHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) { showMsg(data.message || 'Updated', 'success'); setEditing(null); fetchItems(); }
      else showMsg(data.error || 'Failed', 'error');
    } catch { showMsg('Network error', 'error'); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/fomo/${id}`, {
        method: 'DELETE', headers: adminHeaders(),
      });
      if (res.ok) { showMsg('Deleted', 'success'); fetchItems(); }
      else showMsg('Delete failed', 'error');
    } catch { showMsg('Network error', 'error'); }
  };

  const startEdit = (f: FomoItem) => {
    setEditing(f.fomo_id);
    setForm({
      category: f.category, name: f.name, description: f.description || '',
      thumbnail: f.thumbnail || '', images: f.images || [], videos: f.videos || [], event_id: f.event_id || '',
    });
  };

  const renderForm = (
    values: Record<string, unknown>,
    onChange: (key: string, val: unknown) => void,
    onSave: () => void,
    onCancel: () => void,
  ) => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div><label className={labelClass}>Name *</label><input value={String(values.name || '')} onChange={e => onChange('name', e.target.value)} className={inputClass} /></div>
        <div><label className={labelClass}>Category *</label><input value={String(values.category || '')} onChange={e => onChange('category', e.target.value)} className={inputClass} placeholder="e.g. Service, Fun, Sports" /></div>
        <div><label className={labelClass}>Event ID (optional)</label><input value={String(values.event_id || '')} onChange={e => onChange('event_id', e.target.value)} className={inputClass} placeholder="UUID of linked event" /></div>
      </div>
      <div><label className={labelClass}>Description</label><textarea value={String(values.description || '')} onChange={e => onChange('description', e.target.value)} className={`${inputClass} resize-none`} rows={2} /></div>
      <FileUploadField label="Thumbnail" value={String(values.thumbnail || '')} folder="avatars" onUploaded={url => onChange('thumbnail', url)} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <MultiFileUpload label="Photos" urls={(values.images as string[]) || []} folder="avatars" onUpdated={urls => onChange('images', urls)} />
        <MultiFileUpload label="Videos" urls={(values.videos as string[]) || []} folder="videos" onUpdated={urls => onChange('videos', urls)} />
      </div>
      <div className="flex gap-2">
        <button onClick={onSave} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium">Save</button>
        <button onClick={onCancel} className="px-4 py-2 bg-dark-surface text-white/50 rounded-lg text-sm">Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">FOMO Posts ({items.length})</h3>
        <div className="flex gap-2">
          <button onClick={fetchItems} className="p-2.5 rounded-xl bg-dark-surface border border-white/10 text-white/50 hover:text-white hover:border-accent transition-all">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => { setAdding(true); setNewForm(EMPTY_FOMO); }}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-light text-white rounded-xl text-sm font-medium transition-colors">
            <Plus size={14} /> Add FOMO
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {message.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {message.text}
        </div>
      )}

      {adding && (
        <div className="bg-dark-card rounded-2xl border border-accent/20 p-5">
          <h4 className="text-sm font-semibold text-accent mb-3">New FOMO Post</h4>
          {renderForm(
            newForm as unknown as Record<string, unknown>,
            (k, v) => setNewForm(prev => ({ ...prev, [k]: v } as typeof EMPTY_FOMO)),
            handleCreate,
            () => setAdding(false),
          )}
        </div>
      )}

      {loading && <div className="flex justify-center py-12"><div className="h-6 w-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" /></div>}

      {!loading && items.length === 0 && !adding && (
        <div className="text-center py-12"><FolderOpen size={32} className="text-white/10 mx-auto mb-3" /><p className="text-white/30 text-sm">No FOMO posts yet</p></div>
      )}

      {!loading && items.map(f => (
        <div key={f.fomo_id} className="bg-dark-card rounded-2xl border border-white/5 p-5">
          {editing === f.fomo_id ? (
            renderForm(
              form,
              (k, v) => setForm(prev => ({ ...prev, [k]: v })),
              () => handleUpdate(f.fomo_id),
              () => setEditing(null),
            )
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {(f.thumbnail || f.images?.[0]) ? (
                  <img src={f.thumbnail || f.images![0]} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/80 to-accent-light flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {f.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white">{f.name}</h4>
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-accent/10 text-accent font-medium">{f.category}</span>
                  </div>
                  <p className="text-xs text-white/30">
                    {f.images?.length || 0} photos · {f.videos?.length || 0} videos
                    {f.events?.event_name && ` · ${f.events.event_name}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(f)} className="p-2 rounded-lg text-white/50 hover:text-accent hover:bg-white/5"><Edit3 size={14} /></button>
                <button onClick={() => handleDelete(f.fomo_id)} className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/5"><Trash2 size={14} /></button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Events Management Tab ───────────────────────────────────
interface EventItem {
  event_id: string;
  event_name: string;
  event_date?: string;
  event_time?: string;
  event_place?: string;
  event_strength?: number;
  open_to_all: boolean;
  event_avenue?: string;
  event_description?: string;
  event_images?: string[];
  event_videos?: string[];
}

const EMPTY_EVENT = {
  event_name: '', event_date: '', event_time: '', event_place: '',
  event_strength: undefined as number | undefined, open_to_all: false,
  event_avenue: '', event_description: '', event_images: [] as string[], event_videos: [] as string[],
};

function EventsTab() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState(EMPTY_EVENT);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const inputClass = "w-full px-4 py-3 rounded-xl bg-dark-surface border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-accent transition-colors text-sm";
  const labelClass = "block text-sm font-medium text-white/70 mb-2";

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events`, { headers: adminHeaders() });
      const data = await res.json();
      setEvents(data.data || []);
    } catch { showMsg('Failed to fetch events', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/events`, { headers: adminHeaders() });
        const data = await res.json();
        if (!cancelled) setEvents(data.data || []);
      } catch { if (!cancelled) showMsg('Failed to fetch events', 'error'); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleCreate = async () => {
    try {
      const payload = { ...newForm };
      if (!payload.event_strength) delete payload.event_strength;
      const res = await fetch(`/api/events`, {
        method: 'POST', headers: adminHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) { showMsg(data.message || 'Created', 'success'); setAdding(false); setNewForm(EMPTY_EVENT); fetchEvents(); }
      else showMsg(data.error || data.message || 'Failed', 'error');
    } catch { showMsg('Network error', 'error'); }
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PATCH', headers: adminHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) { showMsg(data.message || 'Updated', 'success'); setEditing(null); fetchEvents(); }
      else showMsg(data.error || 'Failed', 'error');
    } catch { showMsg('Network error', 'error'); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'DELETE', headers: adminHeaders(),
      });
      if (res.ok) { showMsg('Deleted', 'success'); fetchEvents(); }
      else showMsg('Delete failed', 'error');
    } catch { showMsg('Network error', 'error'); }
  };

  const startEdit = (e: EventItem) => {
    setEditing(e.event_id);
    setForm({
      event_name: e.event_name, event_date: e.event_date || '', event_time: e.event_time || '',
      event_place: e.event_place || '', event_strength: e.event_strength, open_to_all: e.open_to_all,
      event_avenue: e.event_avenue || '', event_description: e.event_description || '',
      event_images: e.event_images || [], event_videos: e.event_videos || [],
    });
  };

  const renderForm = (
    values: Record<string, unknown>,
    onChange: (key: string, val: unknown) => void,
    onSave: () => void,
    onCancel: () => void,
  ) => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div><label className={labelClass}>Event Name *</label><input value={String(values.event_name || '')} onChange={e => onChange('event_name', e.target.value)} className={inputClass} /></div>
        <div><label className={labelClass}>Date</label><input type="date" value={String(values.event_date || '')} onChange={e => onChange('event_date', e.target.value)} className={inputClass} /></div>
        <div><label className={labelClass}>Time</label><input value={String(values.event_time || '')} onChange={e => onChange('event_time', e.target.value)} className={inputClass} placeholder="10:00 AM" /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div><label className={labelClass}>Place</label><input value={String(values.event_place || '')} onChange={e => onChange('event_place', e.target.value)} className={inputClass} /></div>
        <div><label className={labelClass}>Avenue</label>
          <select value={String(values.event_avenue || '')} onChange={e => onChange('event_avenue', e.target.value)} className={inputClass}>
            <option value="">Select avenue</option>
            <option value="Community Service">Community Service</option>
            <option value="Club Service">Club Service</option>
            <option value="Professional Development">Professional Development</option>
            <option value="International Service">International Service</option>
            <option value="Sports & Recreation">Sports & Recreation</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div><label className={labelClass}>Expected Strength</label><input type="number" value={values.event_strength !== undefined && values.event_strength !== null ? String(values.event_strength) : ''} onChange={e => onChange('event_strength', e.target.value ? Number(e.target.value) : undefined)} className={inputClass} /></div>
      </div>
      <div><label className={labelClass}>Description</label><textarea value={String(values.event_description || '')} onChange={e => onChange('event_description', e.target.value)} className={`${inputClass} resize-none`} rows={3} /></div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
          <input type="checkbox" checked={Boolean(values.open_to_all)} onChange={e => onChange('open_to_all', e.target.checked)} className="accent-accent" /> Open to All
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FileUploadField label="Event Image" value={(values.event_images as string[])?.[0] || ''} folder="avatars" onUploaded={url => onChange('event_images', [url, ...((values.event_images as string[]) || []).slice(1)])} />
        <FileUploadField label="Event Video" value={(values.event_videos as string[])?.[0] || ''} folder="videos" onUploaded={url => onChange('event_videos', [url, ...((values.event_videos as string[]) || []).slice(1)])} />
      </div>
      <div className="flex gap-2">
        <button onClick={onSave} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium">Save</button>
        <button onClick={onCancel} className="px-4 py-2 bg-dark-surface text-white/50 rounded-lg text-sm">Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Events ({events.length})</h3>
        <div className="flex gap-2">
          <button onClick={fetchEvents} className="p-2.5 rounded-xl bg-dark-surface border border-white/10 text-white/50 hover:text-white hover:border-accent transition-all">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => { setAdding(true); setNewForm(EMPTY_EVENT); }}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-light text-white rounded-xl text-sm font-medium transition-colors">
            <Plus size={14} /> Add Event
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {message.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {message.text}
        </div>
      )}

      {adding && (
        <div className="bg-dark-card rounded-2xl border border-accent/20 p-5">
          <h4 className="text-sm font-semibold text-accent mb-3">New Event</h4>
          {renderForm(
            newForm as unknown as Record<string, unknown>,
            (k, v) => setNewForm(prev => ({ ...prev, [k]: v } as typeof EMPTY_EVENT)),
            handleCreate,
            () => setAdding(false),
          )}
        </div>
      )}

      {loading && <div className="flex justify-center py-12"><div className="h-6 w-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" /></div>}

      {!loading && events.length === 0 && !adding && (
        <div className="text-center py-12"><CalendarDays size={32} className="text-white/10 mx-auto mb-3" /><p className="text-white/30 text-sm">No events yet</p></div>
      )}

      {!loading && events.map(ev => (
        <div key={ev.event_id} className="bg-dark-card rounded-2xl border border-white/5 p-5">
          {editing === ev.event_id ? (
            renderForm(
              form,
              (k, v) => setForm(prev => ({ ...prev, [k]: v })),
              () => handleUpdate(ev.event_id),
              () => setEditing(null),
            )
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {ev.event_date ? new Date(ev.event_date).getDate() : '?'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white">{ev.event_name}</h4>
                    {ev.open_to_all && <span className="px-2 py-0.5 text-[10px] rounded-full bg-green-500/10 text-green-400 font-medium">Open</span>}
                  </div>
                  <p className="text-sm text-white/50">
                    {ev.event_date || 'No date'} {ev.event_time && `· ${ev.event_time}`} {ev.event_place && `· ${ev.event_place}`}
                  </p>
                  {ev.event_avenue && <p className="text-xs text-white/30">{ev.event_avenue}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(ev)} className="p-2 rounded-lg text-white/50 hover:text-accent hover:bg-white/5"><Edit3 size={14} /></button>
                <button onClick={() => handleDelete(ev.event_id)} className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/5"><Trash2 size={14} /></button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main Admin Dashboard ─────────────────────────────────────
type Tab = 'members' | 'content' | 'board' | 'legacy' | 'fomo' | 'events' | 'settings';

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const store = useStore();
  const [tab, setTab] = useState<Tab>('members');
  const [saved, setSaved] = useState(false);

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'members', label: 'Members', icon: <Users size={16} /> },
    { id: 'content', label: 'Content', icon: <FileText size={16} /> },
    { id: 'board', label: 'Board', icon: <Users size={16} /> },
    { id: 'legacy', label: 'Legacy', icon: <History size={16} /> },
    { id: 'fomo', label: 'FOMO', icon: <FolderOpen size={16} /> },
    { id: 'events', label: 'Events', icon: <CalendarDays size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
  ];

  const inputClass = "w-full px-4 py-3 rounded-xl bg-dark-surface border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-accent transition-colors text-sm";
  const labelClass = "block text-sm font-medium text-white/70 mb-2";

  return (
    <div className="min-h-screen bg-dark text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-dark-card border-b border-white/5 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white text-xs font-bold">
              RC
            </div>
            <span className="font-display text-lg">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-green-400 text-sm flex items-center gap-1">
                <Save size={14} /> Saved!
              </span>
            )}
            <Link href="/" target="_blank" className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors">
              <Eye size={18} />
            </Link>
            <button onClick={onLogout} className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/5 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-56 flex-shrink-0">
            <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    tab === t.id ? 'bg-accent text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* === MEMBERS TAB === */}
            {tab === 'members' && <MembersTab />}

            {/* === CONTENT TAB === */}
            {tab === 'content' && <ContentTab />}

            {/* === BOARD TAB === */}
            {tab === 'board' && <BoardTab />}

            {/* === LEGACY TAB === */}
            {tab === 'legacy' && <LegacyTab />}

            {/* === FOMO TAB === */}
            {tab === 'fomo' && <FomoTab />}

            {/* === EVENTS TAB === */}
            {tab === 'events' && <EventsTab />}

            {/* === SETTINGS TAB === */}
            {tab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-dark-card rounded-2xl border border-white/5 p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Sliders size={18} /> Display Settings</h3>

                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-white/70">Dark Mode</label>
                        <button
                          onClick={store.toggleDark}
                          className={`w-12 h-6 rounded-full relative transition-colors ${store.isDark ? 'bg-accent' : 'bg-white/20'}`}
                        >
                          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${store.isDark ? 'left-6' : 'left-0.5'}`} />
                        </button>
                      </div>
                      <p className="text-xs text-white/30">Toggle between light and dark themes</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-white/70 block mb-2">
                        Parallax Intensity: {Math.round(store.parallaxIntensity * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={store.parallaxIntensity}
                        onChange={e => store.setParallaxIntensity(parseFloat(e.target.value))}
                        className="w-full accent-accent"
                      />
                      <p className="text-xs text-white/30 mt-1">Control the parallax scroll effect intensity</p>
                    </div>
                  </div>
                </div>

                <div className="bg-dark-card rounded-2xl border border-white/5 p-6">
                  <h3 className="text-lg font-semibold mb-4">Social Links</h3>
                  <div className="space-y-3">
                    {store.content.socialLinks.map((link, i) => (
                      <div key={i} className="grid grid-cols-3 gap-3">
                        <input
                          value={link.platform}
                          onChange={e => {
                            const links = [...store.content.socialLinks];
                            links[i] = { ...links[i], platform: e.target.value };
                            store.updateContent({ socialLinks: links });
                          }}
                          className={inputClass}
                          placeholder="Platform"
                        />
                        <div className="col-span-2">
                          <input
                            value={link.url}
                            onChange={e => {
                              const links = [...store.content.socialLinks];
                              links[i] = { ...links[i], url: e.target.value };
                              store.updateContent({ socialLinks: links });
                            }}
                            className={inputClass}
                            placeholder="URL"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={showSaved} className="px-6 py-3 bg-accent hover:bg-accent-light text-white rounded-xl font-semibold text-sm transition-all flex items-center gap-2">
                  <Save size={14} /> Save Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function AdminPage() {
  const authenticated = useSyncExternalStore(
    subscribeAdminAuth,
    getAdminAuthSnapshot,
    getAdminAuthServerSnapshot,
  );

  if (!authenticated) {
    return <LoginForm onLogin={() => {}} />;
  }

  return <AdminDashboard onLogout={clearAdminAuth} />;
}
