import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Chip,
  Box,
  Alert,
} from '@mui/material';
import {
  Build as BuildIcon,
  PlayArrow as PlayArrowIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import {
  getStatusColor,
  getStatusText,
  getStatusIcon,
  isTaskOverdue,
  formatDate,
} from '../../utils/taskHelpers';

const TaskCard = ({ task, onTaskClick, isMobile }) => {
  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow: isMobile
          ? '0 2px 8px rgba(0,0,0,0.1)'
          : '0 4px 20px rgba(0,0,0,0.1)',
        border:
          isTaskOverdue(task.hedefTarih) && task.durum === 'bekliyor'
            ? '2px solid #f44336'
            : '1px solid #e0e0e0',
        '&:hover': {
          transform: isMobile ? 'none' : 'translateY(-2px)',
          boxShadow: isMobile
            ? '0 2px 8px rgba(0,0,0,0.15)'
            : '0 8px 30px rgba(0,0,0,0.15)',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, md: 2 }, pb: { xs: 1, md: 1 } }}>
        {/* Başlık ve Durum */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: { xs: 1, md: 2 },
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 0.5 : 0,
          }}
        >
          <Typography
            variant={isMobile ? 'subtitle1' : 'h6'}
            fontWeight='bold'
            sx={{
              flex: 1,
              mr: { xs: 0, md: 1 },
              fontSize: { xs: '1rem', md: '1.25rem' },
            }}
          >
            {task.checklist?.ad || 'Bilinmeyen Checklist'}
          </Typography>
          <Chip
            icon={getStatusIcon(task.durum)}
            label={getStatusText(task.durum)}
            color={getStatusColor(task.durum)}
            size='small'
            sx={{
              fontWeight: 'bold',
              fontSize: { xs: '0.7rem', md: '0.8rem' },
              height: { xs: 24, md: 32 },
            }}
          />
        </Box>

        {/* Detaylar */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: { xs: 0.5, md: 1 },
            alignItems: { xs: 'flex-start', md: 'center' },
            flexWrap: 'wrap',
          }}
        >
          {/* Makina */}
          {task.makina ? (
            <Chip
              icon={<BuildIcon />}
              label={`${task.makina.kod || task.makina.makinaNo} - ${task.makina.ad}`}
              variant='outlined'
              color='primary'
              size='small'
              sx={{ fontSize: '0.7rem', height: 24 }}
            />
          ) : (
            <Chip
              icon={<WarningIcon />}
              label='Makina Seçilmemiş'
              variant='outlined'
              color='warning'
              size='small'
              sx={{ fontSize: '0.7rem', height: 24 }}
            />
          )}

          {/* Tarih */}
          <Typography variant='caption' color='text.secondary'>
            <span role='img' aria-label='takvim'>
              📅
            </span>{' '}
            {task.durum === 'bekliyor' || !task.tamamlanmaTarihi
              ? `Hedef: ${formatDate(task.hedefTarih)}`
              : `Tamamlandı: ${formatDate(task.tamamlanmaTarihi)}`}
          </Typography>

          {/* Puan */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <StarIcon sx={{ color: 'gold', fontSize: 16, mr: 0.5 }} />
            <Typography variant='caption' fontWeight='bold'>
              {task.toplamPuan || 0} Puan
            </Typography>
          </Box>
        </Box>

        {/* Gecikme Uyarısı */}
        {isTaskOverdue(task.hedefTarih) && task.durum === 'bekliyor' && (
          <Alert severity='error' sx={{ mt: 1, py: 0.5 }}>
            <Typography variant='caption'>
              <span role='img' aria-label='uyarı'>
                ⚠️
              </span>{' '}
              Bu görev gecikmiş!
            </Typography>
          </Alert>
        )}
      </CardContent>

      <CardActions
        sx={{ px: { xs: 1.5, md: 2 }, pb: { xs: 1.5, md: 2 }, pt: 0 }}
      >
        <Button
          fullWidth
          variant={task.durum === 'bekliyor' ? 'contained' : 'outlined'}
          size={isMobile ? 'medium' : 'large'}
          startIcon={
            task.durum === 'bekliyor' ? <PlayArrowIcon /> : <InfoIcon />
          }
          onClick={() => onTaskClick(task)}
          disabled={
            task.durum !== 'bekliyor' &&
            task.durum !== 'baslatildi' &&
            task.durum !== 'tamamlandi' &&
            task.durum !== 'onaylandi'
          }
          sx={{
            borderRadius: 2,
            py: { xs: 1, md: 1.5 },
            fontWeight: 'bold',
            fontSize: { xs: '0.875rem', md: '1rem' },
            minHeight: { xs: 40, md: 48 },
          }}
        >
          {task.durum === 'bekliyor'
            ? task.makina
              ? 'Görevi Tamamla'
              : 'Görevi Tamamla'
            : task.durum === 'baslatildi'
              ? 'Görevi Tamamla'
              : 'Detayları Görüntüle'}
        </Button>
      </CardActions>
    </Card>
  );
};

export default TaskCard;
