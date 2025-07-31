import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const DebugInfo = ({ summary, dailyPerformance }) => {
  return (
    <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f5f5f5' }}>
      <Typography variant='h6' sx={{ mb: 2 }}>
        🐛 Debug Bilgileri
      </Typography>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Summary Verisi</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box component='pre' sx={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(summary, null, 2)}
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Daily Performance Verisi</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box component='pre' sx={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(dailyPerformance, null, 2)}
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Veri Durumu</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant='body2'>
            Summary var mı: {summary ? '✅' : '❌'}
            <br />
            Daily Performance var mı:{' '}
            {dailyPerformance && dailyPerformance.length > 0 ? '✅' : '❌'}
            <br />
            Summary.genelIstatistikler var mı:{' '}
            {summary?.genelIstatistikler ? '✅' : '❌'}
            <br />
            Summary.kategorilerePuanlar var mı:{' '}
            {summary?.kategorilerePuanlar ? '✅' : '❌'}
            <br />
            Daily Performance uzunluğu: {dailyPerformance?.length || 0}
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default DebugInfo;
