import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
  Stack,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import TaskCard from './TaskCard';

const MachineSection = ({
  machineKey,
  machineData,
  hasChecklistPermission,
  onScoreTask,
  isMobile,
}) => {
  const totalTasks = machineData.tasks.length;
  const completedTasks = machineData.tasks.filter(
    t => t.durum === 'tamamlandi',
  ).length;
  const approvedTasks = machineData.tasks.filter(
    t => t.durum === 'onaylandi',
  ).length;

  return (
    <Accordion
      defaultExpanded
      sx={{
        mb: 2,
        borderRadius: 2,
        '&:before': { display: 'none' },
        border: '1px solid',
        borderColor: 'grey.200',
        '&.Mui-expanded': {
          margin: '0 0 16px 0',
        },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          bgcolor: 'primary.50',
          borderRadius: '8px 8px 0 0',
          '&.Mui-expanded': {
            borderRadius: '8px 8px 0 0',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            pr: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <BuildIcon sx={{ color: 'primary.main' }} />
            <Box>
              <Typography
                variant={isMobile ? 'subtitle1' : 'h6'}
                sx={{ fontWeight: 'bold' }}
              >
                {machineKey}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {totalTasks} görev
              </Typography>
            </Box>
          </Box>

          <Stack direction='row' spacing={1}>
            {completedTasks > 0 && (
              <Chip
                label={`${completedTasks} Bekliyor`}
                color='warning'
                size='small'
                sx={{ fontWeight: 'bold' }}
              />
            )}
            {approvedTasks > 0 && (
              <Chip
                label={`${approvedTasks} Onaylandı`}
                color='success'
                size='small'
                sx={{ fontWeight: 'bold' }}
              />
            )}
          </Stack>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 2 }}>
        {machineData.tasks.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
              color: 'text.secondary',
            }}
          >
            <BuildIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant='h6' sx={{ mb: 1 }}>
              Henüz kontrol bekleyen görev yok
            </Typography>
            <Typography variant='body2'>
              Bu makina için tamamlanan görevler burada görünecektir.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {machineData.tasks.map(task => (
              <TaskCard
                key={task._id}
                task={task}
                hasChecklistPermission={hasChecklistPermission}
                onScoreTask={onScoreTask}
                isMobile={isMobile}
              />
            ))}
          </Stack>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default MachineSection;
