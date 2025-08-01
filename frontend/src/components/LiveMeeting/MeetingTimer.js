import React, { useState, useEffect, memo } from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import {
  Timer as TimerIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { format, differenceInSeconds } from 'date-fns';
import { tr } from 'date-fns/locale';

/**
 * ⏱️ Meeting Timer Component
 * Real-time meeting duration tracker
 */
const MeetingTimer = memo(
  ({ meeting, meetingStatus = 'planlanıyor', sx = {} }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Extract complex expression for dependency array
    const meetingStartTime = meeting?.gercekBaslangicSaati;

    /**
     * Calculate elapsed time
     */
    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentTime(new Date());

        if (meetingStatus === 'devam-ediyor' && meetingStartTime) {
          const startTime = new Date(meetingStartTime);
          const elapsed = differenceInSeconds(new Date(), startTime);
          setElapsedSeconds(Math.max(0, elapsed));
        }
      }, 1000);

      return () => clearInterval(interval);
    }, [meetingStatus, meetingStartTime]);

    /**
     * Format duration
     */
    const formatDuration = totalSeconds => {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (hours > 0) {
        const h = hours.toString().padStart(2, '0');
        const m = minutes.toString().padStart(2, '0');
        const s = seconds.toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
      }
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    /**
     * Get timer color based on status
     */
    const getTimerColor = () => {
      switch (meetingStatus) {
        case 'devam-ediyor':
          return 'success';
        case 'bekliyor':
          return 'warning';
        case 'tamamlandı':
          return 'info';
        default:
          return 'default';
      }
    };

    /**
     * Get status icon
     */
    const getStatusIcon = () => {
      switch (meetingStatus) {
        case 'devam-ediyor':
          return PlayIcon;
        case 'bekliyor':
          return PauseIcon;
        case 'tamamlandı':
          return StopIcon;
        default:
          return ScheduleIcon;
      }
    };

    const StatusIcon = getStatusIcon();
    const timerColor = getTimerColor();

    // Planned meeting info
    const plannedDate = meeting?.tarih ? new Date(meeting.tarih) : null;
    const plannedStartTime = meeting?.baslangicSaati || '';
    const plannedEndTime = meeting?.bitisSaati || '';

    return (
      <Card sx={{ minWidth: 200, ...sx }}>
        <CardContent>
          {/* Status */}
          <Box
            display='flex'
            alignItems='center'
            justifyContent='center'
            mb={2}
          >
            <Chip
              icon={<StatusIcon />}
              label={
                meetingStatus === 'devam-ediyor'
                  ? 'Devam Ediyor'
                  : meetingStatus === 'bekliyor'
                    ? 'Duraklatıldı'
                    : meetingStatus === 'tamamlandı'
                      ? 'Tamamlandı'
                      : 'Başlamadı'
              }
              color={timerColor}
              variant='filled'
            />
          </Box>

          {/* Current Time */}
          <Box textAlign='center' mb={2}>
            <Typography variant='h6' color='text.secondary'>
              {format(currentTime, 'HH:mm:ss', { locale: tr })}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              Şu anki saat
            </Typography>
          </Box>

          {/* Elapsed Time */}
          {meetingStatus === 'devam-ediyor' && (
            <Box textAlign='center' mb={2}>
              <Typography
                variant='h5'
                color={`${timerColor}.main`}
                fontWeight='bold'
              >
                <TimerIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                {formatDuration(elapsedSeconds)}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                Geçen süre
              </Typography>
            </Box>
          )}

          {/* Total Duration (for completed meetings) */}
          {meetingStatus === 'tamamlandı' && meeting?.toplamSure && (
            <Box textAlign='center' mb={2}>
              <Typography variant='h6' color='info.main'>
                <TimerIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                {Math.floor(meeting.toplamSure / 60)}:
                {(meeting.toplamSure % 60).toString().padStart(2, '0')}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                Toplam süre
              </Typography>
            </Box>
          )}

          {/* Planned Times */}
          <Box>
            <Typography
              variant='caption'
              color='text.secondary'
              display='block'
            >
              Planlanan Saat
            </Typography>
            <Typography variant='body2'>
              {plannedStartTime} - {plannedEndTime}
            </Typography>

            {plannedDate && (
              <Typography
                variant='caption'
                color='text.secondary'
                display='block'
                mt={1}
              >
                {format(plannedDate, 'dd MMMM yyyy', { locale: tr })}
              </Typography>
            )}
          </Box>

          {/* Start Time (for ongoing meetings) */}
          {meeting?.gercekBaslangicSaati && meetingStatus !== 'planlanıyor' && (
            <Box mt={2}>
              <Typography
                variant='caption'
                color='text.secondary'
                display='block'
              >
                Gerçek Başlangıç
              </Typography>
              <Typography variant='body2'>
                {format(new Date(meeting.gercekBaslangicSaati), 'HH:mm:ss', {
                  locale: tr,
                })}
              </Typography>
            </Box>
          )}

          {/* End Time (for completed meetings) */}
          {meeting?.gercekBitisSaati && meetingStatus === 'tamamlandı' && (
            <Box mt={1}>
              <Typography
                variant='caption'
                color='text.secondary'
                display='block'
              >
                Bitiş Saati
              </Typography>
              <Typography variant='body2'>
                {format(new Date(meeting.gercekBitisSaati), 'HH:mm:ss', {
                  locale: tr,
                })}
              </Typography>
            </Box>
          )}

          {/* Meeting Location */}
          {meeting?.lokasyon && (
            <Box mt={2}>
              <Typography
                variant='caption'
                color='text.secondary'
                display='block'
              >
                Lokasyon
              </Typography>
              <Typography variant='body2'>
                <span role='img' aria-label='Lokasyon pin ikonu'>
                  📍
                </span>{' '}
                {meeting.lokasyon}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  },
);

MeetingTimer.displayName = 'MeetingTimer';

export default MeetingTimer;
