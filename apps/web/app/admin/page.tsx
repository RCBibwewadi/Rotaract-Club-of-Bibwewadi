'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock, LogOut, Save, Plus, Trash2, Edit3, Eye, Settings, Users, FolderOpen, CalendarDays, FileText, Sliders, X } from 'lucide-react';
import { useStore, type BoardMember, type Project, type EventItem } from '@/lib/store';

function LoginForm() {
  const { loginAdmin } = useStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = () => {
    if (!loginAdmin(password)) {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-white" />
          </div>
          <h1 className="font-display text-3xl text-white">Admin Panel</h1>
          <p className="text-white/50 text-sm mt-2">Enter password to access the dashboard</p>
        </div>

        <div className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Password"
            className="w-full px-4 py-3 rounded-xl bg-dark-surface border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-accent transition-colors"
          />
          {error && <p className="text-red-400 text-sm">Incorrect password. Try: rotaract2025</p>}
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

type Tab = 'content' | 'board' | 'projects' | 'events' | 'settings';

function AdminDashboard() {
  const store = useStore();
  const [tab, setTab] = useState<Tab>('content');
  const [editingBoard, setEditingBoard] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'content', label: 'Content', icon: <FileText size={16} /> },
    { id: 'board', label: 'Board', icon: <Users size={16} /> },
    { id: 'projects', label: 'Projects', icon: <FolderOpen size={16} /> },
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
            <button onClick={store.logoutAdmin} className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/5 transition-colors">
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
            {/* === CONTENT TAB === */}
            {tab === 'content' && (
              <div className="space-y-6">
                <div className="bg-dark-card rounded-2xl border border-white/5 p-6">
                  <h3 className="text-lg font-semibold mb-4">Hero Section</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Title</label>
                      <input
                        value={store.content.heroTitle}
                        onChange={e => store.updateContent({ heroTitle: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Subtitle</label>
                      <input
                        value={store.content.heroSubtitle}
                        onChange={e => store.updateContent({ heroSubtitle: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className={labelClass}>Tagline</label>
                    <input
                      value={store.content.heroTagline}
                      onChange={e => store.updateContent({ heroTagline: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="bg-dark-card rounded-2xl border border-white/5 p-6">
                  <h3 className="text-lg font-semibold mb-4">About Text</h3>
                  <textarea
                    value={store.content.aboutText}
                    onChange={e => store.updateContent({ aboutText: e.target.value })}
                    rows={5}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="bg-dark-card rounded-2xl border border-white/5 p-6">
                  <h3 className="text-lg font-semibold mb-4">Vision Text</h3>
                  <textarea
                    value={store.content.visionText}
                    onChange={e => store.updateContent({ visionText: e.target.value })}
                    rows={4}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="bg-dark-card rounded-2xl border border-white/5 p-6">
                  <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Email</label>
                      <input
                        value={store.content.contactEmail}
                        onChange={e => store.updateContent({ contactEmail: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Phone</label>
                      <input
                        value={store.content.contactPhone}
                        onChange={e => store.updateContent({ contactPhone: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Address</label>
                      <input
                        value={store.content.contactAddress}
                        onChange={e => store.updateContent({ contactAddress: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-dark-card rounded-2xl border border-white/5 p-6">
                  <h3 className="text-lg font-semibold mb-4">Pillars</h3>
                  <div className="space-y-4">
                    {store.content.pillars.map((pillar, i) => (
                      <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-dark-surface">
                        <div>
                          <label className={labelClass}>Icon (emoji)</label>
                          <input
                            value={pillar.icon}
                            onChange={e => {
                              const pillars = [...store.content.pillars];
                              pillars[i] = { ...pillars[i], icon: e.target.value };
                              store.updateContent({ pillars });
                            }}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Title</label>
                          <input
                            value={pillar.title}
                            onChange={e => {
                              const pillars = [...store.content.pillars];
                              pillars[i] = { ...pillars[i], title: e.target.value };
                              store.updateContent({ pillars });
                            }}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Description</label>
                          <input
                            value={pillar.description}
                            onChange={e => {
                              const pillars = [...store.content.pillars];
                              pillars[i] = { ...pillars[i], description: e.target.value };
                              store.updateContent({ pillars });
                            }}
                            className={inputClass}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={showSaved} className="px-6 py-3 bg-accent hover:bg-accent-light text-white rounded-xl font-semibold text-sm transition-all flex items-center gap-2">
                  <Save size={14} /> Save Changes
                </button>
              </div>
            )}

            {/* === BOARD TAB === */}
            {tab === 'board' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Board Members ({store.content.boardMembers.length})</h3>
                  <button
                    onClick={() => {
                      const id = Date.now().toString();
                      store.addBoardMember({ id, name: 'New Member', role: 'Director', bio: 'Bio here...', gradient: 'from-gray-500 to-gray-600' });
                      setEditingBoard(id);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-light text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    <Plus size={14} /> Add Member
                  </button>
                </div>

                {store.content.boardMembers.map(member => (
                  <div key={member.id} className="bg-dark-card rounded-2xl border border-white/5 p-5">
                    {editingBoard === member.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className={labelClass}>Name</label>
                            <input value={member.name} onChange={e => store.updateBoardMember(member.id, { name: e.target.value })} className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Role</label>
                            <input value={member.role} onChange={e => store.updateBoardMember(member.id, { role: e.target.value })} className={inputClass} />
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>Bio</label>
                          <textarea value={member.bio} onChange={e => store.updateBoardMember(member.id, { bio: e.target.value })} className={`${inputClass} resize-none`} rows={2} />
                        </div>
                        <div>
                          <label className={labelClass}>Gradient (Tailwind classes)</label>
                          <input value={member.gradient} onChange={e => store.updateBoardMember(member.id, { gradient: e.target.value })} className={inputClass} placeholder="from-orange-500 to-red-500" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingBoard(null); showSaved(); }} className="px-4 py-2 bg-accent text-white rounded-lg text-sm">Save</button>
                          <button onClick={() => setEditingBoard(null)} className="px-4 py-2 bg-dark-surface text-white/50 rounded-lg text-sm">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${member.gradient}`} />
                          <div>
                            <h4 className="font-semibold">{member.name}</h4>
                            <p className="text-sm text-white/50">{member.role}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingBoard(member.id)} className="p-2 rounded-lg text-white/50 hover:text-accent hover:bg-white/5"><Edit3 size={14} /></button>
                          <button onClick={() => store.removeBoardMember(member.id)} className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/5"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* === PROJECTS TAB === */}
            {tab === 'projects' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Projects ({store.content.projects.length})</h3>
                  <button
                    onClick={() => {
                      const id = Date.now().toString();
                      store.addProject({ id, title: 'New Project', category: 'Service', description: 'Description...', gradient: 'from-gray-500 to-gray-600', date: new Date().toISOString().split('T')[0] });
                      setEditingProject(id);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-light text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    <Plus size={14} /> Add Project
                  </button>
                </div>

                {store.content.projects.map(project => (
                  <div key={project.id} className="bg-dark-card rounded-2xl border border-white/5 p-5">
                    {editingProject === project.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className={labelClass}>Title</label>
                            <input value={project.title} onChange={e => store.updateProject(project.id, { title: e.target.value })} className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Category</label>
                            <input value={project.category} onChange={e => store.updateProject(project.id, { category: e.target.value })} className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Date</label>
                            <input type="date" value={project.date} onChange={e => store.updateProject(project.id, { date: e.target.value })} className={inputClass} />
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>Description</label>
                          <textarea value={project.description} onChange={e => store.updateProject(project.id, { description: e.target.value })} className={`${inputClass} resize-none`} rows={2} />
                        </div>
                        <div>
                          <label className={labelClass}>Gradient</label>
                          <input value={project.gradient} onChange={e => store.updateProject(project.id, { gradient: e.target.value })} className={inputClass} />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingProject(null); showSaved(); }} className="px-4 py-2 bg-accent text-white rounded-lg text-sm">Save</button>
                          <button onClick={() => setEditingProject(null)} className="px-4 py-2 bg-dark-surface text-white/50 rounded-lg text-sm">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${project.gradient}`} />
                          <div>
                            <h4 className="font-semibold">{project.title}</h4>
                            <p className="text-sm text-white/50">{project.category} · {project.date}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingProject(project.id)} className="p-2 rounded-lg text-white/50 hover:text-accent hover:bg-white/5"><Edit3 size={14} /></button>
                          <button onClick={() => store.removeProject(project.id)} className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/5"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* === EVENTS TAB === */}
            {tab === 'events' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Events ({store.content.events.length})</h3>
                  <button
                    onClick={() => {
                      const id = Date.now().toString();
                      store.addEvent({ id, title: 'New Event', date: new Date().toISOString().split('T')[0], time: '10:00 AM', location: 'TBD', description: 'Description...', category: 'Service' });
                      setEditingEvent(id);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-light text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    <Plus size={14} /> Add Event
                  </button>
                </div>

                {store.content.events.map(event => (
                  <div key={event.id} className="bg-dark-card rounded-2xl border border-white/5 p-5">
                    {editingEvent === event.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className={labelClass}>Title</label>
                            <input value={event.title} onChange={e => store.updateEvent(event.id, { title: e.target.value })} className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Date</label>
                            <input type="date" value={event.date} onChange={e => store.updateEvent(event.id, { date: e.target.value })} className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Time</label>
                            <input value={event.time} onChange={e => store.updateEvent(event.id, { time: e.target.value })} className={inputClass} />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className={labelClass}>Location</label>
                            <input value={event.location} onChange={e => store.updateEvent(event.id, { location: e.target.value })} className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Category</label>
                            <select
                              value={event.category}
                              onChange={e => store.updateEvent(event.id, { category: e.target.value })}
                              className={inputClass}
                            >
                              <option value="Ceremony">Ceremony</option>
                              <option value="Workshop">Workshop</option>
                              <option value="Celebration">Celebration</option>
                              <option value="Service">Service</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>Description</label>
                          <textarea value={event.description} onChange={e => store.updateEvent(event.id, { description: e.target.value })} className={`${inputClass} resize-none`} rows={2} />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingEvent(null); showSaved(); }} className="px-4 py-2 bg-accent text-white rounded-lg text-sm">Save</button>
                          <button onClick={() => setEditingEvent(null)} className="px-4 py-2 bg-dark-surface text-white/50 rounded-lg text-sm">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white text-sm font-bold">
                            {new Date(event.date).getDate()}
                          </div>
                          <div>
                            <h4 className="font-semibold">{event.title}</h4>
                            <p className="text-sm text-white/50">{event.date} · {event.time} · {event.location}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingEvent(event.id)} className="p-2 rounded-lg text-white/50 hover:text-accent hover:bg-white/5"><Edit3 size={14} /></button>
                          <button onClick={() => store.removeEvent(event.id)} className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/5"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

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

export default function AdminPage() {
  const { isAdminLoggedIn } = useStore();

  if (!isAdminLoggedIn) return <LoginForm />;
  return <AdminDashboard />;
}
