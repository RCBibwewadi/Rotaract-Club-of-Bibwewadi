'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AnimatedSection from '@/components/AnimatedSection';
import { useAuthStore, type MemberVisibility, type Business, type Profession } from '@/lib/auth-store';
import {
  User, Mail, Phone, Calendar, Briefcase, Building2, GraduationCap,
  MapPin, Globe, LogOut, Lock, Star, Edit3, Save, X, Camera,
  Eye, Handshake, Plus, Trash2,
} from 'lucide-react';



function useAuthHeaders() {
  const token = useAuthStore(s => s.token);
  return {
    json: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } as Record<string, string>,
    upload: { Authorization: `Bearer ${token}` } as Record<string, string>,
  };
}

const inputClass = "w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-dark dark:text-white placeholder:text-dark/30 dark:placeholder:text-white/30 outline-none focus:border-accent transition-colors text-sm";
const labelClass = "block text-sm font-medium text-dark/60 dark:text-white/60 mb-1";

export default function ProfilePage() {
  const { member, token, _hydrated, logout, fetchProfile } = useAuthStore();
  const router = useRouter();
  const headers = useAuthHeaders();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', dob: '', interests: '', years_in_rcb: 0, college_name: '', course: '', aspiration: '' });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Visibility
  const [visibility, setVisibility] = useState<MemberVisibility | null>(null);
  const [visLoading, setVisLoading] = useState(false);
  const [visSaving, setVisSaving] = useState(false);

  // Business editing
  const [editingBiz, setEditingBiz] = useState<string | null>(null);
  const [addingBiz, setAddingBiz] = useState(false);
  const [bizForm, setBizForm] = useState({ business_name: '', industry: '', designation: '', description: '', website_url: '', business_city: '', is_visible: true });
  const [bizSaving, setBizSaving] = useState(false);

  // Profession editing
  const [editingProf, setEditingProf] = useState<string | null>(null);
  const [addingProf, setAddingProf] = useState(false);
  const [profForm, setProfForm] = useState({ profession_type: '', specialisation: '', years_experience: '', employer: '', is_primary: false, is_visible: true });
  const [profSaving, setProfSaving] = useState(false);

  useEffect(() => {
    if (_hydrated && token && !member) fetchProfile();
  }, [_hydrated, token, member, fetchProfile]);

  const fetchVisibility = useCallback(async () => {
    if (!token) return;
    setVisLoading(true);
    try {
      const res = await fetch(`/api/visibility/me`, { headers: headers.json });
      if (res.ok) { const data = await res.json(); setVisibility(data.data); }
    } catch { /* silent */ }
    finally { setVisLoading(false); }
  }, [token]);

  useEffect(() => { if (_hydrated && token) fetchVisibility(); }, [_hydrated, token, fetchVisibility]);

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleLogout = () => { logout(); router.push('/'); };

  // ── Profile edit ──
  const startEdit = () => {
    if (!member) return;
    setForm({ full_name: member.full_name, phone: member.phone || '', dob: member.dob || '', interests: member.interests || '', years_in_rcb: member.years_in_rcb || 0, college_name: member.college_name || '', course: member.course || '', aspiration: member.aspiration || '' });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/members/me`, { method: 'PATCH', headers: headers.json, body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok) { showMsg(data.message || 'Profile updated', 'success'); setEditing(false); await fetchProfile(); }
      else showMsg(data.message || 'Update failed', 'error');
    } catch { showMsg('Network error', 'error'); }
    finally { setSaving(false); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const upRes = await fetch(`/api/upload/avatar`, { method: 'POST', headers: headers.upload, body: fd });
      const upData = await upRes.json();
      if (!upRes.ok || !upData.data?.url) { showMsg('Upload failed', 'error'); return; }
      const pRes = await fetch(`/api/members/me`, { method: 'PATCH', headers: headers.json, body: JSON.stringify({ avatar_url: upData.data.url }) });
      if (pRes.ok) { showMsg('Profile picture updated', 'success'); await fetchProfile(); }
      else showMsg('Failed to save', 'error');
    } catch { showMsg('Network error', 'error'); }
    finally { setUploading(false); }
  };

  // ── Visibility toggle ──
  const toggleVis = async (key: keyof Omit<MemberVisibility, 'member_id'>) => {
    if (!visibility) return;
    setVisSaving(true);
    try {
      const res = await fetch(`/api/visibility/me`, { method: 'PATCH', headers: headers.json, body: JSON.stringify({ [key]: !visibility[key] }) });
      if (res.ok) { const d = await res.json(); setVisibility(d.data); }
    } catch { /* silent */ }
    finally { setVisSaving(false); }
  };

  // ── Business CRUD ──
  const startEditBiz = (b: Business) => {
    setEditingBiz(b.business_id);
    setBizForm({ business_name: b.business_name, industry: b.industry || '', designation: b.designation || '', description: b.description || '', website_url: b.website_url || '', business_city: b.business_city || '', is_visible: b.is_visible });
  };

  const saveBiz = async (id?: string) => {
    setBizSaving(true);
    try {
      const url = id ? `/api/businesses/${id}` : `/api/businesses`;
      const res = await fetch(url, { method: id ? 'PATCH' : 'POST', headers: headers.json, body: JSON.stringify(bizForm) });
      const data = await res.json();
      if (res.ok) { showMsg(data.message || 'Saved', 'success'); setEditingBiz(null); setAddingBiz(false); await fetchProfile(); }
      else showMsg(data.message || data.error || 'Failed', 'error');
    } catch { showMsg('Network error', 'error'); }
    finally { setBizSaving(false); }
  };

  const deleteBiz = async (id: string) => {
    try {
      const res = await fetch(`/api/businesses/${id}`, { method: 'DELETE', headers: headers.json });
      if (res.ok) { showMsg('Business removed', 'success'); await fetchProfile(); }
      else showMsg('Delete failed', 'error');
    } catch { showMsg('Network error', 'error'); }
  };

  // ── Profession CRUD ──
  const startEditProf = (p: Profession) => {
    setEditingProf(p.profession_id);
    setProfForm({ profession_type: p.profession_type, specialisation: p.specialisation || '', years_experience: p.years_experience || '', employer: p.employer || '', is_primary: p.is_primary, is_visible: p.is_visible });
  };

  const saveProf = async (id?: string) => {
    setProfSaving(true);
    try {
      const url = id ? `/api/professions/${id}` : `/api/professions`;
      const res = await fetch(url, { method: id ? 'PATCH' : 'POST', headers: headers.json, body: JSON.stringify(profForm) });
      const data = await res.json();
      if (res.ok) { showMsg(data.message || 'Saved', 'success'); setEditingProf(null); setAddingProf(false); await fetchProfile(); }
      else showMsg(data.message || data.error || 'Failed', 'error');
    } catch { showMsg('Network error', 'error'); }
    finally { setProfSaving(false); }
  };

  const deleteProf = async (id: string) => {
    try {
      const res = await fetch(`/api/professions/${id}`, { method: 'DELETE', headers: headers.json });
      if (res.ok) { showMsg('Profession removed', 'success'); await fetchProfile(); }
      else showMsg('Delete failed', 'error');
    } catch { showMsg('Network error', 'error'); }
  };

  if (!_hydrated) return null;

  if (!token) {
    return (
      <div className="min-h-screen transition-colors flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <Lock size={48} className="text-dark/20 dark:text-white/20 mx-auto mb-4" />
          <h1 className="font-display text-4xl text-dark dark:text-white mb-3">Not Logged In</h1>
          <p className="text-dark/50 dark:text-white/50 mb-6">Login to view your member profile.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/login" className="px-6 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent-light transition-colors">Login</Link>
            <Link href="/join" className="px-6 py-3 border border-black/10 dark:border-white/10 text-dark dark:text-white rounded-xl font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors">Register</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen transition-colors flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  const initials = member.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const hasBiz = member.businesses && member.businesses.length > 0;
  const hasProf = member.professions && member.professions.length > 0;

  return (
    <div className="min-h-screen transition-colors">
      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-12 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <AnimatedSection>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative group">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt={member.full_name} className="w-24 h-24 rounded-2xl object-cover border-2 border-accent/20" />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white text-2xl font-bold">{initials}</div>
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {uploading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Camera size={20} className="text-white" />}
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                </label>
              </div>
              <div className="text-center sm:text-left flex-1">
                <h1 className="font-display text-4xl md:text-5xl text-dark dark:text-white mb-1">{member.full_name}</h1>
                <p className="text-dark/50 dark:text-white/50">@{member.username}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {member.member_type.split(',').map(t => (
                    <span key={t} className="px-3 py-1 text-xs rounded-full bg-accent/10 text-accent font-medium capitalize">{t.trim()}</span>
                  ))}
                  {(member.years_in_rcb || 0) > 0 && <span className="px-3 py-1 text-xs rounded-full bg-black/5 dark:bg-white/5 text-dark/60 dark:text-white/60">{member.years_in_rcb} year{(member.years_in_rcb || 0) > 1 ? 's' : ''} in RCB</span>}
                </div>
              </div>
              <div className="flex gap-2 sm:ml-auto">
                {!editing && <button onClick={startEdit} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-accent/20 text-accent hover:bg-accent/10 transition-colors text-sm font-medium"><Edit3 size={16} /> Edit</button>}
                <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors text-sm font-medium"><LogOut size={16} /> Logout</button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {message && (
        <div className="max-w-4xl mx-auto px-6 mb-4">
          <div className={`p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{message.text}</div>
        </div>
      )}

      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Edit Profile Form */}
          {editing && (
            <AnimatedSection>
              <div className="p-6 rounded-2xl bg-accent/5 border border-accent/20">
                <h2 className="text-dark dark:text-white font-semibold mb-4 flex items-center gap-2"><Edit3 size={18} className="text-accent" /> Edit Profile</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={labelClass}>Full Name</label><input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className={inputClass} /></div>
                  <div><label className={labelClass}>Phone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputClass} /></div>
                  <div><label className={labelClass}>Date of Birth</label><input type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} className={inputClass} /></div>
                  <div><label className={labelClass}>Years in RCB</label><input type="number" min={0} value={form.years_in_rcb} onChange={e => setForm(f => ({ ...f, years_in_rcb: Number(e.target.value) }))} className={inputClass} /></div>
                  <div className="sm:col-span-2"><label className={labelClass}>Interests</label><input value={form.interests} onChange={e => setForm(f => ({ ...f, interests: e.target.value }))} className={inputClass} placeholder="e.g. Photography, Trekking" /></div>
                  {member.member_type.includes('student') && (
                    <>
                      <div><label className={labelClass}>College Name</label><input value={form.college_name} onChange={e => setForm(f => ({ ...f, college_name: e.target.value }))} className={inputClass} placeholder="e.g. MIT Pune" /></div>
                      <div><label className={labelClass}>Course</label><input value={form.course} onChange={e => setForm(f => ({ ...f, course: e.target.value }))} className={inputClass} placeholder="e.g. B.Tech CS" /></div>
                      <div className="sm:col-span-2"><label className={labelClass}>Aspiration</label><input value={form.aspiration} onChange={e => setForm(f => ({ ...f, aspiration: e.target.value }))} className={inputClass} placeholder="What do you aspire to be?" /></div>
                    </>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-medium disabled:opacity-50"><Save size={14} /> {saving ? 'Saving...' : 'Save'}</button>
                  <button onClick={() => setEditing(false)} className="flex items-center gap-2 px-5 py-2.5 border border-black/10 dark:border-white/10 text-dark/60 dark:text-white/60 rounded-xl text-sm"><X size={14} /> Cancel</button>
                </div>
              </div>
            </AnimatedSection>
          )}

          {/* Personal Info */}
          <AnimatedSection delay={100}>
            <div className="p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
              <h2 className="text-dark dark:text-white font-semibold mb-4 flex items-center gap-2"><User size={18} className="text-accent" /> Personal Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={Mail} label="Email" value={member.email} />
                {member.phone && <InfoRow icon={Phone} label="Phone" value={member.phone} />}
                {member.dob && <InfoRow icon={Calendar} label="DOB" value={member.dob} />}
                {member.interests && <InfoRow icon={Star} label="Interests" value={member.interests} />}
                {member.rid && <InfoRow icon={User} label="Rotary ID" value={member.rid} />}
                {member.college_name && <InfoRow icon={GraduationCap} label="College" value={member.college_name} />}
                {member.course && <InfoRow icon={GraduationCap} label="Course" value={member.course} />}
                {member.aspiration && <InfoRow icon={Star} label="Aspiration" value={member.aspiration} />}
              </div>
            </div>
          </AnimatedSection>

          {/* Businesses */}
          <AnimatedSection delay={200}>
            <div className="p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-dark dark:text-white font-semibold flex items-center gap-2"><Building2 size={18} className="text-accent" /> Business</h2>
                {!addingBiz && (
                  <button onClick={() => { setAddingBiz(true); setBizForm({ business_name: '', industry: '', designation: '', description: '', website_url: '', business_city: '', is_visible: true }); }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors font-medium">
                    <Plus size={12} /> Add Business
                  </button>
                )}
              </div>

              {addingBiz && (
                <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 mb-4">
                  <BusinessForm form={bizForm} onChange={setBizForm} />
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => saveBiz()} disabled={bizSaving} className="flex items-center gap-1 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-50"><Save size={12} /> {bizSaving ? 'Saving...' : 'Create'}</button>
                    <button onClick={() => setAddingBiz(false)} className="px-4 py-2 text-dark/50 dark:text-white/50 text-sm">Cancel</button>
                  </div>
                </div>
              )}

              {hasBiz ? member.businesses!.map(b => (
                <div key={b.business_id} className="p-4 rounded-xl bg-black/5 dark:bg-white/5 mb-3 last:mb-0">
                  {editingBiz === b.business_id ? (
                    <>
                      <BusinessForm form={bizForm} onChange={setBizForm} />
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => saveBiz(b.business_id)} disabled={bizSaving} className="flex items-center gap-1 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-50"><Save size={12} /> {bizSaving ? 'Saving...' : 'Save'}</button>
                        <button onClick={() => setEditingBiz(null)} className="px-4 py-2 text-dark/50 dark:text-white/50 text-sm">Cancel</button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-dark dark:text-white font-medium text-lg">{b.business_name}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          {b.industry && <InfoRow icon={Briefcase} label="Industry" value={b.industry} />}
                          {b.designation && <InfoRow icon={User} label="Designation" value={b.designation} />}
                          {b.business_city && <InfoRow icon={MapPin} label="City" value={b.business_city} />}
                          {b.website_url && <InfoRow icon={Globe} label="Website" value={b.website_url} />}
                        </div>
                        {b.description && <p className="text-dark/50 dark:text-white/50 text-sm mt-2">{b.description}</p>}
                      </div>
                      <div className="flex gap-1 flex-shrink-0 ml-4">
                        <button onClick={() => startEditBiz(b)} className="p-2 rounded-lg text-dark/30 dark:text-white/30 hover:text-accent hover:bg-accent/10 transition-colors"><Edit3 size={14} /></button>
                        <button onClick={() => deleteBiz(b.business_id)} className="p-2 rounded-lg text-dark/30 dark:text-white/30 hover:text-red-500 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  )}
                </div>
              )) : !addingBiz && (
                <p className="text-dark/30 dark:text-white/30 text-sm">No business profile yet. Add one above.</p>
              )}
            </div>
          </AnimatedSection>

          {/* Professions */}
          <AnimatedSection delay={300}>
            <div className="p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-dark dark:text-white font-semibold flex items-center gap-2"><GraduationCap size={18} className="text-accent" /> Professions</h2>
                {!addingProf && (
                  <button onClick={() => { setAddingProf(true); setProfForm({ profession_type: '', specialisation: '', years_experience: '', employer: '', is_primary: false, is_visible: true }); }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors font-medium">
                    <Plus size={12} /> Add Profession
                  </button>
                )}
              </div>

              {addingProf && (
                <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 mb-4">
                  <ProfessionForm form={profForm} onChange={setProfForm} />
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => saveProf()} disabled={profSaving} className="flex items-center gap-1 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-50"><Save size={12} /> {profSaving ? 'Saving...' : 'Create'}</button>
                    <button onClick={() => setAddingProf(false)} className="px-4 py-2 text-dark/50 dark:text-white/50 text-sm">Cancel</button>
                  </div>
                </div>
              )}

              {hasProf ? member.professions!.map(p => (
                <div key={p.profession_id} className="p-4 rounded-xl bg-black/5 dark:bg-white/5 mb-3 last:mb-0">
                  {editingProf === p.profession_id ? (
                    <>
                      <ProfessionForm form={profForm} onChange={setProfForm} />
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => saveProf(p.profession_id)} disabled={profSaving} className="flex items-center gap-1 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-50"><Save size={12} /> {profSaving ? 'Saving...' : 'Save'}</button>
                        <button onClick={() => setEditingProf(null)} className="px-4 py-2 text-dark/50 dark:text-white/50 text-sm">Cancel</button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-dark dark:text-white font-medium">{p.profession_type}</h3>
                          {p.is_primary && <span className="px-2 py-0.5 text-[10px] rounded-full bg-accent/10 text-accent font-medium">Primary</span>}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          {p.specialisation && <InfoRow icon={Star} label="Specialisation" value={p.specialisation} />}
                          {p.years_experience && <InfoRow icon={Calendar} label="Experience" value={p.years_experience} />}
                          {p.employer && <InfoRow icon={Building2} label="Employer" value={p.employer} />}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 ml-4">
                        <button onClick={() => startEditProf(p)} className="p-2 rounded-lg text-dark/30 dark:text-white/30 hover:text-accent hover:bg-accent/10 transition-colors"><Edit3 size={14} /></button>
                        <button onClick={() => deleteProf(p.profession_id)} className="p-2 rounded-lg text-dark/30 dark:text-white/30 hover:text-red-500 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  )}
                </div>
              )) : !addingProf && (
                <p className="text-dark/30 dark:text-white/30 text-sm">No profession profile yet. Add one above.</p>
              )}
            </div>
          </AnimatedSection>

          {/* Visibility Settings */}
          <AnimatedSection delay={400}>
            <div className="p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
              <h2 className="text-dark dark:text-white font-semibold mb-2 flex items-center gap-2"><Eye size={18} className="text-accent" /> Visibility Settings</h2>
              <p className="text-dark/40 dark:text-white/40 text-xs mb-4">Control what other members see in the directory.</p>
              {visLoading ? (
                <div className="flex justify-center py-4"><div className="h-5 w-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" /></div>
              ) : visibility ? (
                <div className="space-y-3">
                  <VisToggle icon={Building2} label="Show Business Name" desc="Display business in directory" enabled={visibility.show_business_name} saving={visSaving} onToggle={() => toggleVis('show_business_name')} />
                  <VisToggle icon={Phone} label="Show Contact Info" desc="Allow others to see phone/email" enabled={visibility.show_contact} saving={visSaving} onToggle={() => toggleVis('show_contact')} />
                  <VisToggle icon={GraduationCap} label="Show Profession" desc="Display profession in directory" enabled={visibility.show_profession} saving={visSaving} onToggle={() => toggleVis('show_profession')} />
                  <VisToggle icon={Handshake} label="Open to Collaborate" desc="Show you're open to collaborations" enabled={visibility.open_to_collab} saving={visSaving} onToggle={() => toggleVis('open_to_collab')} />
                </div>
              ) : (
                <p className="text-dark/30 dark:text-white/30 text-sm">Visibility settings not available.</p>
              )}
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}

// ── Reusable sub-components ──

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} className="text-accent/60 flex-shrink-0" />
      <span className="text-dark/40 dark:text-white/40 text-sm">{label}:</span>
      <span className="text-dark dark:text-white text-sm truncate">{value}</span>
    </div>
  );
}

