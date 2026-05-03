import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Plus, X, Pencil, Check } from 'lucide-react';
import { toast } from 'sonner';
import { readScopedJSON, writeScopedJSON } from '../../lib/utils/storageScope';

// Groups are stored in localStorage for simplicity (no extra Firestore collection needed)
const GROUPS_KEY = 'customer_groups';

export interface CustomerGroup {
  id: string;
  name: string;
  color: string;
}

const COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-emerald-500',
  'bg-orange-500', 'bg-rose-500', 'bg-indigo-500',
];

export function getGroups(): CustomerGroup[] {
  return readScopedJSON<CustomerGroup[]>(GROUPS_KEY, [], undefined, GROUPS_KEY);
}

export function saveGroups(groups: CustomerGroup[]) {
  writeScopedJSON(GROUPS_KEY, groups);
}

interface CustomerGroupManagerProps {
  onClose: () => void;
}

export default function CustomerGroupManager({ onClose }: CustomerGroupManagerProps) {
  const [groups, setGroups] = useState<CustomerGroup[]>(getGroups);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const addGroup = () => {
    if (!newName.trim()) return;
    const group: CustomerGroup = {
      id: Date.now().toString(),
      name: newName.trim(),
      color: COLORS[groups.length % COLORS.length],
    };
    const updated = [...groups, group];
    setGroups(updated);
    saveGroups(updated);
    setNewName('');
    toast.success(`Group "${group.name}" created`);
  };

  const deleteGroup = (id: string) => {
    const updated = groups.filter(g => g.id !== id);
    setGroups(updated);
    saveGroups(updated);
  };

  const saveEdit = (id: string) => {
    if (!editName.trim()) return;
    const updated = groups.map(g => g.id === id ? { ...g, name: editName.trim() } : g);
    setGroups(updated);
    saveGroups(updated);
    setEditingId(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-sm bg-card rounded-2xl border border-border/60 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" /> Customer Groups
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Add new */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addGroup()}
              placeholder="New group name..."
              className="flex-1 h-9 px-3 bg-secondary/50 border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button onClick={addGroup} className="h-9 px-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          {/* List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <AnimatePresence>
              {groups.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No groups yet. Create one above.</p>
              ) : groups.map(group => (
                <motion.div
                  key={group.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/30 border border-border/40"
                >
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${group.color}`} />
                  {editingId === group.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(group.id); if (e.key === 'Escape') setEditingId(null); }}
                      className="flex-1 h-7 px-2 bg-background border border-primary/50 rounded-lg text-sm text-foreground focus:outline-none"
                    />
                  ) : (
                    <span className="flex-1 text-sm font-medium text-foreground">{group.name}</span>
                  )}
                  <div className="flex gap-1">
                    {editingId === group.id ? (
                      <button onClick={() => saveEdit(group.id)} className="p-1 rounded-lg text-success-500 hover:bg-success-500/10 transition-colors">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button onClick={() => { setEditingId(group.id); setEditName(group.name); }} className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => deleteGroup(group.id)} className="p-1 rounded-lg text-muted-foreground hover:text-error-500 hover:bg-error-500/10 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
