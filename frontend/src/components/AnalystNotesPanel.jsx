import React, { useState, useEffect, useRef } from 'react';
import { StickyNote, X, Plus, Tag, Trash2, Loader2, ChevronUp } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';

const TAG_COLORS = ['text-cyan-400', 'text-purple-400', 'text-amber-400', 'text-emerald-400', 'text-rose-400'];

function getTagColor(tag) {
  let hash = 0;
  for (let c of tag) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

export default function AnalystNotesPanel({ target, isOpen, onClose }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef(null);

  const fetchNotes = async () => {
    if (!target) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/notes?target=${encodeURIComponent(target)}`);
      if (res.ok) setNotes(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && target) fetchNotes();
  }, [isOpen, target]);

  const addNote = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, text: text.trim(), tags: tags.trim() })
      });
      if (res.ok) {
        const newNote = await res.json();
        setNotes(prev => [newNote, ...prev]);
        setText('');
        setTags('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const deleteNote = async (noteId) => {
    try {
      await fetch(`${API_BASE_URL}/api/notes/${noteId}`, { method: 'DELETE' });
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-80 flex flex-col"
        style={{
          background: 'rgba(11,17,32,0.97)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8">
          <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center border border-amber-500/20">
            <StickyNote size={15} className="text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-widest">Analyst Notes</div>
            <div className="text-[10px] text-slate-500 font-mono truncate">{target}</div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Add Note Form */}
        <form onSubmit={addNote} className="px-4 py-3 border-b border-white/5 flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 resize-none focus:outline-none focus:border-amber-500/40 transition-colors"
            placeholder="Write your observation..."
            rows={3}
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Tag size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                className="w-full bg-slate-900/60 border border-white/10 rounded pl-7 pr-2 py-1.5 text-[11px] text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/40"
                placeholder="tags, comma, separated"
                value={tags}
                onChange={e => setTags(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-[10px] font-bold border border-amber-500/25 rounded transition-colors disabled:opacity-40"
            >
              {submitting ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
              Add
            </button>
          </div>
        </form>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 flex flex-col gap-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="text-slate-600 animate-spin" size={24} />
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <StickyNote size={32} className="text-slate-700" />
              <p className="text-slate-500 text-xs">No notes yet for this target.<br />Add observations above.</p>
            </div>
          ) : (
            notes.map(note => (
              <div
                key={note.id}
                className="group glass-panel rounded-xl p-3 flex flex-col gap-2 border border-white/5 hover:border-amber-500/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-slate-200 leading-relaxed flex-1">{note.text}</p>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-red-400 flex-shrink-0 mt-0.5"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {note.tags && (
                  <div className="flex flex-wrap gap-1">
                    {note.tags.split(',').map(t => t.trim()).filter(Boolean).map((tag, i) => (
                      <span key={i} className={`text-[9px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 ${getTagColor(tag)}`}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="text-[9px] text-slate-600 font-mono">
                  {new Date(note.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/5 flex justify-between text-[9px] text-slate-600 font-mono">
          <span>{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
          <span>Encrypted at rest (SQLite)</span>
        </div>
      </div>
    </>
  );
}
