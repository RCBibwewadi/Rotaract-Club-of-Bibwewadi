'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Save, ArrowUp, ArrowDown, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { TRIVIA_PHASES, type TriviaPhase } from '@rcb-2.0/shared';
import { PHASE_META, type TriviaQuestion } from './types';

const inputClass = 'w-full px-3 py-2 rounded-lg bg-dark-surface border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-accent transition-colors text-sm';
const labelClass = 'block text-xs font-medium text-white/50 mb-1';

const MEDIA_HINT: Record<TriviaPhase, string> = {
  quick: 'Optional image URL',
  image: 'Image URL',
  video: 'YouTube link or video URL',
  song: 'YouTube link (only audio is played)',
};

/** Admin editor for the /trivia question bank. `headers` comes from the admin page's token. */
export default function TriviaAdminTab({ headers }: { headers: () => Record<string, string> }) {
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/trivia', { headers: headers() });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || d.error || 'Failed to load');
      setQuestions(d.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { load(); }, [load]);

  const request = async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, { method, headers: headers(), body: body ? JSON.stringify(body) : undefined });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.message || d.error || 'Request failed');
    return d.data;
  };

  const add = async (phase: TriviaPhase) => {
    const inPhase = questions.filter(q => q.phase === phase);
    try {
      const created = await request('/api/admin/trivia', 'POST', {
        phase,
        position: inPhase.length ? Math.max(...inPhase.map(q => q.position)) + 1 : 0,
        prompt: 'New question',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        answer_index: 0,
        points: 10,
      });
      setQuestions(qs => [...qs, created]);
    } catch (e) { setError(e instanceof Error ? e.message : 'Add failed'); }
  };

  const save = async (q: TriviaQuestion) => {
    const { id, ...rest } = q;
    const updated = await request(`/api/admin/trivia/${id}`, 'PATCH', rest);
    setQuestions(qs => qs.map(x => (x.id === id ? updated : x)));
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    try {
      await request(`/api/admin/trivia/${id}`, 'DELETE');
      setQuestions(qs => qs.filter(q => q.id !== id));
    } catch (e) { setError(e instanceof Error ? e.message : 'Delete failed'); }
  };

  // Renumbers the whole phase so positions stay unique after a swap.
  const move = async (phase: TriviaPhase, index: number, dir: -1 | 1) => {
    const list = sorted(questions.filter(q => q.phase === phase));
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    const renumbered = list.map((q, i) => ({ ...q, position: i }));
    setQuestions(qs => [...qs.filter(q => q.phase !== phase), ...renumbered]);
    try {
      await Promise.all(renumbered.map(q => request(`/api/admin/trivia/${q.id}`, 'PATCH', { position: q.position })));
    } catch (e) { setError(e instanceof Error ? e.message : 'Reorder failed'); load(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display">Trivia Proto</h2>
          <p className="text-sm text-white/50">Questions shown at /trivia (password: rotaracttrivia). Rounds play in this order; empty rounds are skipped.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm hover:bg-white/10"><RefreshCw size={14} /> Refresh</button>
          <Link href="/trivia" target="_blank" className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm"><ExternalLink size={14} /> Open trivia</Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={16} /> {error}
          {/relation|does not exist|schema cache/i.test(error) && <span>— run supabase/trivia.sql in the Supabase SQL Editor.</span>}
        </div>
      )}

      {loading ? <p className="text-white/50">Loading…</p> : TRIVIA_PHASES.map(phase => {
        const list = sorted(questions.filter(q => q.phase === phase));
        return (
          <div key={phase} className="rounded-2xl border border-white/5 bg-dark-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{PHASE_META[phase].emoji} {PHASE_META[phase].title} <span className="text-white/40 text-sm">({list.length})</span></h3>
              <button onClick={() => add(phase)} className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"><Plus size={14} /> Add</button>
            </div>
            <div className="space-y-4">
              {list.map((q, i) => (
                <QuestionEditor key={q.id} q={q} index={i} total={list.length}
                  onSave={save} onDelete={() => remove(q.id)} onMove={dir => move(phase, i, dir)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function sorted(list: TriviaQuestion[]) {
  return [...list].sort((a, b) => a.position - b.position);
}

function QuestionEditor({ q, index, total, onSave, onDelete, onMove }: {
  q: TriviaQuestion;
  index: number;
  total: number;
  onSave: (q: TriviaQuestion) => Promise<void>;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const [draft, setDraft] = useState(q);
  const [status, setStatus] = useState<'' | 'saving' | 'saved' | string>('');
  useEffect(() => { setDraft(q); }, [q]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(q);
  const set = <K extends keyof TriviaQuestion>(k: K, v: TriviaQuestion[K]) => setDraft(d => ({ ...d, [k]: v }));
  const num = (v: string) => (v === '' ? null : Math.max(0, parseInt(v, 10) || 0));
  const usesClip = q.phase === 'video' || q.phase === 'song';

  const save = async () => {
    setStatus('saving');
    try { await onSave(draft); setStatus('saved'); setTimeout(() => setStatus(''), 1500); }
    catch (e) { setStatus(e instanceof Error ? e.message : 'Save failed'); }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-white/40">Q{index + 1}</span>
        <input className={inputClass} value={draft.prompt} onChange={e => set('prompt', e.target.value)} placeholder="Question" />
        <button disabled={index === 0} onClick={() => onMove(-1)} className="p-2 text-white/50 hover:text-white disabled:opacity-20"><ArrowUp size={16} /></button>
        <button disabled={index === total - 1} onClick={() => onMove(1)} className="p-2 text-white/50 hover:text-white disabled:opacity-20"><ArrowDown size={16} /></button>
        <button onClick={onDelete} className="p-2 text-white/50 hover:text-red-400"><Trash2 size={16} /></button>
      </div>

      <div className={`grid gap-3 ${usesClip ? 'md:grid-cols-[1fr_90px_90px]' : ''}`}>
        <div>
          <label className={labelClass}>{MEDIA_HINT[q.phase]}</label>
          <input className={inputClass} value={draft.media_url ?? ''} onChange={e => set('media_url', e.target.value || null)} placeholder="https://…" />
        </div>
        {usesClip && (
          <>
            <div>
              <label className={labelClass}>Start (s)</label>
              <input type="number" min={0} className={inputClass} value={draft.media_start ?? ''} onChange={e => set('media_start', num(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>End (s)</label>
              <input type="number" min={0} className={inputClass} value={draft.media_end ?? ''} onChange={e => set('media_end', num(e.target.value))} />
            </div>
          </>
        )}
      </div>
      {q.phase === 'image' && draft.media_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={draft.media_url} alt="" className="h-24 rounded-lg border border-white/10 object-cover" />
      )}

      <div className="grid gap-2 md:grid-cols-2">
        {draft.options.map((opt, i) => (
          <label key={i} className={`flex items-center gap-2 rounded-lg border px-2 ${draft.answer_index === i ? 'border-green-500/60 bg-green-500/10' : 'border-transparent'}`}>
            <input type="radio" name={`ans-${q.id}`} checked={draft.answer_index === i} onChange={() => set('answer_index', i)} title="Correct answer" />
            <span className="text-xs font-bold text-white/40">{'ABCD'[i]}</span>
            <input className={inputClass} value={opt} onChange={e => set('options', draft.options.map((o, j) => (j === i ? e.target.value : o)))} />
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-white/50">
          Points
          <input type="number" min={0} className={`${inputClass} w-24`} value={draft.points} onChange={e => set('points', num(e.target.value) ?? 0)} />
        </label>
        <div className="flex items-center gap-3">
          {status && <span className={`text-xs ${status === 'saved' ? 'text-green-400' : status === 'saving' ? 'text-white/50' : 'text-red-400'}`}>{status === 'saved' ? 'Saved!' : status === 'saving' ? 'Saving…' : status}</span>}
          <button onClick={save} disabled={!dirty || status === 'saving'} className="flex items-center gap-1 rounded-lg bg-accent px-4 py-2 text-sm disabled:opacity-30"><Save size={14} /> Save</button>
        </div>
      </div>
    </div>
  );
}
