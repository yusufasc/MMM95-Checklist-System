import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useSnackbar } from './SnackbarContext';
import api from '../services/api';

/**
 * 🔔 MMM95 Notification Context
 * Real-time notification management ve Socket.IO connection
 */

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotifications hook must be used within NotificationProvider',
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, token } = useAuth();
  const { showSnackbar } = useSnackbar();

  // Socket connection state
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Refs for cleanup and avoiding stale closures
  const socketRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  /**
   * Handle new notification
   */
  const handleNewNotification = useCallback(
    notificationData => {
      // Add to notifications list
      setNotifications(prev => [notificationData, ...prev]);

      // Show snackbar if notification is not auto-dismissible
      const { baslik, mesaj, metadata } = notificationData;
      const severity = metadata?.renk || 'info';
      const autoHideDuration = metadata?.otomatikKapat
        ? metadata?.otomatikKapatSuresi
        : null;

      showSnackbar(
        `${baslik}: ${mesaj}`,
        severity,
        autoHideDuration ? { autoHideDuration } : { persist: true },
      );
    },
    [showSnackbar],
  );

  /**
   * Initialize Socket.IO connection
   */
  const initializeSocket = useCallback(() => {
    if (!user || !token) {
      console.log('🔌 No user/token, skipping socket connection');
      return;
    }

    try {
      console.log('🔌 Initializing Socket.IO connection...');

      const socketInstance = io(
        process.env.REACT_APP_API_URL?.replace('/api', '') ||
          'http://localhost:3001',
        {
          auth: {
            token: token,
          },
          transports: ['websocket', 'polling'],
          timeout: 20000,
          reconnection: true,
          reconnectionAttempts: maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
        },
      );

      // Connection events
      socketInstance.on('connect', () => {
        console.log('🟢 Socket.IO connected:', socketInstance.id);
        setConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;

        // Emit user online status
        socketInstance.emit('user:online');
      });

      socketInstance.on('disconnect', reason => {
        console.log('🔴 Socket.IO disconnected:', reason);
        setConnected(false);

        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          socketInstance.connect();
        }
      });

      socketInstance.on('connect_error', error => {
        console.error('❌ Socket.IO connection error:', error.message);
        setConnectionError(error.message);
        reconnectAttempts.current += 1;

        if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.error('🚫 Max reconnection attempts reached');
          socketInstance.disconnect();
        }
      });

      // Notification events
      socketInstance.on('notification:welcome', data => {
        console.log('🎉 Welcome message:', data);
        showSnackbar(
          `Hoş geldin ${user.ad}! ${data.connectedUsers} kullanıcı online.`,
          'info',
        );
      });

      socketInstance.on('notification:new', notificationData => {
        console.log('🔔 New notification received:', notificationData);
        handleNewNotification(notificationData);
      });

      socketInstance.on('notification:unreadCount', data => {
        console.log('📊 Unread count update:', data.count);
        setUnreadCount(data.count);
      });

      // Error handling
      socketInstance.on('error', error => {
        console.error('❌ Socket error:', error);
        showSnackbar(error.message || 'Bağlantı hatası', 'error');
      });

      socketRef.current = socketInstance;
      setSocket(socketInstance);
    } catch (error) {
      console.error('❌ Socket initialization error:', error);
      setConnectionError(error.message);
    }
  }, [user, token, showSnackbar, handleNewNotification]);

  /**
   * Disconnect socket
   */
  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 Disconnecting Socket.IO...');
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    }
  }, []);

  /**
   * Load notifications from API
   */
  const loadNotifications = useCallback(
    async (options = {}) => {
      try {
        setLoading(true);
        const response = await api.get('/notifications', { params: options });
        setNotifications(response.data.notifications || []);
        return response.data;
      } catch (error) {
        console.error('❌ Load notifications error:', error);
        showSnackbar('Bildirimler yüklenemedi', 'error');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [showSnackbar],
  );

  /**
   * Load unread count
   */
  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.count || 0);
      return response.data.count;
    } catch (error) {
      console.error('❌ Load unread count error:', error);
      return 0;
    }
  }, []);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(
    async notificationId => {
      try {
        await api.put(`/notifications/${notificationId}/read`);

        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n._id === notificationId
              ? { ...n, okundu: true, okunmaTarihi: new Date() }
              : n,
          ),
        );

        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));

        return true;
      } catch (error) {
        console.error('❌ Mark as read error:', error);
        showSnackbar('Bildirim okundu olarak işaretlenemedi', 'error');
        return false;
      }
    },
    [showSnackbar],
  );

  /**
   * Mark multiple notifications as read
   */
  const markMultipleAsRead = useCallback(
    async notificationIds => {
      try {
        const response = await api.put('/notifications/read-multiple', {
          notificationIds,
        });

        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            notificationIds.includes(n._id)
              ? { ...n, okundu: true, okunmaTarihi: new Date() }
              : n,
          ),
        );

        // Refresh unread count
        await loadUnreadCount();

        return response.data.modifiedCount;
      } catch (error) {
        console.error('❌ Mark multiple as read error:', error);
        showSnackbar('Bildirimler okundu olarak işaretlenemedi', 'error');
        return 0;
      }
    },
    [showSnackbar, loadUnreadCount],
  );

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await api.put('/notifications/read-all');

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, okundu: true, okunmaTarihi: new Date() })),
      );

      setUnreadCount(0);

      showSnackbar(
        `${response.data.modifiedCount} bildirim okundu olarak işaretlendi`,
        'success',
      );
      return response.data.modifiedCount;
    } catch (error) {
      console.error('❌ Mark all as read error:', error);
      showSnackbar('Tüm bildirimler okundu olarak işaretlenemedi', 'error');
      return 0;
    }
  }, [showSnackbar]);

  /**
   * Delete notification
   */
  const deleteNotification = useCallback(
    async notificationId => {
      try {
        await api.delete(`/notifications/${notificationId}`);

        // Update local state
        const deletedNotification = notifications.find(
          n => n._id === notificationId,
        );
        setNotifications(prev => prev.filter(n => n._id !== notificationId));

        // Update unread count if notification was unread
        if (deletedNotification && !deletedNotification.okundu) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }

        return true;
      } catch (error) {
        console.error('❌ Delete notification error:', error);
        showSnackbar('Bildirim silinemedi', 'error');
        return false;
      }
    },
    [notifications, showSnackbar],
  );

  /**
   * Send test notification (Admin only)
   */
  const sendTestNotification = useCallback(
    async (recipientUserId = null) => {
      try {
        const response = await api.post('/notifications/test', {
          recipientUserId,
        });
        showSnackbar('Test bildirimi gönderildi', 'success');
        return response.data;
      } catch (error) {
        console.error('❌ Send test notification error:', error);
        showSnackbar('Test bildirimi gönderilemedi', 'error');
        throw error;
      }
    },
    [showSnackbar],
  );

  /**
   * Socket.IO event emitters
   */
  const emitNotificationRead = useCallback(
    notificationIds => {
      if (socketRef.current && connected) {
        socketRef.current.emit('notification:read', { notificationIds });
      }
    },
    [connected],
  );

  const emitNotificationReadAll = useCallback(() => {
    if (socketRef.current && connected) {
      socketRef.current.emit('notification:readAll');
    }
  }, [connected]);

  // Initialize socket when user/token changes
  useEffect(() => {
    if (user && token) {
      initializeSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [user, token, initializeSocket, disconnectSocket]);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadUnreadCount();
      loadNotifications({ limit: 20 });
    }
  }, [user, loadUnreadCount, loadNotifications]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, [disconnectSocket]);

  const value = {
    // Socket state
    socket,
    connected,
    connectionError,

    // Notification state
    notifications,
    unreadCount,
    loading,

    // API methods
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    deleteNotification,
    sendTestNotification,

    // Socket event emitters
    emitNotificationRead,
    emitNotificationReadAll,

    // Connection management
    initializeSocket,
    disconnectSocket,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
