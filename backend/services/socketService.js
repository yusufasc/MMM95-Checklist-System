const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

/**
 * 🔌 MMM95 Socket.IO Service
 * Real-time notification ve communication sistemi
 */
class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> { socketId, userData }
    this.userSockets = new Map(); // socketId -> userId
    this.initialized = false;
  }

  /**
   * Initialize Socket.IO server
   */
  init(httpServer) {
    try {
      this.io = new Server(httpServer, {
        cors: {
          origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
          methods: ['GET', 'POST'],
          credentials: true,
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000,
      });

      this.setupMiddleware();
      this.setupEventHandlers();
      this.initialized = true;

      logger.info('✅ Socket.IO service initialized successfully');
    } catch (error) {
      logger.error('❌ Socket.IO initialization failed:', error);
      this.initialized = false;
    }
  }

  /**
   * Setup authentication middleware
   */
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        logger.info(`🔍 JWT decoded for user ID: ${decoded.user?.id}`);
        
        const user = await User.findById(decoded.user.id).select(
          'ad soyad email rol durum',
        );

        if (!user) {
          logger.error(`❌ User not found in database: ${decoded.user.id}`);
          return next(new Error('User not found or inactive'));
        }

        logger.info(`👤 User found: ${user.ad} ${user.soyad}, durum: ${user.durum}`);

        if (user.durum !== 'aktif') {
          logger.error(`❌ User not active: ${user.ad} ${user.soyad}, durum: ${user.durum}`);
          return next(new Error('User not found or inactive'));
        }

        socket.userId = user._id.toString();
        socket.userData = {
          id: user._id,
          ad: user.ad,
          soyad: user.soyad,
          email: user.email,
          rol: user.rol,
        };

        logger.info(
          `🔌 User authenticated: ${user.ad} ${user.soyad} (${socket.id})`,
        );
        next();
      } catch (error) {
        logger.error('❌ Socket authentication failed:', error.message);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', socket => {
      this.handleConnection(socket);

      // User presence events
      socket.on('user:online', () => this.handleUserOnline(socket));
      socket.on('user:typing', data => this.handleUserTyping(socket, data));

      // Notification events
      socket.on('notification:read', data =>
        this.handleNotificationRead(socket, data),
      );
      socket.on('notification:readAll', () =>
        this.handleNotificationReadAll(socket),
      );

      // Meeting events - PHASE 8: Real-time Collaboration
      socket.on('meeting:join', (data, callback) =>
        this.handleMeetingJoin(socket, data, callback),
      );
      socket.on('meeting:leave', data => this.handleMeetingLeave(socket, data));
      socket.on('meeting:note:update', data =>
        this.handleMeetingNoteUpdate(socket, data),
      );
      socket.on('meeting:typing', data =>
        this.handleMeetingTyping(socket, data),
      );
      socket.on('meeting:agenda:progress', data =>
        this.handleAgendaProgress(socket, data),
      );
      socket.on('meeting:status:change', data =>
        this.handleMeetingStatusChange(socket, data),
      );

      // Disconnect event
      socket.on('disconnect', () => this.handleDisconnection(socket));
    });
  }

  /**
   * Handle new connection
   */
  handleConnection(socket) {
    const userId = socket.userId;

    // Store connection
    this.connectedUsers.set(userId, {
      socketId: socket.id,
      userData: socket.userData,
      connectedAt: new Date(),
      lastActivity: new Date(),
    });
    this.userSockets.set(socket.id, userId);

    // Join user to their personal room
    socket.join(`user:${userId}`);

    // Send welcome and unread count
    this.sendWelcomeMessage(socket);
    this.sendUnreadCount(socket);

    logger.info(
      `🟢 User connected: ${socket.userData.ad} ${socket.userData.soyad} (Total: ${this.connectedUsers.size})`,
    );
  }

  /**
   * Handle user disconnect
   */
  handleDisconnection(socket) {
    const userId = socket.userId;

    if (userId) {
      this.connectedUsers.delete(userId);
      this.userSockets.delete(socket.id);

      logger.info(
        `🔴 User disconnected: ${socket.userData?.ad} ${socket.userData?.soyad} (Total: ${this.connectedUsers.size})`,
      );
    }
  }

  /**
   * Handle user online status
   */
  handleUserOnline(socket) {
    const connection = this.connectedUsers.get(socket.userId);
    if (connection) {
      connection.lastActivity = new Date();
    }
  }

  /**
   * Handle user typing indicator
   */
  handleUserTyping(socket, data) {
    // For future real-time collaboration features
    const { meetingId, typing } = data;
    if (meetingId) {
      socket.to(`meeting:${meetingId}`).emit('user:typing', {
        userId: socket.userId,
        userData: socket.userData,
        typing,
      });
    }
  }

  /**
   * Handle notification read
   */
  async handleNotificationRead(socket, data) {
    try {
      const { notificationIds } = data;

      if (Array.isArray(notificationIds) && notificationIds.length > 0) {
        await Notification.markAsRead(notificationIds, socket.userId);

        // Send updated unread count
        this.sendUnreadCount(socket);

        logger.info(
          `📖 User ${socket.userId} marked ${notificationIds.length} notifications as read`,
        );
      }
    } catch (error) {
      logger.error('❌ Notification read error:', error);
      socket.emit('error', {
        message: 'Bildirim okundu olarak işaretlenemedi',
      });
    }
  }

  /**
   * Handle read all notifications
   */
  async handleNotificationReadAll(socket) {
    try {
      // Get all unread notification IDs
      const unreadNotifications = await Notification.find({
        kullanici: socket.userId,
        okundu: false,
        silindiMi: false,
      }).select('_id');

      const notificationIds = unreadNotifications.map(n => n._id);

      if (notificationIds.length > 0) {
        await Notification.markAsRead(notificationIds, socket.userId);
        this.sendUnreadCount(socket);

        logger.info(
          `📖 User ${socket.userId} marked all (${notificationIds.length}) notifications as read`,
        );
      }
    } catch (error) {
      logger.error('❌ Mark all read error:', error);
      socket.emit('error', {
        message: 'Tüm bildirimler okundu olarak işaretlenemedi',
      });
    }
  }

  /**
   * Handle simple meeting join (legacy - for future features)
   */
  handleSimpleMeetingJoin(socket, data) {
    const { meetingId } = data;
    if (meetingId) {
      socket.join(`meeting:${meetingId}`);
      socket.to(`meeting:${meetingId}`).emit('meeting:participantJoined', {
        userId: socket.userId,
        userData: socket.userData,
      });

      logger.info(`👥 User ${socket.userId} joined meeting ${meetingId}`);
    }
  }

  /**
   * Handle simple meeting leave (legacy - for future features)
   */
  handleSimpleMeetingLeave(socket, data) {
    const { meetingId } = data;
    if (meetingId) {
      socket.leave(`meeting:${meetingId}`);
      socket.to(`meeting:${meetingId}`).emit('meeting:participantLeft', {
        userId: socket.userId,
        userData: socket.userData,
      });

      logger.info(`👥 User ${socket.userId} left meeting ${meetingId}`);
    }
  }

  /**
   * Send welcome message
   */
  sendWelcomeMessage(socket) {
    socket.emit('notification:welcome', {
      message: `Hoş geldin ${socket.userData.ad}!`,
      timestamp: new Date(),
      connectedUsers: this.connectedUsers.size,
    });
  }

  /**
   * Send unread notification count
   */
  async sendUnreadCount(socket) {
    try {
      const unreadCount = await Notification.getUnreadCount(socket.userId);
      socket.emit('notification:unreadCount', { count: unreadCount });
    } catch (error) {
      logger.error('❌ Unread count error:', error);
    }
  }

  /**
   * Send notification to specific user
   */
  async sendNotificationToUser(userId, notification) {
    if (!this.initialized) {
      logger.warn('⚠️ Socket.IO not initialized, skipping notification');
      return false;
    }

    try {
      const connection = this.connectedUsers.get(userId.toString());

      if (connection) {
        // User is online, send real-time notification
        this.io.to(`user:${userId}`).emit('notification:new', notification);

        // Also send updated unread count
        const unreadCount = await Notification.getUnreadCount(userId);
        this.io
          .to(`user:${userId}`)
          .emit('notification:unreadCount', { count: unreadCount });

        logger.info(`🔔 Real-time notification sent to user ${userId}`);
        return true;
      } else {
        // User is offline, notification will be stored in database
        logger.info(
          `📴 User ${userId} is offline, notification stored for later`,
        );
        return false;
      }
    } catch (error) {
      logger.error('❌ Send notification error:', error);
      return false;
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendNotificationToUsers(userIds, notification) {
    const results = await Promise.all(
      userIds.map(userId => this.sendNotificationToUser(userId, notification)),
    );

    const onlineCount = results.filter(r => r).length;
    logger.info(
      `🔔 Notification sent to ${onlineCount}/${userIds.length} online users`,
    );

    return results;
  }

  /**
   * Broadcast meeting update
   */
  broadcastMeetingUpdate(meetingId, updateData) {
    if (!this.initialized) {
      return;
    }

    this.io.to(`meeting:${meetingId}`).emit('meeting:update', updateData);
    logger.info(`📡 Meeting update broadcasted for meeting ${meetingId}`);
  }

  // ===== PHASE 8: REAL-TIME COLLABORATION =====

  /**
   * Join user to live meeting room
   */
  joinMeetingRoom(socket, meetingId, userData) {
    try {
      const roomName = `meeting:${meetingId}`;
      socket.join(roomName);

      // Track meeting participants
      if (!this.meetingParticipants) {
        this.meetingParticipants = new Map();
      }

      if (!this.meetingParticipants.has(meetingId)) {
        this.meetingParticipants.set(meetingId, new Map());
      }

      const participants = this.meetingParticipants.get(meetingId);
      participants.set(socket.id, {
        userId: userData.id,
        name: userData.isim,
        joinedAt: new Date(),
        isTyping: false,
        lastActivity: new Date(),
      });

      // Notify other participants
      socket.to(roomName).emit('meeting:participant:joined', {
        userId: userData.id,
        name: userData.isim,
        joinedAt: new Date(),
        totalParticipants: participants.size,
      });

      // Send current participants to new joiner
      socket.emit('meeting:participants:list', {
        participants: Array.from(participants.values()),
        totalCount: participants.size,
      });

      logger.info(`👥 User ${userData.isim} joined meeting ${meetingId} room`);
      return { success: true, participantCount: participants.size };
    } catch (error) {
      logger.error('Error joining meeting room:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Leave meeting room
   */
  leaveMeetingRoom(socket, meetingId, userData) {
    try {
      const roomName = `meeting:${meetingId}`;
      socket.leave(roomName);

      if (this.meetingParticipants?.has(meetingId)) {
        const participants = this.meetingParticipants.get(meetingId);
        participants.delete(socket.id);

        // Notify other participants
        socket.to(roomName).emit('meeting:participant:left', {
          userId: userData.id,
          name: userData.isim,
          leftAt: new Date(),
          totalParticipants: participants.size,
        });

        // Clean up empty meeting rooms
        if (participants.size === 0) {
          this.meetingParticipants.delete(meetingId);
        }
      }

      logger.info(`👥 User ${userData.isim} left meeting ${meetingId} room`);
    } catch (error) {
      logger.error('Error leaving meeting room:', error);
    }
  }

  /**
   * Handle real-time note collaboration
   */
  broadcastNoteUpdate(meetingId, noteData, senderSocket) {
    try {
      const roomName = `meeting:${meetingId}`;

      // Broadcast to all except sender
      senderSocket.to(roomName).emit('meeting:note:update', {
        noteId: noteData.noteId,
        content: noteData.content,
        updatedBy: noteData.updatedBy,
        timestamp: new Date(),
        version: noteData.version || 1,
      });

      logger.info(`📝 Note update broadcasted in meeting ${meetingId}`);
    } catch (error) {
      logger.error('Error broadcasting note update:', error);
    }
  }

  /**
   * Handle typing indicators
   */
  broadcastTypingStatus(meetingId, userData, isTyping, senderSocket) {
    try {
      const roomName = `meeting:${meetingId}`;

      // Update typing status in participants
      if (this.meetingParticipants?.has(meetingId)) {
        const participants = this.meetingParticipants.get(meetingId);
        const participant = participants.get(senderSocket.id);
        if (participant) {
          participant.isTyping = isTyping;
          participant.lastActivity = new Date();
        }
      }

      // Broadcast typing status
      senderSocket.to(roomName).emit('meeting:typing', {
        userId: userData.id,
        name: userData.isim,
        isTyping: isTyping,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error('Error broadcasting typing status:', error);
    }
  }

  /**
   * Broadcast agenda progress update
   */
  broadcastAgendaProgress(meetingId, agendaData) {
    try {
      const roomName = `meeting:${meetingId}`;

      this.io.to(roomName).emit('meeting:agenda:progress', {
        currentItem: agendaData.currentItem,
        timeSpent: agendaData.timeSpent,
        status: agendaData.status,
        updatedAt: new Date(),
      });

      logger.info(`📋 Agenda progress updated in meeting ${meetingId}`);
    } catch (error) {
      logger.error('Error broadcasting agenda progress:', error);
    }
  }

  /**
   * Broadcast meeting status change (start/pause/end)
   */
  broadcastMeetingStatus(meetingId, statusData) {
    try {
      const roomName = `meeting:${meetingId}`;

      this.io.to(roomName).emit('meeting:status:change', {
        status: statusData.status,
        startTime: statusData.startTime,
        endTime: statusData.endTime,
        duration: statusData.duration,
        updatedBy: statusData.updatedBy,
        timestamp: new Date(),
      });

      logger.info(
        `🔄 Meeting status updated to ${statusData.status} in meeting ${meetingId}`,
      );
    } catch (error) {
      logger.error('Error broadcasting meeting status:', error);
    }
  }

  /**
   * Get meeting participants count
   */
  getMeetingParticipantsCount(meetingId) {
    if (!this.meetingParticipants?.has(meetingId)) {
      return 0;
    }
    return this.meetingParticipants.get(meetingId).size;
  }

  /**
   * Get meeting participants list
   */
  getMeetingParticipants(meetingId) {
    if (!this.meetingParticipants?.has(meetingId)) {
      return [];
    }

    const participants = this.meetingParticipants.get(meetingId);
    return Array.from(participants.values());
  }

  // ===== MEETING EVENT HANDLERS =====

  /**
   * Handle meeting join event
   */
  handleMeetingJoin(socket, data, callback) {
    try {
      const { meetingId, userData } = data;

      if (!meetingId || !userData) {
        const error = {
          success: false,
          error: 'Missing meetingId or userData',
        };
        if (callback) {
          callback(error);
        }
        return;
      }

      const result = this.joinMeetingRoom(socket, meetingId, userData);

      if (callback) {
        callback(result);
      }

      logger.info(
        `👥 Meeting join handled: ${userData.isim} -> meeting ${meetingId}`,
      );
    } catch (error) {
      logger.error('Error handling meeting join:', error);
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  }

  /**
   * Handle meeting leave event
   */
  handleMeetingLeave(socket, data) {
    try {
      const { meetingId, userData } = data;

      if (!meetingId || !userData) {
        logger.warn('Missing meetingId or userData in meeting leave');
        return;
      }

      this.leaveMeetingRoom(socket, meetingId, userData);

      logger.info(
        `👋 Meeting leave handled: ${userData.isim} <- meeting ${meetingId}`,
      );
    } catch (error) {
      logger.error('Error handling meeting leave:', error);
    }
  }

  /**
   * Handle meeting note update
   */
  handleMeetingNoteUpdate(socket, data) {
    try {
      const { meetingId, noteData } = data;

      if (!meetingId || !noteData) {
        logger.warn('Missing meetingId or noteData in note update');
        return;
      }

      this.broadcastNoteUpdate(meetingId, noteData, socket);

      logger.info(`📝 Note update handled in meeting ${meetingId}`);
    } catch (error) {
      logger.error('Error handling note update:', error);
    }
  }

  /**
   * Handle meeting typing event
   */
  handleMeetingTyping(socket, data) {
    try {
      const { meetingId, userData, isTyping } = data;

      if (!meetingId || !userData) {
        logger.warn('Missing meetingId or userData in typing event');
        return;
      }

      this.broadcastTypingStatus(meetingId, userData, isTyping, socket);
    } catch (error) {
      logger.error('Error handling typing event:', error);
    }
  }

  /**
   * Handle agenda progress update
   */
  handleAgendaProgress(socket, data) {
    try {
      const { meetingId, currentItem, status, progress } = data;

      if (!meetingId) {
        logger.warn('Missing meetingId in agenda progress');
        return;
      }

      this.broadcastAgendaProgress(meetingId, {
        currentItem,
        status,
        progress,
      });

      logger.info(
        `📋 Agenda progress updated in meeting ${meetingId}: item ${currentItem}`,
      );
    } catch (error) {
      logger.error('Error handling agenda progress:', error);
    }
  }

  /**
   * Handle meeting status change
   */
  handleMeetingStatusChange(socket, data) {
    try {
      const { meetingId, status, startTime, endTime, duration, updatedBy } =
        data;

      if (!meetingId || !status) {
        logger.warn('Missing meetingId or status in status change');
        return;
      }

      this.broadcastMeetingStatus(meetingId, {
        status,
        startTime,
        endTime,
        duration,
        updatedBy,
      });

      logger.info(
        `🔄 Meeting status changed in meeting ${meetingId}: ${status}`,
      );
    } catch (error) {
      logger.error('Error handling meeting status change:', error);
    }
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      initialized: this.initialized,
      connectedUsers: this.connectedUsers.size,
      totalConnections: this.userSockets.size,
      onlineUsers: Array.from(this.connectedUsers.values()).map(conn => ({
        userData: conn.userData,
        connectedAt: conn.connectedAt,
        lastActivity: conn.lastActivity,
      })),
    };
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId) {
    return this.connectedUsers.has(userId.toString());
  }

  /**
   * Get online users count
   */
  getOnlineUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Cleanup connections (for graceful shutdown)
   */
  cleanup() {
    if (this.io) {
      this.io.close();
      this.connectedUsers.clear();
      this.userSockets.clear();
      logger.info('🔌 Socket.IO service cleaned up');
    }
  }
}

// Export singleton instance
module.exports = new SocketService();
