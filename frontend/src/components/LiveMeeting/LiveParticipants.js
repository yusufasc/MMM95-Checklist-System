import React, { memo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Box,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Circle as OnlineIcon,
  Edit as TypingIcon,
  AdminPanelSettings as AdminIcon,
  Star as OrganizerIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import EmojiWrapper from '../EmojiWrapper';

/**
 * 👥 Live Participants Component
 * Real-time participant list with presence indicators
 */
const LiveParticipants = memo(
  ({ _meetingId, participants = [], meeting, currentUser }) => {
    /**
     * Get participant role in meeting
     */
    const getParticipantRole = userId => {
      if (
        meeting?.organizator === userId ||
        meeting?.organizator?._id === userId
      ) {
        return 'organizator';
      }

      const participant = meeting?.katilimcilar?.find(
        k => k.kullanici === userId || k.kullanici?._id === userId,
      );

      return participant?.rol || 'katılımcı';
    };

    /**
     * Get role display info
     */
    const getRoleInfo = role => {
      switch (role) {
        case 'organizator':
          return {
            label: 'Organizatör',
            color: 'primary',
            icon: OrganizerIcon,
          };
        case 'sunucu':
          return { label: 'Sunucu', color: 'secondary', icon: AdminIcon };
        case 'karar-verici':
          return { label: 'Karar Verici', color: 'warning', icon: AdminIcon };
        case 'gözlemci':
          return { label: 'Gözlemci', color: 'info', icon: PersonIcon };
        default:
          return { label: 'Katılımcı', color: 'default', icon: PersonIcon };
      }
    };

    /**
     * Get participant avatar color
     */
    const getAvatarColor = name => {
      const colors = [
        '#1976d2',
        '#388e3c',
        '#f57c00',
        '#d32f2f',
        '#7b1fa2',
        '#303f9f',
        '#0288d1',
        '#00796b',
      ];
      const index = name?.charCodeAt(0) % colors.length || 0;
      return colors[index];
    };

    return (
      <Card>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            <EmojiWrapper emoji='👥' label='grup' /> Canlı Katılımcılar (
            {participants.length})
          </Typography>

          {participants.length === 0 ? (
            <Box textAlign='center' py={4}>
              <Typography variant='body2' color='text.secondary'>
                Henüz katılımcı yok
              </Typography>
            </Box>
          ) : (
            <List>
              {participants.map((participant, index) => {
                const role = getParticipantRole(participant.userId);
                const roleInfo = getRoleInfo(role);
                const isCurrentUser = currentUser?.id === participant.userId;

                return (
                  <React.Fragment key={participant.userId}>
                    <ListItem alignItems='flex-start'>
                      <ListItemAvatar>
                        <Box position='relative'>
                          <Avatar
                            sx={{
                              bgcolor: getAvatarColor(participant.name),
                              width: 40,
                              height: 40,
                            }}
                          >
                            {participant.name?.charAt(0)?.toUpperCase()}
                          </Avatar>

                          {/* Online indicator */}
                          <Tooltip title='Çevrimiçi' placement='top'>
                            <OnlineIcon
                              sx={{
                                position: 'absolute',
                                bottom: -2,
                                right: -2,
                                fontSize: 16,
                                color: 'success.main',
                                bgcolor: 'background.paper',
                                borderRadius: '50%',
                              }}
                            />
                          </Tooltip>
                        </Box>
                      </ListItemAvatar>

                      <ListItemText
                        primary={
                          <Box display='flex' alignItems='center' gap={1}>
                            <Typography variant='subtitle1'>
                              {participant.name}
                              {isCurrentUser && (
                                <Typography
                                  component='span'
                                  variant='caption'
                                  color='primary'
                                  sx={{ ml: 1 }}
                                >
                                  (Siz)
                                </Typography>
                              )}
                            </Typography>

                            {/* Typing indicator */}
                            {participant.isTyping && (
                              <Tooltip title='Yazıyor' placement='top'>
                                <TypingIcon
                                  sx={{
                                    fontSize: 16,
                                    color: 'primary.main',
                                    animation: 'pulse 1.5s infinite',
                                  }}
                                />
                              </Tooltip>
                            )}
                          </Box>
                        }
                        secondary={
                          <Box mt={1}>
                            {/* Role chip */}
                            <Chip
                              label={roleInfo.label}
                              color={roleInfo.color}
                              size='small'
                              icon={<roleInfo.icon sx={{ fontSize: 14 }} />}
                              sx={{ mr: 1, mb: 1 }}
                            />

                            {/* Join time */}
                            <Typography
                              variant='caption'
                              display='block'
                              color='text.secondary'
                            >
                              Katıldı:{' '}
                              {format(new Date(participant.joinedAt), 'HH:mm', {
                                locale: tr,
                              })}
                            </Typography>

                            {/* Typing status */}
                            {participant.isTyping && (
                              <Typography variant='caption' color='primary'>
                                yazıyor...
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>

                    {index < participants.length - 1 && (
                      <Divider variant='inset' component='li' />
                    )}
                  </React.Fragment>
                );
              })}
            </List>
          )}

          {/* Meeting Info */}
          <Divider sx={{ my: 2 }} />
          <Box>
            <Typography variant='subtitle2' gutterBottom>
              Toplantı Bilgileri
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              <EmojiWrapper emoji='📅' label='takvim' />{' '}
              {format(new Date(meeting?.tarih), 'dd MMMM yyyy, HH:mm', {
                locale: tr,
              })}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              <EmojiWrapper emoji='📍' label='konum' />{' '}
              {meeting?.lokasyon || 'Online'}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              <EmojiWrapper emoji='👤' label='kişi' /> Organizatör:{' '}
              {meeting?.organizator?.isim || 'Bilinmiyor'}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  },
);

LiveParticipants.displayName = 'LiveParticipants';

export default LiveParticipants;
