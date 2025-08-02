import React, { memo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  Box,
  Avatar,
  AvatarGroup,
  LinearProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as StartIcon,
  Stop as FinishIcon,
  Visibility as ViewIcon,
  Groups as GroupsIcon,
  Schedule as ScheduleIcon,
  VideoCall as LiveIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import { tr } from 'date-fns/locale';

/**
 * 🎨 Meeting Status Configuration
 * MMM95 pattern: Configuration-driven approach
 */
const MEETING_STATUS_CONFIG = {
  planlanıyor: {
    color: 'info',
    label: 'Planlanıyor',
    icon: <ScheduleIcon />,
  },
  bekliyor: {
    color: 'warning',
    label: 'Bekliyor',
    icon: <ScheduleIcon />,
  },
  'devam-ediyor': {
    color: 'success',
    label: 'Devam Ediyor',
    icon: <StartIcon />,
  },
  tamamlandı: {
    color: 'default',
    label: 'Tamamlandı',
    icon: <FinishIcon />,
  },
  iptal: {
    color: 'error',
    label: 'İptal',
    icon: <DeleteIcon />,
  },
};

/**
 * 🎨 Meeting Category Configuration
 */
const MEETING_CATEGORY_CONFIG = {
  rutin: { color: 'default', label: 'Rutin' },
  proje: { color: 'primary', label: 'Proje' },
  acil: { color: 'error', label: 'Acil' },
  kalite: { color: 'info', label: 'Kalite' },
  güvenlik: { color: 'warning', label: 'Güvenlik' },
  performans: { color: 'success', label: 'Performans' },
  vardiya: { color: 'secondary', label: 'Vardiya' },
  'kalip-degisim': { color: 'info', label: 'Kalıp Değişim' },
};

/**
 * 🎨 Meeting Priority Configuration
 */
const MEETING_PRIORITY_CONFIG = {
  düşük: { color: 'default', label: 'Düşük' },
  normal: { color: 'info', label: 'Normal' },
  yüksek: { color: 'warning', label: 'Yüksek' },
  kritik: { color: 'error', label: 'Kritik' },
};

/**
 * 📅 Meeting Table Component
 * MMM95 pattern: Memo optimization for performance
 */
const MeetingTable = memo(
  ({
    meetings = [],
    loading = false,
    onEdit,
    onDelete,
    onView,
    onStart,
    onFinish,
    onLiveMeeting,
    onExportPDF,
    currentUser,
    hasEditPermission = false,
  }) => {
    /**
     * Check if user can control meeting (start/finish)
     */
    const canControlMeeting = meeting => {
      if (!currentUser || !meeting) {
        return false;
      }

      const isOrganizator = meeting.organizator?._id === currentUser.id;
      const isSunucu = meeting.katilimcilar?.some(
        k => k.kullanici._id === currentUser.id && k.rol === 'sunucu',
      );

      return isOrganizator || isSunucu;
    };

    /**
     * Check if user can edit/delete meeting
     */
    const canEditMeeting = meeting => {
      if (!currentUser || !meeting) {
        return false;
      }

      const isOrganizator = meeting.organizator?._id === currentUser.id;
      const isAdmin = currentUser.roller?.some(rol => rol.ad === 'Admin');

      return hasEditPermission && (isOrganizator || isAdmin);
    };

    /**
     * Format meeting time display
     */
    const formatMeetingTime = meeting => {
      try {
        const meetingDate = new Date(meeting.tarih);
        const today = new Date();

        // Check if it's today
        if (meetingDate.toDateString() === today.toDateString()) {
          return `Bugün ${meeting.baslangicSaati}`;
        }

        // Check if it's tomorrow
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (meetingDate.toDateString() === tomorrow.toDateString()) {
          return `Yarın ${meeting.baslangicSaati}`;
        }

        // Check if it's this week
        const daysDiff = Math.ceil(
          (meetingDate - today) / (1000 * 60 * 60 * 24),
        );
        if (daysDiff >= 0 && daysDiff <= 7) {
          return `${format(meetingDate, 'EEEE', { locale: tr })} ${meeting.baslangicSaati}`;
        }

        // Default format
        return `${format(meetingDate, 'dd.MM.yyyy')} ${meeting.baslangicSaati}`;
      } catch (error) {
        console.error('Date formatting error:', error);
        return meeting.baslangicSaati || 'Bilinmiyor';
      }
    };

    /**
     * Get relative time for meeting
     */
    const getRelativeTime = meeting => {
      try {
        const meetingDate = new Date(meeting.tarih);
        return formatDistanceToNow(meetingDate, {
          addSuffix: true,
          locale: tr,
        });
      } catch (error) {
        return '';
      }
    };

    /**
     * Render participant avatars
     */
    const renderParticipants = (participants = []) => {
      if (participants.length === 0) {
        return (
          <Tooltip title='Katılımcı yok'>
            <Chip
              icon={<GroupsIcon />}
              label='0'
              size='small'
              variant='outlined'
            />
          </Tooltip>
        );
      }

      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AvatarGroup
            max={3}
            sx={{
              '& .MuiAvatar-root': {
                width: 24,
                height: 24,
                fontSize: '0.75rem',
              },
            }}
          >
            {participants.slice(0, 3).map((participant, index) => (
              <Tooltip
                key={participant.kullanici._id || index}
                title={`${participant.kullanici.ad} ${participant.kullanici.soyad} (${participant.rol})`}
              >
                <Avatar>
                  {participant.kullanici.ad?.[0]}
                  {participant.kullanici.soyad?.[0]}
                </Avatar>
              </Tooltip>
            ))}
          </AvatarGroup>
          {participants.length > 3 && (
            <Typography variant='caption' color='textSecondary'>
              +{participants.length - 3} daha
            </Typography>
          )}
        </Box>
      );
    };

    /**
     * Render action buttons
     */
    const renderActions = meeting => {
      const canControl = canControlMeeting(meeting);
      const canEdit = canEditMeeting(meeting);

      return (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {/* View button - always available */}
          <Tooltip title='Detayları Görüntüle'>
            <IconButton
              size='small'
              onClick={() => onView?.(meeting)}
              color='info'
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>

          {/* Start/Finish buttons */}
          {canControl && (meeting.durum === 'bekliyor' || meeting.durum === 'planlanıyor') && (
            <Tooltip title='Toplantıyı Başlat'>
              <IconButton
                size='small'
                onClick={() => onStart?.(meeting._id)}
                color='success'
              >
                <StartIcon />
              </IconButton>
            </Tooltip>
          )}

          {/* Live Meeting button */}
          {(meeting.durum === 'devam-ediyor' || meeting.durum === 'planlanıyor') && (
            <Tooltip title={meeting.durum === 'devam-ediyor' ? 'Canlı Toplantıya Katıl' : 'Toplantı Odasına Gir'}>
              <IconButton
                size='small'
                onClick={() => onLiveMeeting?.(meeting._id)}
                color='success'
                sx={{
                  ...(meeting.durum === 'devam-ediyor' && {
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.7 },
                      '100%': { opacity: 1 },
                    },
                  }),
                }}
              >
                <LiveIcon />
              </IconButton>
            </Tooltip>
          )}

          {canControl && meeting.durum === 'devam-ediyor' && (
            <Tooltip title='Toplantıyı Bitir'>
              <IconButton
                size='small'
                onClick={() => onFinish?.(meeting._id)}
                color='warning'
              >
                <FinishIcon />
              </IconButton>
            </Tooltip>
          )}

          {/* Edit button */}
          {canEdit && meeting.durum !== 'tamamlandı' && (
            <Tooltip title='Düzenle'>
              <IconButton
                size='small'
                onClick={() => onEdit?.(meeting)}
                color='primary'
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}

          {/* Delete button */}
          {canEdit && (
            <Tooltip title='Sil'>
              <IconButton
                size='small'
                onClick={() => onDelete?.(meeting._id)}
                color='error'
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}

          {/* PDF Export button - Available for completed meetings */}
          {meeting.durum === 'tamamlandı' && (
            <Tooltip title='Toplantı Raporunu PDF olarak İndir'>
              <IconButton
                size='small'
                onClick={() => onExportPDF?.(meeting._id)}
                color='success'
              >
                <PdfIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      );
    };

    if (loading) {
      return (
        <Paper>
          <LinearProgress />
          <Box p={2}>
            <Typography>Toplantılar yükleniyor...</Typography>
          </Box>
        </Paper>
      );
    }

    if (!meetings || meetings.length === 0) {
      return (
        <Paper>
          <Box p={4} textAlign='center'>
            <GroupsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant='h6' color='textSecondary'>
              Henüz toplantı bulunmuyor
            </Typography>
            <Typography variant='body2' color='textSecondary'>
              İlk toplantıyı oluşturmak için "Yeni Toplantı" butonunu kullanın
            </Typography>
          </Box>
        </Paper>
      );
    }

    return (
      <TableContainer component={Paper}>
        <Table size='medium'>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Toplantı</strong>
              </TableCell>
              <TableCell>
                <strong>Tarih & Saat</strong>
              </TableCell>
              <TableCell>
                <strong>Durum</strong>
              </TableCell>
              <TableCell>
                <strong>Kategori</strong>
              </TableCell>
              <TableCell>
                <strong>Organizatör</strong>
              </TableCell>
              <TableCell>
                <strong>Katılımcılar</strong>
              </TableCell>
              <TableCell align='center'>
                <strong>İşlemler</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {meetings.map(meeting => {
              const statusConfig =
                MEETING_STATUS_CONFIG[meeting.durum] ||
                MEETING_STATUS_CONFIG['planlanıyor'];
              const categoryConfig =
                MEETING_CATEGORY_CONFIG[meeting.kategori] ||
                MEETING_CATEGORY_CONFIG.rutin;
              const priorityConfig =
                MEETING_PRIORITY_CONFIG[meeting.oncelik] ||
                MEETING_PRIORITY_CONFIG.normal;

              return (
                <TableRow
                  key={meeting._id}
                  hover
                  sx={{
                    '&:hover': { backgroundColor: 'action.hover' },
                    ...(meeting.durum === 'devam-ediyor' && {
                      backgroundColor: 'success.light',
                      '&:hover': { backgroundColor: 'success.main' },
                    }),
                  }}
                >
                  {/* Meeting Title & Description */}
                  <TableCell>
                    <Box>
                      <Typography variant='subtitle2' fontWeight='medium'>
                        {meeting.baslik}
                      </Typography>
                      {meeting.aciklama && (
                        <Typography
                          variant='caption'
                          color='textSecondary'
                          display='block'
                        >
                          {meeting.aciklama.length > 50
                            ? `${meeting.aciklama.substring(0, 50)}...`
                            : meeting.aciklama}
                        </Typography>
                      )}
                      {meeting.lokasyon && (
                        <Typography
                          variant='caption'
                          color='primary'
                          display='block'
                        >
                          <span role='img' aria-label='Lokasyon pin'>
                            📍
                          </span>{' '}
                          {meeting.lokasyon}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>

                  {/* Date & Time */}
                  <TableCell>
                    <Box>
                      <Typography variant='body2' fontWeight='medium'>
                        {formatMeetingTime(meeting)}
                      </Typography>
                      <Typography variant='caption' color='textSecondary'>
                        {getRelativeTime(meeting)}
                      </Typography>
                      {meeting.bitisSaati && (
                        <Typography
                          variant='caption'
                          color='textSecondary'
                          display='block'
                        >
                          Bitiş: {meeting.bitisSaati}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Chip
                      icon={statusConfig.icon}
                      label={statusConfig.label}
                      color={statusConfig.color}
                      size='small'
                      variant={
                        meeting.durum === 'devam-ediyor' ? 'filled' : 'outlined'
                      }
                    />
                    {meeting.oncelik !== 'normal' && (
                      <Chip
                        label={priorityConfig.label}
                        color={priorityConfig.color}
                        size='small'
                        variant='outlined'
                        sx={{ ml: 0.5 }}
                      />
                    )}
                  </TableCell>

                  {/* Category */}
                  <TableCell>
                    <Chip
                      label={categoryConfig.label}
                      color={categoryConfig.color}
                      size='small'
                      variant='outlined'
                    />
                  </TableCell>

                  {/* Organizer */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                      >
                        {meeting.organizator?.ad?.[0]}
                        {meeting.organizator?.soyad?.[0]}
                      </Avatar>
                      <Typography variant='body2'>
                        {meeting.organizator?.ad} {meeting.organizator?.soyad}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Participants */}
                  <TableCell>
                    {renderParticipants(meeting.katilimcilar)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell align='center'>{renderActions(meeting)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  },
);

MeetingTable.displayName = 'MeetingTable';

export default MeetingTable;
