import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Phone, Mail, Plus, X, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { readScopedJSON, writeScopedJSON } from '../../lib/utils/storageScope';

export interface CommunicationEntry {
  id: string;
  customer_id: string;
  type: 'call' | 'message' | 'email' | 'note';
  content: string;
  created_at: string; // ISO string
}

const TYPE_CONFIG = {
  call:    { icon: Phone,          label: 'Call',    color: 'text-blue-500 bg-blue-500/10' },
  message: { icon: MessageSquare,  label: 'Message', color: 'text-purple-500 bg-purple-500/10' },
  email:   { icon: Mail,           label: 'Email',   color: 'text-emerald-500 bg-emerald-500/10' },
  note:    { icon: MessageSquare,  label: 'Note',    color: 'text-orange-500 bg-orange-500/10' },
};

function getKey(customerId: string) {
  return `comm_log_${customerId}`;
}

function loadLog(customerId: string): CommunicationEntry[] {
  const k = getKey(customerId);
  return readScopedJSON<CommunicationEntry[]>(k, [], undefined, k);
}

function saveLog(customerId: string, entries: CommunicationEntry[]) {
  writeScopedJSON(getKey(customerId), entries);
}

interface CustomerCommunicationLogProps {
  customerId: string;
  customerName: string;
}

export default function CustomerCommunicationLog({ customerId, customerName }: CustomerCommunicationLogProps) {
  const [entries, setEntries] = useState<CommunicationEntry[]>(() => loadLog(customerId));
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<CommunicationEntry['type']>('note');
  const [content, setContent] = useState('');

  const addEntry = () => {
    if (!content.trim()) { toast.error('Enter a note or message'); return; }
    const entry: CommunicationEntry = {
      id: Date.now().toString(),
      customer_id: customerId,
      type,
      content: content.trim(),
      created_at: new Date().toISOString(),
    };
    const updated = [entry, ...entries];
    setEntries(updated);
    saveLog(customerId, updated);
    setContent('');
    setShowForm(false);
    toast.success('Communication logged');
  };

  const deleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    saveLog(customerId, updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          Communication History
        </h3>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Log
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-secondary/30 rounded-2xl p-4 space-y-3 border border-border/40">
              {/* Type selector */}
              <div className="flex gap-2">
                {(Object.keys(TYPE_CONFIG) as CommunicationEntry['type'][]).map(t => {
                  const cfg = TYPE_CONFIG[t];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                        type === t ? `${cfg.color} border-current` : 'border-border/40 text-muted-foreground hover:border-border'
                      }`}
                    >
                      <Icon className="w-3 h-3" /> {cfg.label}
                    </button>
                  );
                })}
              </div>
              <textarea
                autoFocus
                rows={2}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Add a note, call summary, or message..."
                className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                <button onClick={addEntry} className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity">Save</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log entries */}
      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No communication history yet</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => {
            const cfg = TYPE_CONFIG[entry.type];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex gap-3 p-3 rounded-xl bg-secondary/30 border border-border/40 group"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{entry.content}</p>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {format(new Date(entry.created_at), 'MMM d, yyyy · h:mm a')}
                    <span className="capitalize">· {cfg.label}</span>
                  </div>
                </div>
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="p-1 rounded-lg text-muted-foreground/40 hover:text-error-500 hover:bg-error-500/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
