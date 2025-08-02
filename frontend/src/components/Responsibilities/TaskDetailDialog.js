import React, { memo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Chip,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Comment as CommentIcon,
  Assignment as TaskIcon,
  CheckCircle as CompleteIcon,
  Schedule as ScheduleIcon,
  Work as InProgressIcon,
} from '@mui/icons-material';

import {
  TASK_STATUS,
  TASK_STATUS_CONFIG,
  PRIORITY_CONFIG,
  COMMENT_TYPES,
  COMMENT_TYPE_CONFIG,
} from '../../services/meetingTaskAPI';
import { formatDateToTurkish } from '../../utils/dateHelpers';
import EmojiWrapper from '../EmojiWrapper';

/**
 * TaskDetailDialog Component
 * Görev detay popup'ı - görüntüleme ve düzenleme
 */
const TaskDetailDialog = memo(({
  open,
  task,
  onClose,
  onProgressUpdate,
  onStatusUpdate: _onStatusUpdate,
  onAddComment,
  canEdit = false,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [progressValue, setProgressValue] = useState(task?.tamamlanmaYuzdesi || 0);
  const [statusValue, setStatusValue] = useState(task?.durum || 'atandi');
  const [noteText, setNoteText] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentType, setCommentType] = useState('yorum');
  const [loading, setLoading] = useState(false);

  if (!task) {
    return null;
  }

  // Config
  const statusConfig = TASK_STATUS_CONFIG[task.durum] || TASK_STATUS_CONFIG.atandi;
  const priorityConfig = PRIORITY_CONFIG[task.oncelik] || PRIORITY_CONFIG.normal;

  // Tab değişimi
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Edit mode toggle
  const handleEditToggle = () => {
    if (editMode) {
      // Cancel edit
      setProgressValue(task.tamamlanmaYuzdesi || 0);
      setStatusValue(task.durum || 'atandi');
      setNoteText('');
    }
    setEditMode(!editMode);
  };

  // Progress güncelleme
  const handleProgressSave = async () => {
    if (!canEdit) {
      return;
    }

    setLoading(true);
    try {
      await onProgressUpdate(task._id, progressValue, noteText);
      setEditMode(false);
      setNoteText('');
    } catch (error) {
      console.error('Progress update error:', error);
    } finally {
      setLoading(false);
    }
  };


  // Yorum ekleme
  const handleCommentAdd = async () => {
    if (!commentText.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onAddComment(task._id, commentText, commentType);
      setCommentText('');
      setCommentType('yorum');
    } catch (error) {
      console.error('Comment add error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Status seçenekleri
  const statusOptions = [
    { value: TASK_STATUS.ATANDI, label: 'Atandı' },
    { value: TASK_STATUS.DEVAM_EDIYOR, label: 'Devam Ediyor' },
    { value: TASK_STATUS.KISMEN_TAMAMLANDI, label: 'Kısmen Tamamlandı' },
    { value: TASK_STATUS.TAMAMLANDI, label: 'Tamamlandı' },
    { value: TASK_STATUS.ERTELENDI, label: 'Ertelendi' },
  ];

  const commentTypeOptions = [
    { value: COMMENT_TYPES.YORUM, label: 'Yorum' },
    { value: COMMENT_TYPES.ONERI, label: 'Öneri' },
    { value: COMMENT_TYPES.SORU, label: 'Soru' },
    { value: COMMENT_TYPES.UYARI, label: 'Uyarı' },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' },
      }}
    >
      {/* Header */}
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <TaskIcon color="primary" />
            <Typography variant="h6" component="div">
              Görev Detayları
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            {canEdit && (
              <Tooltip title={editMode ? 'Düzenlemeyi İptal Et' : 'Düzenle'}>
                <IconButton onClick={handleEditToggle}>
                  {editMode ? <CancelIcon /> : <EditIcon />}
                </IconButton>
              </Tooltip>
            )}

            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Task Header */}
        <Box mb={3}>
          <Typography variant="h5" gutterBottom>
            {task.baslik}
          </Typography>

          <Box display="flex" gap={1} mb={2} flexWrap="wrap">
            <Chip
              label={statusConfig.label}
              color={statusConfig.color}
              icon={React.createElement(
                statusConfig.icon === 'assignment' ? TaskIcon :
                  statusConfig.icon === 'work' ? InProgressIcon :
                    statusConfig.icon === 'check_circle' ? CompleteIcon :
                      ScheduleIcon,
              )}
            />

            <Chip
              label={priorityConfig.label}
              color={priorityConfig.color}
              variant="outlined"
            />

            {task.teslimTarihi && (
              <Chip
                label={`Teslim: ${formatDateToTurkish(task.teslimTarihi)}`}
                variant="outlined"
                color="info"
              />
            )}
          </Box>

          {task.aciklama && (
            <Typography variant="body1" color="text.secondary" paragraph>
              {task.aciklama}
            </Typography>
          )}
        </Box>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Genel Bilgiler" />
          <Tab label="İlerleme" />
          <Tab label="Çalışma Notları" />
          <Tab label="Yorumlar" />
        </Tabs>

        {/* Tab Content */}
        {activeTab === 0 && (
          <Grid container spacing={2}>
            {/* Meeting Info */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <EmojiWrapper emoji="📋" label="Toplantı" /> Toplantı Bilgileri
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Toplantı:</strong> {task.meeting?.baslik}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Tarih:</strong> {formatDateToTurkish(task.meeting?.tarih)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Task Info */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <EmojiWrapper emoji="📅" label="Görev" /> Görev Bilgileri
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Atanma:</strong> {formatDateToTurkish(task.atanmaTarihi)}
                  </Typography>
                  {task.teslimTarihi && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Teslim:</strong> {formatDateToTurkish(task.teslimTarihi)}
                    </Typography>
                  )}
                  {task.tamamlanmaTarihi && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Tamamlandı:</strong> {formatDateToTurkish(task.tamamlanmaTarihi)}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {activeTab === 1 && (
          <Box>
            {/* Progress Section */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <EmojiWrapper emoji="📊" label="İlerleme" /> İlerleme Durumu
                </Typography>

                {editMode && canEdit ? (
                  <Box>
                    <Typography gutterBottom>
                      Progress: %{progressValue}
                    </Typography>
                    <Slider
                      value={progressValue}
                      onChange={(e, value) => setProgressValue(value)}
                      min={0}
                      max={100}
                      marks={[
                        { value: 0, label: '0%' },
                        { value: 25, label: '25%' },
                        { value: 50, label: '50%' },
                        { value: 75, label: '75%' },
                        { value: 100, label: '100%' },
                      ]}
                      sx={{ mb: 2 }}
                    />

                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Durum</InputLabel>
                      <Select
                        value={statusValue}
                        label="Durum"
                        onChange={(e) => setStatusValue(e.target.value)}
                      >
                        {statusOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Güncelleme Notu"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Bu güncelleme hakkında not ekleyin..."
                      sx={{ mb: 2 }}
                    />

                    <Box display="flex" gap={1}>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleProgressSave}
                        disabled={loading}
                      >
                        Kaydet
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={handleEditToggle}
                        disabled={loading}
                      >
                        İptal
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="h4" color="primary" gutterBottom>
                      %{task.tamamlanmaYuzdesi || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Mevcut ilerleme durumu
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            {/* Work Notes */}
            <Typography variant="h6" gutterBottom>
              <EmojiWrapper emoji="📝" label="Çalışma Notları" /> Çalışma Notları
            </Typography>

            {task.calismaNotalari?.length > 0 ? (
              <List>
                {task.calismaNotalari.map((note, index) => (
                  <ListItem key={index} alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <EmojiWrapper emoji="📝" label="Not" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      component="div"
                      primary={note.icerik}
                      secondary={`${formatDateToTurkish(note.tarih)} - ${note.durum}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">
                Henüz çalışma notu eklenmemiş.
              </Alert>
            )}
          </Box>
        )}

        {activeTab === 3 && (
          <Box>
            {/* Comments Section */}
            <Typography variant="h6" gutterBottom>
              <EmojiWrapper emoji="💬" label="Yorumlar" /> Yorumlar
            </Typography>

            {/* Add Comment */}
            {canEdit && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth>
                        <InputLabel>Yorum Türü</InputLabel>
                        <Select
                          value={commentType}
                          label="Yorum Türü"
                          onChange={(e) => setCommentType(e.target.value)}
                        >
                          {commentTypeOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={9}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Yorum"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Yorumunuzu yazın..."
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        startIcon={<CommentIcon />}
                        onClick={handleCommentAdd}
                        disabled={!commentText.trim() || loading}
                      >
                        Yorum Ekle
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Comments List */}
            {task.yorumlar?.length > 0 ? (
              <List>
                {task.yorumlar.map((comment, index) => {
                  const commentTypeConfig = COMMENT_TYPE_CONFIG[comment.tip] || COMMENT_TYPE_CONFIG.yorum;

                  return [
                    <ListItem key={`comment-${index}`} alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: `${commentTypeConfig.color}.main` }}>
                          {comment.yazan?.ad?.charAt(0) || '?'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        component="div"
                        primary={
                          <span>
                            <Typography variant="subtitle2" component="span">
                              {comment.yazan?.ad} {comment.yazan?.soyad}
                            </Typography>
                            <Chip
                              label={commentTypeConfig.label}
                              size="small"
                              color={commentTypeConfig.color}
                              sx={{ ml: 1 }}
                            />
                          </span>
                        }
                        secondary={`${comment.yorum} - ${formatDateToTurkish(comment.tarih)}`}
                      />
                    </ListItem>,
                    index < task.yorumlar.length - 1 &&
                      <Divider key={`divider-${index}`} variant="inset" component="li" />,
                  ].filter(Boolean);
                })}
              </List>
            ) : (
              <Alert severity="info">
                Henüz yorum eklenmemiş.
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Kapat
        </Button>
      </DialogActions>
    </Dialog>
  );
});

TaskDetailDialog.displayName = 'TaskDetailDialog';

export default TaskDetailDialog;