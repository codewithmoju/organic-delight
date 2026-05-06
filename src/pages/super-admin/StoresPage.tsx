import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Plus, Trash2, Pencil, Users, RefreshCw, Crown, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  getAllOrganizations,
  deleteOrganizationAsSuperAdmin,
  updateOrganizationName,
  createStoreForUser,
  getAllUsers,
} from '../../lib/api/superAdmin';
import type { OrgSummary, AdminUserProfile } from '../../lib/types/org';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import SearchInput from '../../components/ui/SearchInput';
import CustomSelect from '../../components/ui/CustomSelect';

export default function StoresPage() {
  const navigate = useNavigate();
  const [stores, setStores] = useState<OrgSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<OrgSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Create store form
  const [showCreate, setShowCreate] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllOrganizations();
      setStores(data);
    } catch {
      toast.error('Failed to load organizations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadUsers = async () => {
    try {
      const data = await getAllUsers({ limitCount: 100 });
      setUsers(data);
    } catch {
      toast.error('Failed to load users');
    }
  };

  const handleCreate = async () => {
    if (!newStoreName.trim() || !selectedUserId) {
      toast.error('Store name and owner are required');
      return;
    }
    setIsCreating(true);
    try {
      await createStoreForUser(newStoreName.trim(), selectedUserId);
      toast.success('Store created successfully');
      setShowCreate(false);
      setNewStoreName('');
      setSelectedUserId('');
      load();
    } catch {
      toast.error('Failed to create store');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      await deleteOrganizationAsSuperAdmin(confirmDelete.id);
      toast.success('Store deleted');
      setStores(prev => prev.filter(s => s.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch {
      toast.error('Failed to delete store');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSave = async (orgId: string) => {
    if (!editName.trim()) return;
    try {
      await updateOrganizationName(orgId, editName.trim());
      setStores(prev => prev.map(s => s.id === orgId ? { ...s, name: editName.trim() } : s));
      setEditingId(null);
      toast.success('Store name updated');
    } catch {
      toast.error('Failed to update store name');
    }
  };

  const filtered = useMemo(() => {
    if (!search) return stores;
    return stores.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  }, [stores, search]);

  const userOptions = users.map(u => ({
    value: u.id,
    label: `${u.full_name} (${u.email})`,
  }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-orange-500/40 via-orange-400/25 to-teal-600/20 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/15 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Store Management</h1>
            <p className="mt-2 text-muted-foreground">{stores.length} organization{stores.length !== 1 ? 's' : ''} across the platform</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowCreate(!showCreate); if (!users.length) loadUsers(); }}
              className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm"
            >
              <Plus className="w-4 h-4" /> Create Store
            </button>
            <button onClick={load} className="btn-secondary flex items-center gap-2 px-4 py-2.5 text-sm">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card-theme rounded-[2.5rem] p-6 space-y-4 border border-border/50">
          <h3 className="font-bold text-foreground text-lg">Create New Store</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Store Name</label>
              <input
                type="text"
                value={newStoreName}
                onChange={e => setNewStoreName(e.target.value)}
                placeholder="Enter store name"
                className="input-theme w-full px-4 py-3 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Owner</label>
              <CustomSelect
                options={userOptions}
                value={selectedUserId}
                onChange={setSelectedUserId}
                placeholder="Select owner..."
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={isCreating} className="btn-primary px-5 py-2.5 text-sm">
              {isCreating ? 'Creating...' : 'Create Store'}
            </button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary px-5 py-2.5 text-sm">Cancel</button>
          </div>
        </motion.div>
      )}

      {/* Search */}
      <SearchInput value={search} onChange={setSearch} placeholder="Search stores by name..." />

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Loading stores..." />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filtered.length === 0 && (
        <EmptyState
          icon={Building2}
          title="No stores found"
          description={search ? 'Try a different search term.' : 'Create your first store to get started.'}
        />
      )}

      {/* Store Grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((store, i) => (
            <motion.div
              key={store.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="card-theme rounded-[2.5rem] overflow-hidden hover:shadow-lg transition-shadow duration-200 border border-orange-500/20 hover:border-orange-500/40 group"
            >
              <div className="h-1.5 bg-gradient-to-r from-orange-400 via-orange-500 to-teal-500" />
              <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <Link to={`/super-admin/stores/${store.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500/30 transition-colors border border-orange-500/30">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {editingId === store.id ? (
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleEditSave(store.id); if (e.key === 'Escape') setEditingId(null); }}
                          className="input-theme px-2 py-1 rounded-lg text-sm flex-1"
                          autoFocus
                        />
                        <button onClick={() => handleEditSave(store.id)} className="text-primary text-xs font-medium px-2">Save</button>
                      </div>
                    ) : (
                      <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">{store.name}</p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Users className="w-3 h-3" /> {store.member_count} member{store.member_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </Link>
                <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditingId(store.id); setEditName(store.name); }}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(store)}
                    className="p-2 rounded-lg hover:bg-error/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-error" />
                  </button>
                </div>
              </div>

              {store.owner_name && (
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Crown className="w-3 h-3" /> Owner: {store.owner_name}
                </p>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Created {format(store.created_at, 'MMM d, yyyy')}
              </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Store"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This will remove all members and cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </motion.div>
  );
}
