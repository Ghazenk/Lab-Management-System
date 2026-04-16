import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, AlertCircle, CheckCircle2, Info, Clock } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabase';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'success' | 'info';
  created_at: string;
  read: boolean;
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('Error fetching notifications:', error);
    } else {
      setNotifications(data || []);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAllAsRead = async () => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false);
    
    if (error) console.error('Error marking read:', error);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-surface border-l border-border z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-8 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-serif italic text-on-surface">Notifications</h2>
              </div>
              <button onClick={onClose} className="p-2 text-on-surface-dim hover:text-on-surface transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {notifications.length > 0 ? notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-6 border border-border transition-all hover:border-primary/40 relative group ${!notification.read ? 'bg-primary/[0.02]' : ''}`}
                >
                  {!notification.read && (
                    <div className="absolute top-6 right-6 w-1.5 h-1.5 bg-primary rounded-full" />
                  )}
                  <div className="flex gap-4">
                    <div className="mt-1">
                      {notification.type === 'warning' && <AlertCircle className="w-4 h-4 text-rose-500" />}
                      {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {notification.type === 'info' && <Info className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="space-y-1">
                      <h3 className={`text-[13px] font-bold uppercase tracking-widest ${notification.type === 'warning' ? 'text-rose-500' : 'text-on-surface'}`}>
                        {notification.title}
                      </h3>
                      <p className="text-[12px] text-on-surface-dim leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 pt-2">
                        <Clock className="w-3 h-3 text-on-surface-dim" />
                        <span className="text-[10px] uppercase tracking-widest text-on-surface-dim">{formatTime(notification.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center text-on-surface-dim text-[11px] uppercase tracking-widest">
                  No active alerts
                </div>
              )}
            </div>

            <div className="p-8 border-t border-border">
              <button 
                onClick={markAllAsRead}
                className="w-full py-3 border border-border text-[11px] uppercase tracking-widest font-bold text-on-surface-dim hover:border-primary hover:text-primary transition-all"
              >
                Mark all as read
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
