import React, { useState, memo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Schedule as ScheduleIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Timer as TimerIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

import AgendaDialog from '../Meetings/AgendaDialog';
import { meetingsAPI } from '../../services/api';

/**
 * 📋 Agenda Tracker Component
 * Real-time agenda progress tracking
 */
const AgendaTracker = memo(
  ({
    meetingId,
    meeting,
    currentItem = 0,
    progress = 0,
    onProgressUpdate,
    isJoined = false,
  }) => {
    const [noteDialog, setNoteDialog] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [itemNote, setItemNote] = useState('');
    const [agendaDialogOpen, setAgendaDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const agenda = meeting?.gundem || [];

    /**
     * Get status info
     */
    const getStatusInfo = status => {
      switch (status) {
        case 'tamamlandı':
          return {
            label: 'Tamamlandı',
            color: 'success',
            icon: CheckIcon,
            variant: 'filled',
          };
        case 'tartışıldı':
          return {
            label: 'Tartışıldı',
            color: 'info',
            icon: ScheduleIcon,
            variant: 'filled',
          };
        case 'devam-ediyor':
          return {
            label: 'Devam Ediyor',
            color: 'warning',
            icon: StartIcon,
            variant: 'filled',
          };
        case 'ertelendi':
          return {
            label: 'Ertelendi',
            color: 'error',
            icon: PauseIcon,
            variant: 'outlined',
          };
        default:
          return {
            label: 'Bekliyor',
            color: 'default',
            icon: UncheckedIcon,
            variant: 'outlined',
          };
      }
    };

    /**
     * Update agenda item status
     */
    const updateItemStatus = (itemIndex, newStatus) => {
      if (!isJoined || !onProgressUpdate) {
        return;
      }
      onProgressUpdate(itemIndex, newStatus);
    };

    /**
     * Open note dialog
     */
    const openNoteDialog = (item, index) => {
      setSelectedItem({ ...item, index });
      setItemNote(item.notlar || '');
      setNoteDialog(true);
    };

    /**
     * Save item note
     */
    const saveItemNote = () => {
      // TODO: Implement note saving for agenda items
      setNoteDialog(false);
      setSelectedItem(null);
      setItemNote('');
    };

    /**
     * Handle agenda save from dialog
     */
    const handleAgendaSave = async (agendaItems) => {
      if (!meetingId) {
        return;
      }

      setLoading(true);
      try {
        await meetingsAPI.update(meetingId, { gundem: agendaItems });
        // Note: The meeting data should be refreshed from parent component
        // onProgressUpdate could be used to trigger a refresh
        if (onProgressUpdate) {
          onProgressUpdate(); // Trigger parent to refresh meeting data
        }
        console.log('✅ Agenda updated successfully');
      } catch (error) {
        console.error('❌ Failed to update agenda:', error);
        alert('Gündem güncellenirken hata oluştu: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    /**
     * Calculate total estimated time
     */
    const totalEstimatedTime = agenda.reduce(
      (total, item) => total + (item.sure || 0),
      0,
    );
    const completedTime = agenda
      .filter(item => item.durum === 'tamamlandı')
      .reduce((total, item) => total + (item.sure || 0), 0);

    if (agenda.length === 0) {
      return (
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              <span role='img' aria-label='Gündem listesi'>
                📋
              </span>{' '}
              Toplantı Gündemi
            </Typography>
            <Alert severity='info'>
              Bu toplantı için gündem maddesi bulunmuyor.
            </Alert>
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        <Card>
          <CardContent>
            <Box
              display='flex'
              justifyContent='space-between'
              alignItems='center'
              mb={3}
            >
              <Typography variant='h6'>
                <span role='img' aria-label='Gündem listesi'>
                  📋
                </span>{' '}
                Toplantı Gündemi ({agenda.length} madde)
              </Typography>

              <Box display='flex' alignItems='center' gap={2}>
                {/* Edit Agenda Button */}
                {isJoined && (
                  <Tooltip title="Gündem Düzenle">
                    <IconButton
                      onClick={() => setAgendaDialogOpen(true)}
                      color="primary"
                      disabled={loading}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                )}

                <Box textAlign='right'>
                  <Typography variant='body2' color='text.secondary'>
                    <TimerIcon sx={{ fontSize: 14, mr: 0.5 }} />
                    {completedTime} / {totalEstimatedTime} dk
                  </Typography>
                  <LinearProgress
                    variant='determinate'
                    value={progress}
                    sx={{ width: 120, mt: 0.5 }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Overall Progress */}
            <Box mb={3}>
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
                mb={1}
              >
                <Typography variant='subtitle2'>Genel İlerleme</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {Math.round(progress)}% tamamlandı
                </Typography>
              </Box>
              <LinearProgress
                variant='determinate'
                value={progress}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            {/* Agenda Items */}
            <List>
              {agenda.map((item, index) => {
                const statusInfo = getStatusInfo(item.durum);
                const StatusIcon = statusInfo.icon;
                const isActive = currentItem === index;

                return (
                  <ListItem
                    key={index}
                    sx={{
                      border: 1,
                      borderColor: isActive ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      mb: 2,
                      bgcolor: isActive ? 'primary.50' : 'background.paper',
                    }}
                  >
                    <ListItemIcon>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: isActive ? 'primary.main' : 'grey.300',
                          color: isActive ? 'white' : 'text.secondary',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: 'bold',
                        }}
                      >
                        {index + 1}
                      </Box>
                    </ListItemIcon>

                    <ListItemText
                      disableTypography
                      primary={
                        <Box display='flex' alignItems='center' gap={1} mb={1}>
                          <Typography variant='subtitle1' sx={{ flex: 1 }}>
                            {item.baslik}
                          </Typography>
                          <Chip
                            label={statusInfo.label}
                            color={statusInfo.color}
                            variant={statusInfo.variant}
                            size='small'
                            icon={<StatusIcon sx={{ fontSize: 14 }} />}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          {item.aciklama && (
                            <Typography
                              variant='body2'
                              color='text.secondary'
                              paragraph
                            >
                              {item.aciklama}
                            </Typography>
                          )}

                          <Box
                            display='flex'
                            alignItems='center'
                            gap={2}
                            flexWrap='wrap'
                          >
                            <Box display='flex' alignItems='center' gap={0.5}>
                              <TimerIcon sx={{ fontSize: 14 }} />
                              <Typography variant='caption'>
                                {item.sure || 0} dakika
                              </Typography>
                            </Box>

                            {item.sorumlu && (
                              <Box display='flex' alignItems='center' gap={0.5}>
                                <PersonIcon sx={{ fontSize: 14 }} />
                                <Typography variant='caption'>
                                  {Array.isArray(item.sorumlu)
                                    ? item.sorumlu.map(s =>
                                      typeof s === 'string' ? s :
                                        s.isim || `${s.ad || ''} ${s.soyad || ''}`.trim() || 'İsimsiz',
                                    ).join(', ')
                                    : typeof item.sorumlu === 'string'
                                      ? item.sorumlu
                                      : item.sorumlu.isim ||
                                        `${item.sorumlu.ad || ''} ${item.sorumlu.soyad || ''}`.trim() ||
                                        'İsimsiz'
                                  }
                                </Typography>
                              </Box>
                            )}

                            {/* Action Buttons */}
                            {isJoined && (
                              <Box display='flex' gap={1} ml='auto'>
                                {item.durum !== 'tamamlandı' && (
                                  <Button
                                    size='small'
                                    variant='outlined'
                                    color='success'
                                    onClick={() =>
                                      updateItemStatus(index, 'tamamlandı')
                                    }
                                  >
                                    Tamamla
                                  </Button>
                                )}

                                {item.durum === 'bekliyor' && (
                                  <Button
                                    size='small'
                                    variant='outlined'
                                    color='warning'
                                    onClick={() =>
                                      updateItemStatus(index, 'devam-ediyor')
                                    }
                                  >
                                    Başlat
                                  </Button>
                                )}

                                {item.durum !== 'ertelendi' &&
                                  item.durum !== 'tamamlandı' && (
                                  <Button
                                    size='small'
                                    variant='outlined'
                                    color='error'
                                    onClick={() =>
                                      updateItemStatus(index, 'ertelendi')
                                    }
                                  >
                                    Ertele
                                  </Button>
                                )}

                                <Tooltip title='Not Ekle'>
                                  <IconButton
                                    size='small'
                                    onClick={() => openNoteDialog(item, index)}
                                  >
                                    <AssignmentIcon fontSize='small' />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>

            {!isJoined && (
              <Alert severity='info' sx={{ mt: 2 }}>
                Gündem maddelerini güncellemek için toplantıya katılmanız
                gerekiyor.
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Note Dialog */}
        <Dialog
          open={noteDialog}
          onClose={() => setNoteDialog(false)}
          maxWidth='sm'
          fullWidth
        >
          <DialogTitle>Gündem Maddesi Notu</DialogTitle>
          <DialogContent>
            <Typography variant='subtitle1' gutterBottom>
              {selectedItem?.baslik}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={itemNote}
              onChange={e => setItemNote(e.target.value)}
              placeholder='Bu gündem maddesi için notlarınızı ekleyin...'
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNoteDialog(false)}>İptal</Button>
            <Button
              variant='contained'
              onClick={saveItemNote}
              disabled={!itemNote.trim()}
            >
              Kaydet
            </Button>
          </DialogActions>
        </Dialog>

        {/* Agenda Dialog */}
        <AgendaDialog
          open={agendaDialogOpen}
          onClose={() => setAgendaDialogOpen(false)}
          onSave={handleAgendaSave}
          participants={meeting?.katilimcilar?.map(k => ({
            _id: k.kullanici?._id || k._id,
            isim: k.kullanici?.isim || k.isim ||
              `${k.kullanici?.ad || k.ad || ''} ${k.kullanici?.soyad || k.soyad || ''}`.trim() || 'İsimsiz',
            email: k.kullanici?.email || k.email || '',
            rol: k.rol || 'katılımcı',
          })) || []}
          agenda={agenda}
          title="Canlı Toplantı Gündem Düzenle"
        />
      </>
    );
  },
);

AgendaTracker.displayName = 'AgendaTracker';

export default AgendaTracker;
