import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  fetchNotificationsFromSupabase, 
  fetchUnreadCountFromSupabase,
  markNotificationAsReadInSupabase, 
  markAllNotificationsAsReadInSupabase,
  subscribeUserNotifications 
} from './notificationService';

export function useNotifications(userId, role, options = {}) {
  const { limit = 10, filterCategory = null } = options;
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);
  // Setiap fetch diberi nomor: hanya hasil terbaru yang boleh menulis state (cegah data basi menimpa).
  const requestRef = useRef(0);

  const loadNotifications = useCallback(async () => {
    const myReq = ++requestRef.current;
    if (!userId) {
      if (isMountedRef.current && myReq === requestRef.current) {
        setNotifications([]);
        setUnreadCount(0);
        setIsLoading(false);
      }
      return;
    }

    try {
      const [listRes, count] = await Promise.all([
        fetchNotificationsFromSupabase({
          userId,
          role,
          limit,
          filterCategory
        }),
        fetchUnreadCountFromSupabase(userId)
      ]);

      if (isMountedRef.current && myReq === requestRef.current) {
        if (listRes.error) {
          setError(listRes.error);
        } else {
          setNotifications(listRes.data || []);
          setError(null);
        }
        setUnreadCount(count);
      }
    } catch (err) {
      if (isMountedRef.current && myReq === requestRef.current) {
        setError(err.message || 'Gagal memuat notifikasi');
      }
    } finally {
      if (isMountedRef.current && myReq === requestRef.current) {
        setIsLoading(false);
      }
    }
  }, [userId, role, limit, filterCategory]);

  useEffect(() => {
    // Ganti user -> kosongkan dulu agar notif user lama tidak tampil sesaat (stale).
    setNotifications([]);
    setUnreadCount(0);
    setError(null);
    isMountedRef.current = true;
    setIsLoading(true);
    loadNotifications();

    if (!userId) return undefined;

    // Realtime Supabase Subscription
    const unsubscribe = subscribeUserNotifications(userId, (payload) => {
      // Refresh on any database event (INSERT, UPDATE, DELETE) for this user
      loadNotifications();
    });

    return () => {
      isMountedRef.current = false;
      if (unsubscribe) unsubscribe();
    };
  }, [userId, loadNotifications]);

  const markAsRead = async (notificationId) => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await markNotificationAsReadInSupabase(notificationId);
    } catch (err) {
      console.warn('Gagal menandai notifikasi telah dibaca:', err);
    }
  };

  const markAllAsRead = async () => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsAsReadInSupabase(userId);
    } catch (err) {
      console.warn('Gagal menandai semua notifikasi telah dibaca:', err);
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh: loadNotifications,
    markAsRead,
    markAllAsRead
  };
}
