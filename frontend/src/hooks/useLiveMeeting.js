import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';

/**
 * 🔴 useLiveMeeting Hook
 * Real-time meeting collaboration hook
 */
export const useLiveMeeting = meetingId => {
  const { socket } = useSocket();

  // Meeting State
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real-time State
  const [participants, setParticipants] = useState([]);
  const [meetingStatus, setMeetingStatus] = useState('planlanıyor');
  const [currentAgendaItem, setCurrentAgendaItem] = useState(0);
  const [agendaProgress, setAgendaProgress] = useState(0);
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [typingUsers, setTypingUsers] = useState([]);

  /**
   * Fetch meeting data
   */
  const fetchMeeting = useCallback(async () => {
    if (!meetingId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/meetings/${meetingId}`);
      const meetingData = response.data;

      setMeeting(meetingData);
      setMeetingStatus(meetingData.durum);

      // Calculate initial agenda progress
      if (meetingData.gundem?.length > 0) {
        const completedItems = meetingData.gundem.filter(
          item => item.durum === 'tamamlandı',
        ).length;
        setAgendaProgress((completedItems / meetingData.gundem.length) * 100);
      }
    } catch (error) {
      console.error('Error fetching meeting:', error);
      setError(error.response?.data?.message || 'Toplantı yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  /**
   * Join meeting room
   */
  const joinMeeting = useCallback(
    async userData => {
      if (!socket || !meetingId || !userData) {
        return { success: false, error: 'Missing requirements' };
      }

      return new Promise(resolve => {
        // Join meeting room
        socket.emit(
          'meeting:join',
          {
            meetingId,
            userData: {
              id: userData.id,
              isim: userData.isim,
              email: userData.email,
            },
          },
          response => {
            if (response.success) {
              console.log(`✅ Joined meeting ${meetingId}`);
            } else {
              console.error('Failed to join meeting:', response.error);
            }
            resolve(response);
          },
        );
      });
    },
    [socket, meetingId],
  );

  /**
   * Leave meeting room
   */
  const leaveMeeting = useCallback(
    async userData => {
      if (!socket || !meetingId || !userData) {
        return;
      }

      socket.emit('meeting:leave', {
        meetingId,
        userData: {
          id: userData.id,
          isim: userData.isim,
        },
      });

      console.log(`👋 Left meeting ${meetingId}`);
    },
    [socket, meetingId],
  );

  /**
   * Start meeting
   */
  const startMeeting = useCallback(
    async userData => {
      if (!socket || !meetingId) {
        return;
      }

      try {
        // Update meeting status in database
        await api.patch(`/meetings/${meetingId}`, {
          durum: 'devam-ediyor',
          gercekBaslangicSaati: new Date(),
        });

        // Broadcast status change
        socket.emit('meeting:status:change', {
          meetingId,
          status: 'devam-ediyor',
          startTime: new Date(),
          updatedBy: userData.isim,
        });
      } catch (error) {
        console.error('Error starting meeting:', error);
      }
    },
    [socket, meetingId],
  );

  /**
   * Pause meeting
   */
  const pauseMeeting = useCallback(
    async userData => {
      if (!socket || !meetingId) {
        return;
      }

      try {
        await api.patch(`/meetings/${meetingId}`, {
          durum: 'bekliyor',
        });

        socket.emit('meeting:status:change', {
          meetingId,
          status: 'bekliyor',
          updatedBy: userData.isim,
        });
      } catch (error) {
        console.error('Error pausing meeting:', error);
      }
    },
    [socket, meetingId],
  );

  /**
   * End meeting
   */
  const endMeeting = useCallback(
    async userData => {
      if (!socket || !meetingId) {
        return;
      }

      try {
        const endTime = new Date();
        const startTime = meeting?.gercekBaslangicSaati || meeting?.tarih;
        const duration = startTime
          ? Math.round((endTime - new Date(startTime)) / 1000 / 60)
          : 0;

        await api.patch(`/meetings/${meetingId}`, {
          durum: 'tamamlandı',
          gercekBitisSaati: endTime,
          toplamSure: duration,
        });

        socket.emit('meeting:status:change', {
          meetingId,
          status: 'tamamlandı',
          endTime,
          duration,
          updatedBy: userData.isim,
        });
      } catch (error) {
        console.error('Error ending meeting:', error);
      }
    },
    [socket, meetingId, meeting],
  );

  /**
   * Update agenda progress
   */
  const updateAgendaProgress = useCallback(
    async (agendaItemIndex, newStatus) => {
      if (!socket || !meetingId || !meeting) {
        return;
      }

      try {
        // Update meeting in database
        const updatedGundem = [...meeting.gundem];
        updatedGundem[agendaItemIndex].durum = newStatus;

        await api.patch(`/meetings/${meetingId}`, {
          gundem: updatedGundem,
        });

        // Update local state
        setMeeting(prev => ({
          ...prev,
          gundem: updatedGundem,
        }));

        // Calculate new progress
        const completedItems = updatedGundem.filter(
          item => item.durum === 'tamamlandı',
        ).length;
        const newProgress = (completedItems / updatedGundem.length) * 100;
        setAgendaProgress(newProgress);

        // Broadcast agenda progress
        socket.emit('meeting:agenda:progress', {
          meetingId,
          currentItem: agendaItemIndex,
          status: newStatus,
          progress: newProgress,
        });
      } catch (error) {
        console.error('Error updating agenda progress:', error);
      }
    },
    [socket, meetingId, meeting],
  );

  /**
   * Send typing indicator
   */
  const sendTypingStatus = useCallback(
    (isTyping, userData) => {
      if (!socket || !meetingId) {
        return;
      }

      socket.emit('meeting:typing', {
        meetingId,
        userData: {
          id: userData.id,
          isim: userData.isim,
        },
        isTyping,
      });
    },
    [socket, meetingId],
  );

  /**
   * Broadcast note update
   */
  const broadcastNoteUpdate = useCallback(
    (noteData, userData) => {
      if (!socket || !meetingId) {
        return;
      }

      socket.emit('meeting:note:update', {
        meetingId,
        noteData: {
          ...noteData,
          updatedBy: userData.isim,
          timestamp: new Date(),
        },
      });
    },
    [socket, meetingId],
  );

  /**
   * Socket event listeners
   */
  useEffect(() => {
    if (!socket || !meetingId) {
      return;
    }

    // Participant events
    const handleParticipantJoined = data => {
      setParticipants(prev => {
        const exists = prev.find(p => p.userId === data.userId);
        if (exists) {
          return prev;
        }

        return [
          ...prev,
          {
            userId: data.userId,
            name: data.name,
            joinedAt: data.joinedAt,
            isTyping: false,
          },
        ];
      });
    };

    const handleParticipantLeft = data => {
      setParticipants(prev => prev.filter(p => p.userId !== data.userId));
    };

    const handleParticipantsList = data => {
      setParticipants(data.participants || []);
    };

    // Meeting status events
    const handleStatusChange = data => {
      setMeetingStatus(data.status);
      if (data.duration) {
        setMeetingDuration(data.duration);
      }
    };

    // Agenda progress events
    const handleAgendaProgress = data => {
      setCurrentAgendaItem(data.currentItem);
      setAgendaProgress(data.progress || 0);
    };

    // Typing events
    const handleTyping = data => {
      setTypingUsers(prev => {
        if (data.isTyping) {
          // Add user to typing list
          const exists = prev.find(u => u.userId === data.userId);
          if (exists) {
            return prev;
          }
          return [...prev, { userId: data.userId, name: data.name }];
        } else {
          // Remove user from typing list
          return prev.filter(u => u.userId !== data.userId);
        }
      });

      // Update participants typing status
      setParticipants(prev =>
        prev.map(p =>
          p.userId === data.userId ? { ...p, isTyping: data.isTyping } : p,
        ),
      );
    };

    // Register listeners
    socket.on('meeting:participant:joined', handleParticipantJoined);
    socket.on('meeting:participant:left', handleParticipantLeft);
    socket.on('meeting:participants:list', handleParticipantsList);
    socket.on('meeting:status:change', handleStatusChange);
    socket.on('meeting:agenda:progress', handleAgendaProgress);
    socket.on('meeting:typing', handleTyping);

    // Cleanup
    return () => {
      socket.off('meeting:participant:joined', handleParticipantJoined);
      socket.off('meeting:participant:left', handleParticipantLeft);
      socket.off('meeting:participants:list', handleParticipantsList);
      socket.off('meeting:status:change', handleStatusChange);
      socket.off('meeting:agenda:progress', handleAgendaProgress);
      socket.off('meeting:typing', handleTyping);
    };
  }, [socket, meetingId]);

  return {
    // Data
    meeting,
    participants,
    loading,
    error,

    // Real-time state
    meetingStatus,
    currentAgendaItem,
    agendaProgress,
    meetingDuration,
    typingUsers,

    // Actions
    fetchMeeting,
    joinMeeting,
    leaveMeeting,
    startMeeting,
    pauseMeeting,
    endMeeting,
    updateAgendaProgress,
    sendTypingStatus,
    broadcastNoteUpdate,
  };
};
