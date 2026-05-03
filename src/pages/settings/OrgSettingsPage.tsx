import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Save, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/store';
import { updateOrganization, deleteOrganization } from '../../lib/api/organizations';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import OrgGuard from '../../components/OrgGuard';

export default function OrgSettingsPage() {
  const navigate = useNavigate();
  const activeOrganization = useAuthStore((s) => s.activeOrganization);
  const membership = useAuthStore((s) => s.membership);
  const setActiveOrganization = useAuthStore((s) => s.setActiveOrganization);
  const [name, setName] = useState(activeOrganization?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const isOwner = membership?.role === 'owner';

  const handleSave = async () => {
    if (!activeOrganization || !name.trim()) return;
    setIsSaving(true);
    try {
      await updateOrganization(activeOrganization.id, { name: name.trim() });
      setActiveOrganization({ ...activeOrganization, name: name.trim() });
      toast.success('Organization name updated');
    } catch {
      toast.error('Failed to update organization');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeOrganization) return;
    setIsDeleting(true);
    try {
      await deleteOrganization(activeOrganization.id);
      toast.success('Organization deleted');
      setActiveOrganization(null);
      navigate('/');
    } catch {
      toast.error('Failed to delete organization');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <OrgGuard>
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/8 via-transparent to-transparent p-5 sm:p-7 border border-border/50"
      >
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1.5 tracking-tight">
            Organization Settings
          </h1>
          <p className="text-foreground-muted text-sm sm:text-base">
            Manage settings for {activeOrganization.name}
          </p>
        </div>
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      </motion.div>

      {/* Name edit */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-theme border border-border/50 rounded-2xl p-5 sm:p-6 space-y-4"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Building2 className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Organization Name</h2>
        </div>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Shop"
          className="w-full h-12 px-4 rounded-xl bg-secondary/50 border-transparent focus:border-primary/50 focus:ring-4 focus:ring-primary/10 text-foreground placeholder-muted-foreground transition-all"
        />

        <div className="flex justify-end">
          <motion.button
            onClick={handleSave}
            disabled={isSaving || !name.trim() || name.trim() === activeOrganization.name}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Danger zone — owner only */}
      {isOwner && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-theme border border-error/30 rounded-2xl p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-error/10 text-error">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Danger Zone</h2>
              <p className="text-xs text-muted-foreground">Irreversible actions</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-error/5 border border-error/20">
            <div>
              <p className="text-sm font-medium text-foreground">Delete Organization</p>
              <p className="text-xs text-muted-foreground">Permanently delete this organization and all its data</p>
            </div>
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-4 py-2 rounded-lg bg-error/10 text-error hover:bg-error/20 text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </motion.div>
      )}

      <ConfirmDialog
        isOpen={confirmDelete}
        title="Delete Organization"
        message={`This will permanently delete "${activeOrganization.name}" and all its data including items, transactions, and team members. This action cannot be undone.`}
        confirmText="Delete Organization"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => { setConfirmDelete(false); setDeleteConfirmText(''); }}
      />
    </div>
    </OrgGuard>
  );
}