function VisToggle({ icon: Icon, label, desc, enabled, saving, onToggle }: {
  icon: React.ElementType; label: string; desc: string; enabled: boolean; saving: boolean; onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5">
      <div className="flex items-center gap-3">
        <Icon size={16} className="text-accent/60 flex-shrink-0" />
        <div>
          <p className="text-dark dark:text-white text-sm font-medium">{label}</p>
          <p className="text-dark/40 dark:text-white/40 text-xs">{desc}</p>
        </div>
      </div>
      <button onClick={onToggle} disabled={saving}
        className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${enabled ? 'bg-accent' : 'bg-black/20 dark:bg-white/20'} ${saving ? 'opacity-50' : ''}`}>
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${enabled ? 'left-5.5' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

function BusinessForm({ form, onChange }: { form: Record<string, unknown>; onChange: (f: any) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div><label className={labelClass}>Business Name *</label><input value={String(form.business_name || '')} onChange={e => onChange({ ...form, business_name: e.target.value })} className={inputClass} /></div>
      <div><label className={labelClass}>Industry</label><input value={String(form.industry || '')} onChange={e => onChange({ ...form, industry: e.target.value })} className={inputClass} /></div>
      <div><label className={labelClass}>Designation</label><input value={String(form.designation || '')} onChange={e => onChange({ ...form, designation: e.target.value })} className={inputClass} /></div>
      <div><label className={labelClass}>City</label><input value={String(form.business_city || '')} onChange={e => onChange({ ...form, business_city: e.target.value })} className={inputClass} /></div>
      <div><label className={labelClass}>Website</label><input value={String(form.website_url || '')} onChange={e => onChange({ ...form, website_url: e.target.value })} className={inputClass} placeholder="https://..." /></div>
      <div className="flex items-end pb-1"><label className="flex items-center gap-2 text-sm text-dark/60 dark:text-white/60 cursor-pointer"><input type="checkbox" checked={Boolean(form.is_visible)} onChange={e => onChange({ ...form, is_visible: e.target.checked })} className="accent-accent" /> Visible in directory</label></div>
      <div className="sm:col-span-2">
        <label className={labelClass}>Description <span className="text-dark/30 dark:text-white/30 font-normal">({String(form.description || '').length}/250)</span></label>
        <textarea value={String(form.description || '')} onChange={e => {
          if (e.target.value.length <= 250) onChange({ ...form, description: e.target.value });
        }} maxLength={250} className={`${inputClass} resize-none`} rows={2} />
      </div>
    </div>
  );
}

function ProfessionForm({ form, onChange }: { form: Record<string, unknown>; onChange: (f: any) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div><label className={labelClass}>Profession Type *</label><input value={String(form.profession_type || '')} onChange={e => onChange({ ...form, profession_type: e.target.value })} className={inputClass} placeholder="e.g. Doctor, Engineer" /></div>
      <div><label className={labelClass}>Specialisation</label><input value={String(form.specialisation || '')} onChange={e => onChange({ ...form, specialisation: e.target.value })} className={inputClass} /></div>
      <div><label className={labelClass}>Years Experience</label><input value={String(form.years_experience || '')} onChange={e => onChange({ ...form, years_experience: e.target.value })} className={inputClass} /></div>
      <div><label className={labelClass}>Employer</label><input value={String(form.employer || '')} onChange={e => onChange({ ...form, employer: e.target.value })} className={inputClass} /></div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-dark/60 dark:text-white/60 cursor-pointer"><input type="checkbox" checked={Boolean(form.is_primary)} onChange={e => onChange({ ...form, is_primary: e.target.checked })} className="accent-accent" /> Primary</label>
        <label className="flex items-center gap-2 text-sm text-dark/60 dark:text-white/60 cursor-pointer"><input type="checkbox" checked={Boolean(form.is_visible)} onChange={e => onChange({ ...form, is_visible: e.target.checked })} className="accent-accent" /> Visible</label>
      </div>
    </div>
  );
}
