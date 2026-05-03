import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Pencil, Trash2, Check, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLocations, Location } from '../../lib/hooks/useLocations';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function LocationsPage() {
  const { locations, addLocation, updateLocation, deleteLocation, setDefault, activeLocationId, setActive } = useLocations();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null);

  const handleAdd = () => {
    if (!newName.trim()) { toast.error('Location name is required'); return; }
    addLocation(newName.trim(), newAddress.trim() || undefined);
    toast.success(`Location "${newName.trim()}" added`);
    setNewName('');
    setNewAddress('');
    setShowAdd(false);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) { toast.error('Name is required'); return; }
    updateLocation(id, { name: editName.trim(), address: editAddress.trim() || undefined });
    setEditingId(null);
    toast.success('Location updated');
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (locations.length === 1) { toast.error('Cannot delete the only location'); return; }
    deleteLocation(deleteTarget.id);
    toast.success(`"${deleteTarget.name}" deleted`);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="app-page-title flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
            Locations & Branches
          </h1>
          <p className="app-page-subtitle">Manage your store locations and branches</p>
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Add Location
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-foreground">New Location</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name *</label>
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. Main Store, Warehouse A"
                    className="w-full h-10 px-3 bg-secondary/50 border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    autoFocus />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Address</label>
                  <input type="text" value={newAddress} onChange={e => setNewAddress(e.target.value)}
                    placeholder="Optional address"
                    className="w-full h-10 px-3 bg-secondary/50 border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                <button onClick={handleAdd} className="btn-primary px-5 py-2 rounded-xl text-sm font-semibold">Add</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location list */}
      {locations.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border/60">
          <MapPin className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-foreground font-medium">No locations yet</p>
          <p className="text-muted-foreground text-sm mt-1">Add your first location to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {locations.map((loc, i) => (
            <motion.div
              key={loc.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-card rounded-2xl border shadow-sm overflow-hidden ${
                activeLocationId === loc.id ? 'border-primary/40' : 'border-border/60'
              }`}
            >
              {editingId === loc.id ? (
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                      className="h-9 px-3 bg-secondary/50 border border-border/60 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    <input type="text" value={editAddress} onChange={e => setEditAddress(e.target.value)}
                      placeholder="Address"
                      className="h-9 px-3 bg-secondary/50 border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
                    <button onClick={() => handleSaveEdit(loc.id)} className="p-1.5 rounded-lg text-success-500 hover:bg-success-500/10 transition-colors"><Check className="w-4 h-4" /></button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    activeLocationId === loc.id ? 'bg-primary/10 text-primary' : 'bg-secondary/50 text-muted-foreground'
                  }`}>
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{loc.name}</p>
                      {loc.is_default && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-semibold">
                          <Star className="w-3 h-3" /> Default
                        </span>
                      )}
                      {activeLocationId === loc.id && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-success-500/10 text-success-500 text-xs font-semibold">Active</span>
                      )}
                    </div>
                    {loc.address && <p className="text-xs text-muted-foreground mt-0.5">{loc.address}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {activeLocationId !== loc.id && (
                      <button onClick={() => setActive(loc.id)}
                        className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-medium text-foreground transition-colors">
                        Switch
                      </button>
                    )}
                    {!loc.is_default && (
                      <button onClick={() => setDefault(loc.id)} title="Set as default"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10 transition-colors">
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => { setEditingId(loc.id); setEditName(loc.name); setEditAddress(loc.address || ''); }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    {locations.length > 1 && (
                      <button onClick={() => setDeleteTarget(loc)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-error-500 hover:bg-error-500/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Location"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
