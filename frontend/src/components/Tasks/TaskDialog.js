import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Stack,
  Checkbox,
  FormControlLabel,
  TextField,
  LinearProgress,
  IconButton,
  CircularProgress,
  Chip,
  Alert,
  AlertTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CardMedia,
} from '@mui/material';
import {
  Cancel as CancelIcon,
  Save as SaveIcon,
  Image as ImageIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  ZoomIn as ZoomInIcon,
} from '@mui/icons-material';

const TaskDialog = ({
  open,
  onClose,
  selectedTask,
  taskData,
  completing,
  // starting, // Unused parameter
  selectedMachines,
  fileInputRefs,
  isMobile,
  onMaddeChange,
  onImageUpload,
  onImageDelete,
  onImagePreview,
  // onTaskStart, // Unused parameter
  onTaskComplete,
  imageDialog,
  imagePreview,
  onImageDialogClose,
  getCompletionPercentage,
  getTotalScore,
  getMaxScore,
  getCompletedItemsWithImages,
  setTaskData,
}) => {
  if (!selectedTask) {
    return null;
  }

  return (
    <>
      {/* Görev Tamamlama Dialog */}
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth='lg'
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            height: isMobile ? '100vh' : 'auto',
            maxHeight: '100vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            py: { xs: 1, md: 3 },
            px: { xs: 1.5, md: 3 },
            flexDirection: 'column',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              mb: { xs: 0.5, md: 0 },
            }}
          >
            <ImageIcon sx={{ mr: 1, fontSize: { xs: 20, md: 32 } }} />
            <Box sx={{ flex: 1 }}>
              <Box
                component='span'
                sx={{
                  fontSize: isMobile ? '1rem' : '1.5rem',
                  fontWeight: 'bold',
                  display: 'block',
                }}
              >
                {selectedTask?.checklist?.ad}
              </Box>
              {/* Makina Bilgisi */}
              {(() => {
                if (selectedTask?.makina) {
                  return (
                    <Typography
                      variant='caption'
                      sx={{
                        opacity: 0.9,
                        fontSize: { xs: '0.7rem', md: '0.875rem' },
                      }}
                    >
                      <span role='img' aria-label='konum'>
                        📍
                      </span>{' '}
                      {selectedTask.makina.makinaNo} - {selectedTask.makina.ad}
                    </Typography>
                  );
                }

                if (selectedMachines.length > 0) {
                  const selectedMachine = selectedMachines[0];
                  return (
                    <Typography
                      variant='caption'
                      sx={{
                        opacity: 0.9,
                        fontSize: { xs: '0.7rem', md: '0.875rem' },
                        bgcolor: 'rgba(255,255,255,0.2)',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        display: 'inline-block',
                      }}
                    >
                      <span role='img' aria-label='seçili-makina'>
                        🎯
                      </span>{' '}
                      Seçili Makina: {selectedMachine.makinaNo} -{' '}
                      {selectedMachine.ad}
                    </Typography>
                  );
                }

                return (
                  <Typography
                    variant='caption'
                    sx={{
                      opacity: 0.9,
                      fontSize: { xs: '0.7rem', md: '0.875rem' },
                      bgcolor: 'rgba(255,193,7,0.3)',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      display: 'inline-block',
                    }}
                  >
                    <span role='img' aria-label='uyarı'>
                      ⚠️
                    </span>{' '}
                    Makina seçimi yapılmalı
                  </Typography>
                );
              })()}
            </Box>
          </Box>
          {selectedTask?.durum === 'bekliyor' && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-around',
                width: '100%',
                mt: { xs: 0.5, md: 0 },
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant='caption'
                  sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}
                >
                  İlerleme
                </Typography>
                <Typography
                  variant={isMobile ? 'caption' : 'h6'}
                  fontWeight='bold'
                  sx={{ fontSize: { xs: '0.875rem', md: '1.25rem' } }}
                >
                  %{getCompletionPercentage()}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant='caption'
                  sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}
                >
                  Puan
                </Typography>
                <Typography
                  variant={isMobile ? 'caption' : 'h6'}
                  fontWeight='bold'
                  sx={{ fontSize: { xs: '0.875rem', md: '1.25rem' } }}
                >
                  {getTotalScore()} / {getMaxScore()}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant='caption'
                  sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}
                >
                  Fotoğraf
                </Typography>
                <Typography
                  variant={isMobile ? 'caption' : 'h6'}
                  fontWeight='bold'
                  sx={{ fontSize: { xs: '0.875rem', md: '1.25rem' } }}
                >
                  <span role='img' aria-label='fotoğraf'>
                    📸
                  </span>{' '}
                  {getCompletedItemsWithImages()}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogTitle>

        <DialogContent
          sx={{
            p: 0,
            overflowY: 'auto',
            height: isMobile ? 'calc(100vh - 120px)' : 'auto',
          }}
        >
          <Box>
            {/* Makina Bilgi Kartı */}
            {selectedTask.durum === 'bekliyor' && (
              <Box
                sx={{
                  p: { xs: 1.5, md: 3 },
                  bgcolor: 'info.light',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {(() => {
                  if (selectedTask.makina) {
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ImageIcon sx={{ mr: 1, color: 'info.main' }} />
                        <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                          <span role='img' aria-label='görev-makina'>
                            🏭
                          </span>{' '}
                          Görev Makinası: {selectedTask.makina.makinaNo} -{' '}
                          {selectedTask.makina.ad}
                        </Typography>
                      </Box>
                    );
                  }

                  if (selectedMachines.length > 0) {
                    const selectedMachine = selectedMachines[0];
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ImageIcon sx={{ mr: 1, color: 'success.main' }} />
                        <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                          <span role='img' aria-label='seçili-makina'>
                            🎯
                          </span>{' '}
                          Seçili Makina: {selectedMachine.makinaNo} -{' '}
                          {selectedMachine.ad}
                        </Typography>
                        <Chip
                          label='Otomatik Atandı'
                          size='small'
                          color='success'
                          sx={{ ml: 1, fontSize: '0.7rem' }}
                        />
                      </Box>
                    );
                  }

                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ImageIcon sx={{ mr: 1, color: 'warning.main' }} />
                      <Typography
                        variant='body2'
                        sx={{ color: 'warning.main', fontWeight: 'bold' }}
                      >
                        <span role='img' aria-label='uyarı'>
                          ⚠️
                        </span>{' '}
                        Görev tamamlamak için makina seçimi gerekli!
                      </Typography>
                    </Box>
                  );
                })()}
              </Box>
            )}

            {/* Makina Seçim Alanı - ZORUNLU */}
            {selectedTask.durum === 'bekliyor' && !taskData.makina && (
              <Box
                sx={{
                  p: { xs: 1.5, md: 3 },
                  bgcolor: 'error.light',
                  borderBottom: '1px solid',
                  borderColor: 'error.main',
                }}
              >
                <Alert severity='error' sx={{ mb: 2 }}>
                  <AlertTitle>Makina Seçimi Zorunlu!</AlertTitle>
                  Görevi tamamlayabilmek için mutlaka bir makina seçmelisiniz.
                </Alert>

                <FormControl fullWidth required error={!taskData.makina}>
                  <InputLabel>Makina Seçin *</InputLabel>
                  <Select
                    value={taskData.makina || ''}
                    onChange={e =>
                      setTaskData({ ...taskData, makina: e.target.value })
                    }
                    label='Makina Seçin *'
                  >
                    {selectedMachines.map(machine => (
                      <MenuItem key={machine._id} value={machine._id}>
                        {machine.makinaNo || machine.kod} - {machine.ad}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {!taskData.makina && 'Lütfen çalıştığınız makinayı seçin'}
                  </FormHelperText>
                </FormControl>
              </Box>
            )}

            {/* İlerleme Çubuğu */}
            {selectedTask.durum === 'bekliyor' && (
              <Box sx={{ p: { xs: 1.5, md: 3 }, bgcolor: 'grey.50' }}>
                <LinearProgress
                  variant='determinate'
                  value={getCompletionPercentage()}
                  sx={{
                    height: 8,
                    borderRadius: 5,
                    mb: 1,
                  }}
                />
                <Typography variant='caption' color='text.secondary'>
                  {taskData.maddeler.filter(m => m.cevap).length} /{' '}
                  {taskData.maddeler.length} madde • 📸{' '}
                  {getCompletedItemsWithImages()} fotoğraf
                </Typography>
              </Box>
            )}

            {/* Checklist Maddeleri */}
            <Box sx={{ p: { xs: 1, md: 3 } }}>
              <Typography
                variant='subtitle1'
                gutterBottom
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: { xs: 1, md: 2 },
                  px: { xs: 1, md: 0 },
                  fontWeight: 'bold',
                }}
              >
                <ImageIcon sx={{ mr: 1, fontSize: 20 }} />
                Checklist Maddeleri ({taskData.maddeler.length})
              </Typography>

              <Stack spacing={isMobile ? 0.5 : 2}>
                {taskData.maddeler.map((madde, index) => (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      borderRadius: 1,
                      border: madde.cevap
                        ? '1px solid #4CAF50'
                        : '1px solid #e0e0e0',
                      bgcolor: madde.cevap ? 'success.50' : 'white',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Mobile Layout */}
                    {isMobile ? (
                      <Box sx={{ p: 1 }}>
                        {/* Üst Satır: Checkbox + Soru + Puan */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: 0.5,
                          }}
                        >
                          <Checkbox
                            checked={madde.cevap}
                            onChange={e =>
                              onMaddeChange(index, 'cevap', e.target.checked)
                            }
                            disabled={selectedTask.durum !== 'bekliyor'}
                            size='small'
                            sx={{
                              p: 0.5,
                              mr: 1,
                              '& .MuiSvgIcon-root': { fontSize: 20 },
                            }}
                          />
                          <Typography
                            variant='body2'
                            sx={{
                              flex: 1,
                              fontSize: '0.875rem',
                              lineHeight: 1.2,
                              textDecoration: madde.cevap
                                ? 'line-through'
                                : 'none',
                              color: madde.cevap
                                ? 'success.main'
                                : 'text.primary',
                              mr: 1,
                            }}
                          >
                            {madde.soru}
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '0.75rem',
                              color: 'text.secondary',
                            }}
                          >
                            <StarIcon
                              sx={{ color: 'gold', fontSize: 14, mr: 0.25 }}
                            />
                            <Typography variant='caption' fontWeight='bold'>
                              {madde.cevap ? madde.maxPuan : 0}/{madde.maxPuan}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Alt Satır: Foto + Yorum */}
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 0.5,
                            alignItems: 'center',
                          }}
                        >
                          {/* Fotoğraf */}
                          <Box sx={{ flexShrink: 0 }}>
                            {madde.resimUrl ? (
                              <Box sx={{ position: 'relative' }}>
                                <CardMedia
                                  component='img'
                                  sx={{
                                    width: 40,
                                    height: 30,
                                    borderRadius: 0.5,
                                    objectFit: 'cover',
                                    cursor: 'pointer',
                                    border: '1px solid #4CAF50',
                                  }}
                                  image={madde.resimUrl}
                                  alt='📸'
                                  onClick={() => onImagePreview(madde.resimUrl)}
                                />
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    top: -2,
                                    right: -2,
                                  }}
                                >
                                  {selectedTask.durum === 'bekliyor' && (
                                    <IconButton
                                      size='small'
                                      onClick={() => onImageDelete(index)}
                                      sx={{
                                        bgcolor: 'rgba(244,67,54,0.9)',
                                        color: 'white',
                                        width: 16,
                                        height: 16,
                                        '&:hover': {
                                          bgcolor: 'rgba(244,67,54,1)',
                                        },
                                      }}
                                    >
                                      <DeleteIcon sx={{ fontSize: 10 }} />
                                    </IconButton>
                                  )}
                                </Box>
                              </Box>
                            ) : (
                              <Box>
                                <input
                                  type='file'
                                  accept='image/*'
                                  capture='environment'
                                  style={{ display: 'none' }}
                                  ref={el =>
                                    (fileInputRefs.current[index] = el)
                                  }
                                  onChange={e => onImageUpload(index, e)}
                                  disabled={selectedTask.durum !== 'bekliyor'}
                                />
                                <Button
                                  variant='outlined'
                                  size='small'
                                  onClick={() =>
                                    fileInputRefs.current[index]?.click()
                                  }
                                  disabled={selectedTask.durum !== 'bekliyor'}
                                  sx={{
                                    minWidth: 40,
                                    minHeight: 30,
                                    fontSize: '0.6rem',
                                    px: 0.5,
                                    py: 0.25,
                                    borderStyle: 'dashed',
                                  }}
                                >
                                  <span role='img' aria-label='kamera'>
                                    📷
                                  </span>
                                </Button>
                              </Box>
                            )}
                          </Box>

                          {/* Yorum */}
                          <TextField
                            fullWidth
                            placeholder='Yorum...'
                            value={madde.yorum || ''}
                            onChange={e =>
                              onMaddeChange(index, 'yorum', e.target.value)
                            }
                            disabled={selectedTask.durum !== 'bekliyor'}
                            variant='outlined'
                            size='small'
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                height: 32,
                                fontSize: '0.75rem',
                                borderRadius: 0.5,
                              },
                              '& .MuiOutlinedInput-input': { py: 0.5, px: 1 },
                            }}
                          />
                        </Box>
                      </Box>
                    ) : (
                      /* Desktop Layout */
                      <Box sx={{ p: 2 }}>
                        {/* Madde Başlığı */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            mb: 1,
                          }}
                        >
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={madde.cevap}
                                onChange={e =>
                                  onMaddeChange(
                                    index,
                                    'cevap',
                                    e.target.checked,
                                  )
                                }
                                disabled={selectedTask.durum !== 'bekliyor'}
                                sx={{
                                  '& .MuiSvgIcon-root': { fontSize: 28 },
                                  mr: 1,
                                  mt: -0.5,
                                }}
                              />
                            }
                            label={
                              <Typography
                                variant='subtitle1'
                                fontWeight='bold'
                                sx={{
                                  textDecoration: madde.cevap
                                    ? 'line-through'
                                    : 'none',
                                  color: madde.cevap
                                    ? 'success.main'
                                    : 'text.primary',
                                  wordBreak: 'break-word',
                                  lineHeight: 1.3,
                                }}
                              >
                                {madde.soru}
                              </Typography>
                            }
                            sx={{ flex: 1, alignItems: 'flex-start', mr: 1 }}
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <StarIcon
                              sx={{ color: 'gold', fontSize: 20, mr: 0.5 }}
                            />
                            <Typography variant='body2' fontWeight='bold'>
                              {madde.cevap ? madde.maxPuan : 0} /{' '}
                              {madde.maxPuan}
                            </Typography>
                          </Box>
                        </Box>

                        {/* İçerik: Fotoğraf ve Yorum */}
                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                          {/* Fotoğraf */}
                          <Box sx={{ width: 120, flexShrink: 0 }}>
                            {madde.resimUrl ? (
                              <Box sx={{ position: 'relative' }}>
                                <CardMedia
                                  component='img'
                                  sx={{
                                    width: '100%',
                                    height: 80,
                                    borderRadius: 1,
                                    objectFit: 'cover',
                                    cursor: 'pointer',
                                    border: '2px solid #4CAF50',
                                  }}
                                  image={madde.resimUrl}
                                  alt='Fotoğraf'
                                  onClick={() => onImagePreview(madde.resimUrl)}
                                />
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    top: 2,
                                    right: 2,
                                    display: 'flex',
                                    gap: 0.5,
                                  }}
                                >
                                  <IconButton
                                    size='small'
                                    onClick={() =>
                                      onImagePreview(madde.resimUrl)
                                    }
                                    sx={{
                                      bgcolor: 'rgba(0,0,0,0.6)',
                                      color: 'white',
                                      width: 20,
                                      height: 20,
                                      '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                                    }}
                                  >
                                    <ZoomInIcon sx={{ fontSize: 12 }} />
                                  </IconButton>
                                  {selectedTask.durum === 'bekliyor' && (
                                    <IconButton
                                      size='small'
                                      onClick={() => onImageDelete(index)}
                                      sx={{
                                        bgcolor: 'rgba(244,67,54,0.8)',
                                        color: 'white',
                                        width: 20,
                                        height: 20,
                                        '&:hover': {
                                          bgcolor: 'rgba(244,67,54,1)',
                                        },
                                      }}
                                    >
                                      <DeleteIcon sx={{ fontSize: 12 }} />
                                    </IconButton>
                                  )}
                                </Box>
                              </Box>
                            ) : (
                              <Box>
                                <input
                                  type='file'
                                  accept='image/*'
                                  capture='environment'
                                  style={{ display: 'none' }}
                                  ref={el =>
                                    (fileInputRefs.current[index] = el)
                                  }
                                  onChange={e => onImageUpload(index, e)}
                                  disabled={selectedTask.durum !== 'bekliyor'}
                                />
                                <Button
                                  variant='outlined'
                                  size='small'
                                  startIcon={<PhotoCameraIcon />}
                                  onClick={() =>
                                    fileInputRefs.current[index]?.click()
                                  }
                                  disabled={selectedTask.durum !== 'bekliyor'}
                                  sx={{
                                    borderRadius: 1,
                                    borderStyle: 'dashed',
                                    minHeight: 40,
                                    fontSize: '0.75rem',
                                    px: 1,
                                  }}
                                >
                                  Fotoğraf
                                </Button>
                              </Box>
                            )}
                          </Box>

                          {/* Yorum */}
                          <Box sx={{ flex: 1 }}>
                            <TextField
                              fullWidth
                              multiline
                              rows={2}
                              placeholder='Yorum ekleyin...'
                              value={madde.yorum || ''}
                              onChange={e =>
                                onMaddeChange(index, 'yorum', e.target.value)
                              }
                              disabled={selectedTask.durum !== 'bekliyor'}
                              variant='outlined'
                              size='small'
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 1,
                                  fontSize: '0.875rem',
                                },
                              }}
                            />
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </Paper>
                ))}
              </Stack>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            p: { xs: 1.5, md: 3 },
            bgcolor: 'grey.50',
            flexDirection: 'row',
            gap: 1,
            position: 'sticky',
            bottom: 0,
            zIndex: 1000,
          }}
        >
          <Button
            onClick={onClose}
            size={isMobile ? 'medium' : 'large'}
            startIcon={<CancelIcon />}
            sx={{
              borderRadius: 2,
              minHeight: { xs: 44, md: 48 },
              flex: 1,
              fontSize: { xs: '0.875rem', md: '1rem' },
            }}
          >
            {selectedTask?.durum === 'bekliyor' ? 'İptal' : 'Kapat'}
          </Button>

          {/* Bekliyor durumunda - Görevi Tamamla butonu (eski: Başlat) */}
          {selectedTask?.durum === 'bekliyor' && !selectedTask?.makina && (
            <Button
              variant='contained'
              onClick={onTaskComplete}
              disabled={completing || selectedMachines.length === 0}
              size={isMobile ? 'medium' : 'large'}
              startIcon={
                completing ? <CircularProgress size={16} /> : <SaveIcon />
              }
              sx={{
                borderRadius: 2,
                minHeight: { xs: 44, md: 48 },
                flex: 2,
                fontSize: { xs: '0.875rem', md: '1rem' },
                background: completing
                  ? 'grey.400'
                  : 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)',
                color: 'white',
                fontWeight: 'bold',
                '&:hover': {
                  background: completing
                    ? 'grey.400'
                    : 'linear-gradient(45deg, #388E3C 30%, #4CAF50 90%)',
                },
                '&:disabled': {
                  background: 'grey.400',
                  color: 'white',
                },
              }}
            >
              {completing ? 'Tamamlanıyor...' : 'GÖREVI TAMAMLA'}
            </Button>
          )}

          {/* Başlatılmış veya makina atanmış durumunda - Tamamla butonu */}
          {selectedTask?.durum === 'bekliyor' &&
            (selectedTask?.makina || selectedTask?.durum === 'baslatildi') && (
              <Button
                variant='contained'
                onClick={onTaskComplete}
                disabled={completing}
                size={isMobile ? 'medium' : 'large'}
                startIcon={
                  completing ? <CircularProgress size={16} /> : <SaveIcon />
                }
                sx={{
                  borderRadius: 2,
                  minHeight: { xs: 44, md: 48 },
                  flex: 2,
                  fontSize: { xs: '0.875rem', md: '1rem' },
                  background: completing
                    ? 'grey.400'
                    : 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)',
                  color: 'white',
                  fontWeight: 'bold',
                  '&:hover': {
                    background: completing
                      ? 'grey.400'
                      : 'linear-gradient(45deg, #388E3C 30%, #4CAF50 90%)',
                  },
                  '&:disabled': {
                    background: 'grey.400',
                    color: 'white',
                  },
                }}
              >
                {completing ? 'Tamamlanıyor...' : 'GÖREVİ TAMAMLA'}
              </Button>
            )}

          {/* Başlatılmış durumunda - Tamamla butonu */}
          {selectedTask?.durum === 'baslatildi' && (
            <Button
              variant='contained'
              onClick={onTaskComplete}
              disabled={completing}
              size={isMobile ? 'medium' : 'large'}
              startIcon={
                completing ? <CircularProgress size={16} /> : <SaveIcon />
              }
              sx={{
                borderRadius: 2,
                minHeight: { xs: 44, md: 48 },
                flex: 2,
                fontSize: { xs: '0.875rem', md: '1rem' },
                background: completing
                  ? 'grey.400'
                  : 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)',
                color: 'white',
                fontWeight: 'bold',
                '&:hover': {
                  background: completing
                    ? 'grey.400'
                    : 'linear-gradient(45deg, #388E3C 30%, #4CAF50 90%)',
                },
                '&:disabled': {
                  background: 'grey.400',
                  color: 'white',
                },
              }}
            >
              {completing ? 'Tamamlanıyor...' : 'GÖREVİ TAMAMLA'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Resim Önizleme Dialog */}
      <Dialog
        open={imageDialog}
        onClose={onImageDialogClose}
        maxWidth='md'
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', py: { xs: 1, md: 2 } }}
        >
          <ImageIcon sx={{ mr: 1 }} />
          Fotoğraf Önizleme
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {imagePreview && (
            <img
              src={imagePreview}
              alt='Önizleme'
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: isMobile ? '100vh' : '70vh',
                objectFit: 'contain',
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={onImageDialogClose}
            size={isMobile ? 'medium' : 'large'}
            sx={{ minHeight: { xs: 40, md: 48 } }}
          >
            Kapat
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TaskDialog;
