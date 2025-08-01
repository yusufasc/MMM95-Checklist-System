import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Avatar,
  Fade,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Work as WorkIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import {
  getTypeColor,
  getPeriyotText,
  getTotalPoints,
} from '../../utils/checklistHelpers';

const ChecklistCard = ({
  checklist,
  roles,
  departments,
  onEdit,
  onDelete,
  index,
}) => {
  const role = roles.find(
    r => r._id === checklist.hedefRol?._id || checklist.hedefRol,
  );
  const department = departments.find(
    d => d._id === checklist.hedefDepartman?._id || checklist.hedefDepartman,
  );
  const totalPoints = getTotalPoints(checklist.maddeler);
  const typeColor = getTypeColor(checklist.tur);
  const TypeIcon = checklist.tur === 'rutin' ? ScheduleIcon : WorkIcon;

  return (
    <Fade in timeout={300 + index * 100}>
      <Card
        elevation={4}
        sx={{
          borderRadius: 4,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          border: '2px solid transparent',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            borderColor: 'primary.main',
          },
        }}
      >
        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          {/* Header with Type and Actions */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                sx={{
                  bgcolor: `${typeColor}.main`,
                  width: 32,
                  height: 32,
                }}
              >
                <TypeIcon fontSize='small' />
              </Avatar>
              <Chip
                label={checklist.tur === 'rutin' ? 'Rutin' : 'İş Bağlı'}
                color={typeColor}
                size='small'
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
            <Chip
              label={getPeriyotText(checklist.periyot)}
              variant='outlined'
              size='small'
              color='primary'
            />
          </Box>

          {/* Title */}
          <Typography
            variant='h6'
            fontWeight='bold'
            color='primary.main'
            sx={{ mb: 2, minHeight: 50 }}
          >
            {checklist.ad}
          </Typography>

          {/* İş Türü (if applicable) */}
          {checklist.isTuru && (
            <Box sx={{ mb: 2 }}>
              <Typography variant='body2' color='text.secondary' gutterBottom>
                İş Türü:
              </Typography>
              <Chip
                label={checklist.isTuru}
                variant='outlined'
                size='small'
                color='secondary'
              />
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Role and Department Info */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <GroupIcon fontSize='small' color='action' />
              <Typography variant='body2' color='text.secondary'>
                Hedef Rol:
              </Typography>
            </Box>
            <Typography variant='body2' fontWeight='medium' sx={{ ml: 3 }}>
              {role?.ad || 'Bilinmiyor'}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mt: 1,
                mb: 1,
              }}
            >
              <AssignmentIcon fontSize='small' color='action' />
              <Typography variant='body2' color='text.secondary'>
                Departman:
              </Typography>
            </Box>
            <Typography variant='body2' fontWeight='medium' sx={{ ml: 3 }}>
              {department?.ad || 'Bilinmiyor'}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Değerlendirme Saatleri */}
          {checklist.degerlendirmeSaatleri &&
            checklist.degerlendirmeSaatleri.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant='body2' color='text.secondary' gutterBottom>
                  Değerlendirme Saatleri:
              </Typography>
              <Box
                sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 1 }}
              >
                {checklist.degerlendirmeSaatleri.map((saat, idx) => (
                  <Chip
                    key={idx}
                    label={saat.saat}
                    size='small'
                    variant='outlined'
                    color='primary'
                    sx={{ fontSize: '0.75rem' }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Aktif Durumu */}
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={checklist.aktif !== false ? 'Aktif' : 'Pasif'}
              color={checklist.aktif !== false ? 'success' : 'default'}
              size='small'
              sx={{ fontWeight: 'bold' }}
            />
            {checklist.degerlendirmePeriyodu && (
              <Chip
                label={`${checklist.degerlendirmePeriyodu}h periyot`}
                size='small'
                variant='outlined'
              />
            )}
          </Box>

          {/* Statistics */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              bgcolor: 'grey.50',
              p: 2,
              borderRadius: 2,
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant='h6' color='primary.main' fontWeight='bold'>
                {checklist.maddeler?.length || 0}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                Madde
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant='h6' color='secondary.main' fontWeight='bold'>
                {totalPoints}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                Toplam Puan
              </Typography>
            </Box>
          </Box>
        </CardContent>

        <CardActions
          sx={{
            justifyContent: 'space-between',
            p: 2,
            pt: 0,
          }}
        >
          <Button
            variant='outlined'
            startIcon={<EditIcon />}
            onClick={() => onEdit(checklist)}
            sx={{
              borderRadius: 2,
              flex: 1,
              mr: 1,
              '&:hover': {
                transform: 'translateY(-1px)',
              },
            }}
          >
            Düzenle
          </Button>
          <Button
            variant='outlined'
            color='error'
            startIcon={<DeleteIcon />}
            onClick={() => onDelete(checklist)}
            sx={{
              borderRadius: 2,
              flex: 1,
              ml: 1,
              '&:hover': {
                transform: 'translateY(-1px)',
              },
            }}
          >
            Sil
          </Button>
        </CardActions>
      </Card>
    </Fade>
  );
};

export default ChecklistCard;
