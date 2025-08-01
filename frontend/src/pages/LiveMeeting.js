import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  Badge,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  ExitToApp as ExitIcon,
  People as PeopleIcon,
  Assignment as AgendaIcon,
  Notes as NotesIcon,
} from '@mui/icons-material';

// Import components
import LiveParticipants from '../components/LiveMeeting/LiveParticipants';
import CollaborativeNotes from '../components/LiveMeeting/CollaborativeNotes';
import AgendaTracker from '../components/LiveMeeting/AgendaTracker';
import MeetingTimer from '../components/LiveMeeting/MeetingTimer';

// Import hooks
import { useLiveMeeting } from '../hooks/useLiveMeeting';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

/**
 * 🔴 Live Meeting Page
 * Real-time collaborative meeting interface
 */
const LiveMeeting = () => {
  const { id: meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  const {
    meeting,
    participants,
    loading,
    error,
    meetingStatus,
    currentAgendaItem,
    agendaProgress,
    fetchMeeting,
    joinMeeting,
    leaveMeeting,
    startMeeting,
    pauseMeeting,
    endMeeting,
    updateAgendaProgress,
  } = useLiveMeeting(meetingId);

  // UI State
  const [activeTab, setActiveTab] = useState('notes'); // notes, agenda, participants
  const [isJoined, setIsJoined] = useState(false);

  /**
   * Join meeting room
   */
  const handleJoinMeeting = useCallback(async () => {
    if (!socket || !user) {
      return;
    }

    try {
      const result = await joinMeeting(user);
      if (result.success) {
        setIsJoined(true);
      }
    } catch (error) {
      console.error('Failed to join meeting:', error);
    }
  }, [socket, user, joinMeeting]);

  /**
   * Leave meeting room
   */
  const handleLeaveMeeting = useCallback(async () => {
    if (!socket || !user || !isJoined) {
      return;
    }

    try {
      await leaveMeeting(user);
      setIsJoined(false);
    } catch (error) {
      console.error('Failed to leave meeting:', error);
    }
  }, [socket, user, isJoined, leaveMeeting]);

  /**
   * Initialize meeting on component mount
   */
  useEffect(() => {
    if (meetingId && user && socket && isConnected) {
      fetchMeeting();
      handleJoinMeeting();
    }

    return () => {
      if (isJoined) {
        handleLeaveMeeting();
      }
    };
  }, [
    meetingId,
    user,
    socket,
    isConnected,
    fetchMeeting,
    isJoined,
    handleJoinMeeting,
    handleLeaveMeeting,
  ]);

  /**
   * Exit to meetings list
   */
  const handleExitMeeting = () => {
    if (isJoined) {
      handleLeaveMeeting();
    }
    navigate('/meetings');
  };

  /**
   * Meeting status actions
   */
  const handleStartMeeting = () => {
    startMeeting(user);
  };

  const handlePauseMeeting = () => {
    pauseMeeting(user);
  };

  const handleEndMeeting = () => {
    endMeeting(user);
    // Auto-exit after ending
    setTimeout(() => {
      handleExitMeeting();
    }, 2000);
  };

  /**
   * Tab navigation
   */
  const tabs = [
    { id: 'notes', label: 'Notlar', icon: NotesIcon },
    { id: 'agenda', label: 'Gündem', icon: AgendaIcon },
    { id: 'participants', label: 'Katılımcılar', icon: PeopleIcon },
  ];

  if (loading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='60vh'
      >
        <CircularProgress size={40} />
        <Typography variant='h6' sx={{ ml: 2 }}>
          Toplantı yükleniyor...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant='outlined' onClick={handleExitMeeting}>
          Toplantılar Listesine Dön
        </Button>
      </Box>
    );
  }

  if (!meeting) {
    return (
      <Box p={3}>
        <Alert severity='warning'>Toplantı bulunamadı.</Alert>
        <Button variant='outlined' onClick={handleExitMeeting} sx={{ mt: 2 }}>
          Toplantılar Listesine Dön
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='flex-start'
          >
            <Box flex={1}>
              <Typography variant='h4' gutterBottom>
                <span role='img' aria-label='Canlı toplantı ikonu'>
                  🔴
                </span>{' '}
                {meeting.baslik}
              </Typography>
              <Typography variant='body1' color='text.secondary' sx={{ mb: 2 }}>
                {meeting.aciklama}
              </Typography>

              {/* Meeting Info */}
              <Box display='flex' flexWrap='wrap' gap={1} mb={2}>
                <Chip
                  label={`Durum: ${meetingStatus}`}
                  color={
                    meetingStatus === 'devam-ediyor'
                      ? 'success'
                      : meetingStatus === 'planlanıyor'
                        ? 'warning'
                        : meetingStatus === 'tamamlandı'
                          ? 'info'
                          : 'default'
                  }
                  variant='filled'
                />
                <Chip
                  label={`${participants.length} Katılımcı`}
                  icon={<PeopleIcon />}
                  variant='outlined'
                />
                <Chip label={meeting.lokasyon || 'Online'} variant='outlined' />
              </Box>
            </Box>

            {/* Meeting Controls */}
            <Box display='flex' flexDirection='column' gap={1}>
              {/* Timer */}
              <MeetingTimer
                meeting={meeting}
                meetingStatus={meetingStatus}
                sx={{ mb: 2 }}
              />

              {/* Action Buttons */}
              <Box display='flex' gap={1}>
                {meetingStatus === 'planlanıyor' && (
                  <Button
                    variant='contained'
                    color='success'
                    startIcon={<StartIcon />}
                    onClick={handleStartMeeting}
                    disabled={!isJoined}
                  >
                    Başlat
                  </Button>
                )}

                {meetingStatus === 'devam-ediyor' && (
                  <>
                    <Button
                      variant='contained'
                      color='warning'
                      startIcon={<PauseIcon />}
                      onClick={handlePauseMeeting}
                    >
                      Duraklat
                    </Button>
                    <Button
                      variant='contained'
                      color='error'
                      startIcon={<StopIcon />}
                      onClick={handleEndMeeting}
                    >
                      Bitir
                    </Button>
                  </>
                )}

                <Button
                  variant='outlined'
                  startIcon={<ExitIcon />}
                  onClick={handleExitMeeting}
                >
                  Çıkış
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Connection Status */}
          {!isConnected && (
            <Alert severity='warning' sx={{ mt: 2 }}>
              Bağlantı kesildi. Yeniden bağlanmaya çalışılıyor...
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Box display='flex' borderBottom={1} borderColor='divider'>
          {tabs.map(tab => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              startIcon={<tab.icon />}
              sx={{
                px: 3,
                py: 2,
                borderRadius: 0,
                borderBottom: activeTab === tab.id ? 2 : 0,
                borderColor: 'primary.main',
                bgcolor: activeTab === tab.id ? 'primary.50' : 'transparent',
              }}
            >
              {tab.label}
              {tab.id === 'participants' && (
                <Badge
                  badgeContent={participants.length}
                  color='primary'
                  sx={{ ml: 1 }}
                />
              )}
            </Button>
          ))}
        </Box>
      </Paper>

      {/* Tab Content */}
      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} lg={8}>
          {activeTab === 'notes' && (
            <CollaborativeNotes
              meetingId={meetingId}
              meeting={meeting}
              isJoined={isJoined}
              participants={participants}
            />
          )}

          {activeTab === 'agenda' && (
            <AgendaTracker
              meetingId={meetingId}
              meeting={meeting}
              currentItem={currentAgendaItem}
              progress={agendaProgress}
              onProgressUpdate={updateAgendaProgress}
              isJoined={isJoined}
            />
          )}

          {activeTab === 'participants' && (
            <LiveParticipants
              meetingId={meetingId}
              participants={participants}
              meeting={meeting}
              currentUser={user}
            />
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* Quick Participants (when not on participants tab) */}
          {activeTab !== 'participants' && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  <PeopleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Katılımcılar ({participants.length})
                </Typography>
                <Box>
                  {participants.slice(0, 5).map(participant => (
                    <Box
                      key={participant.userId}
                      display='flex'
                      alignItems='center'
                      mb={1}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          bgcolor: 'success.main',
                          borderRadius: '50%',
                          mr: 1,
                        }}
                      />
                      <Typography variant='body2'>
                        {participant.name}
                        {participant.isTyping && (
                          <Typography
                            component='span'
                            variant='caption'
                            color='primary'
                            sx={{ ml: 1 }}
                          >
                            yazıyor...
                          </Typography>
                        )}
                      </Typography>
                    </Box>
                  ))}
                  {participants.length > 5 && (
                    <Button
                      size='small'
                      onClick={() => setActiveTab('participants')}
                      sx={{ mt: 1 }}
                    >
                      +{participants.length - 5} diğer katılımcı
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Quick Agenda (when not on agenda tab) */}
          {activeTab !== 'agenda' && meeting.gundem?.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  <AgendaIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Gündem İlerlemesi
                </Typography>
                <Box>
                  <LinearProgress
                    variant='determinate'
                    value={agendaProgress}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant='body2' color='text.secondary'>
                    {Math.round(agendaProgress)}% tamamlandı
                  </Typography>
                  <Button
                    size='small'
                    onClick={() => setActiveTab('agenda')}
                    sx={{ mt: 1 }}
                  >
                    Detayları Görüntüle
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default LiveMeeting;
