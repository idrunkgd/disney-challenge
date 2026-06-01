'use client';

import { useEffect, useState } from 'react';
import type { QuizQuestion } from '@/lib/types';

const empty = { question: '', options: ['', '', '', ''], correct_index: 0, difficulty: 1, is_active: true };

export default function QuizAdminPage() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [form, setForm] = useState<any>(empty);

  async function load() {
    const res = await fetch('/api/admin/quiz');
    setQuestions((await res.json()).questions ?? []);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.question || form.options.some((o: string) => !o)) return;
    await fetch('/api/admin/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm(empty);
    await load();
  }
  async function remove(id: string) {
    if (!confirm('Supprimer cette question ?')) return;
    await fetch(`/api/admin/quiz?id=${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Quiz</h1>
      <p className="mb-4 text-sm text-white/50">{questions.length} questions dans la banque</p>

      <div className="card mb-5 space-y-3 p-4">
        <input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Question" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
        {form.options.map((opt: string, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              checked={form.correct_index === i}
              onChange={() => setForm({ ...form, correct_index: i })}
              title="Bonne réponse"
            />
            <input
              value={opt}
              onChange={(e) => {
                const options = [...form.options];
                options[i] = e.target.value;
                setForm({ ...form, options });
              }}
              placeholder={`Réponse ${i + 1}`}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            />
          </div>
        ))}
        <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: Number(e.target.value) })} className="rounded-xl border border-white/10 bg-magic-900 px-3 py-2">
          <option value={1}>Facile (10 pts)</option>
          <option value={2}>Moyenne (20 pts)</option>
          <option value={3}>Difficile (30 pts)</option>
          <option value={4}>Expert (40 pts)</option>
          <option value={5}>Impossible (50 pts)</option>
        </select>
        <button onClick={save} className="btn-primary w-full">{form.id ? 'Mettre à jour' : 'Ajouter la question'}</button>
        {form.id && <button onClick={() => setForm(empty)} className="btn-ghost w-full">Annuler</button>}
      </div>

      <div className="space-y-2">
        {questions.map((q) => (
          <div key={q.id} className="card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="font-medium">{q.question}</div>
                <div className="text-xs text-emerald-400">✓ {q.options[q.correct_index]}</div>
                <div className="mt-0.5 text-[11px] text-white/40">
                  {['', '🟢 Facile', '🔵 Moyenne', '🟣 Difficile', '🟠 Expert', '🔴 Impossible'][q.difficulty] ?? `Niveau ${q.difficulty}`} · {10 * q.difficulty} pts
                </div>
              </div>
              <button onClick={() => setForm({ ...q })} className="chip">✏️</button>
              <button onClick={() => remove(q.id)} className="text-candy-400">🗑</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
