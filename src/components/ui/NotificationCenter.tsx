import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Bell, X, CheckCheck, Trash2,
  Info, CheckCircle2, AlertTriangle, AlertCircle,
  ChevronRight
} from 'lucide-react';
import { useNotifications, AppNotification, NotificationType } from '../../lib/hooks/useNotifications';

const TYPE_CONFIG: Record<NotificationType, { icon: any; color: string; bg: string }> = {
  info:    { icon: Info,          color: 'text-blue-500',    bg: 'bg-blue-500/10' },
  success: { icon: CheckCircle2,  color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  warning: { icon: AlertTriangle, color: 'text-warning-500', bg: 'bg-warning-500/10' },
  error:   { icon: AlertCircle,   color: 'text-error-500',   bg: 'bg-error-500/10' },
};

function NotifItem({ notif, onDismiss, onNavigate }: {
  notif: AppNotification;
  onDismiss: () => void;
  onNavigate: () => void;
}) {
  const cfg = TYPE_CONFIG[notif.type];
  const Icon = cfg.icon;
  const timeAgo = formatDistanceToNow(new Date(notif.created_at), { addSuffix: true });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      className={`flex gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors group ${!notif.read ? 'bg-primary/3' : ''}`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </div>
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => { onNavigate(); }}
      >
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-semibold leading-tight ${notif.read ? 'text-muted-foreground' : 'text-foreground'}`}>
            {notif.title}
          </p>
          {!notif.read && (
            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo}</p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDismiss(); }}
        className="p-1 rounded-lg text-muted-foreground/40 hover:text-muted-foreground hover:bg-secondary transition-all opacity-0 group-hover:opacity-100 flex-shrink-0 self-start mt-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { notifications, markRead, markAllRead, dismiss, clearAll } = useNotifications();

  const unread = notifications.filter(n => !n.read).length;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNavigate = (notif: AppNotification) => {
    markRead(notif.id);
    setOpen(false);
    if (notif.link) navigate(notif.link);
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => { setOpen(v => !v); if (!open && unread > 0) markAllRead(); }}
        className="relative p-2.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-error-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
          >
            {unread > 9 ? '9+' : unread}
          </motion.span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                Notifications
                {unread > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {unread}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <>
                    <button onClick={markAllRead} title="Mark all read"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={clearAll} title="Clear all"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-error-500 hover:bg-error-500/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                <button onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-10">
                  <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Low stock alerts, sales, and system events will appear here
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  <AnimatePresence initial={false}>
                    {notifications.map(notif => (
                      <NotifItem
                        key={notif.id}
                        notif={notif}
                        onDismiss={() => dismiss(notif.id)}
                        onNavigate={() => handleNavigate(notif)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-border/50 bg-secondary/20">
                <button
                  onClick={() => { setOpen(false); navigate('/settings/audit'); }}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-primary hover:underline font-medium"
                >
                  View full audit log <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
