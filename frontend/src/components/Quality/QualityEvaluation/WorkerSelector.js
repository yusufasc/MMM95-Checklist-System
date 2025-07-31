import React from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Box,
  Typography,
  IconButton,
  Collapse,
  Grid,
  Autocomplete,
  TextField,
  Avatar,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import {
  formatWorkerName,
  formatTime,
  getScoreChipConfig,
  formatMachineInfo,
  formatKalipInfo,
  ALERT_MESSAGES,
  UI_CONFIG,
  PLACEHOLDERS,
} from '../../../utils/qualityEvaluationConfig';

const WorkerCard = ({ worker }) => (
  <Card
    sx={{
      bgcolor: 'grey.50',
      border: '1px solid',
      borderColor: 'grey.300',
      opacity: 0.8,
    }}
  >
    <CardContent sx={{ py: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 1,
        }}
      >
        <Avatar
          sx={{
            mr: 2,
            ...UI_CONFIG.AVATAR_SIZE.SMALL,
            bgcolor: 'grey.500',
          }}
        >
          {worker.ad[0]}
          {worker.soyad[0]}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant='body2' fontWeight='bold'>
            {formatWorkerName(worker)}
          </Typography>
        </Box>
      </Box>

      {worker.basariYuzdesi !== null && (
        <Box sx={{ mt: 1 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant='body2' color='text.secondary'>
              Son Puan:
            </Typography>
            <Chip
              label={`%${worker.basariYuzdesi}`}
              size='small'
              color={getScoreChipConfig(worker.basariYuzdesi).color}
            />
          </Box>
          <Typography variant='caption' color='text.secondary' display='block'>
            {worker.toplamPuan}/{worker.maksimumPuan} puan
          </Typography>
          <Typography variant='caption' color='text.secondary' display='block'>
            Değerlendirme: {formatTime(worker.sonDegerlendirme)}
          </Typography>
          {worker.degerlendirmeSayisi > 1 && (
            <Typography variant='caption' color='primary.main' display='block'>
              Bugün {worker.degerlendirmeSayisi} kez puanlandı
            </Typography>
          )}
        </Box>
      )}

      <Typography
        variant='caption'
        color='error.main'
        display='block'
        sx={{ mt: 1 }}
      >
        {worker.puanlanamaSebebi || '4 saat sonra tekrar puanlanabilir'}
      </Typography>
    </CardContent>
  </Card>
);

const WorkerSelector = ({
  availableWorkers,
  unavailableWorkers,
  selectedWorker,
  machines,
  kalips,
  selectedMachine,
  selectedKalip,
  hammadde,
  expanded,
  onWorkerSelect,
  onMachineSelect,
  onKalipSelect,
  onHammaddeChange,
  onToggleExpanded,
}) => {
  const getWorkerByValue = value => {
    return (availableWorkers || []).find(w => w._id === value) || null;
  };

  const getNoOptionsText = () => {
    const totalWorkers =
      (availableWorkers || []).length + (unavailableWorkers || []).length;

    if (totalWorkers === 0) {
      return ALERT_MESSAGES.NO_WORKERS;
    }

    if ((availableWorkers || []).length === 0) {
      return ALERT_MESSAGES.NO_AVAILABLE_WORKERS;
    }

    return ALERT_MESSAGES.NO_MATCHING_WORKERS;
  };

  return (
    <Paper sx={{ p: 3, mb: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={onToggleExpanded}
      >
        <Typography variant='h6' sx={{ display: 'flex', alignItems: 'center' }}>
          <PersonIcon sx={{ mr: 1 }} />
          Çalışan ve Makina Seçimi
        </Typography>
        <IconButton>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Çalışan Seçimi */}
          <Grid item xs={12}>
            <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 'bold' }}>
              Değerlendirilecek Çalışan
            </Typography>

            <Autocomplete
              fullWidth
              options={availableWorkers || []}
              getOptionLabel={option => formatWorkerName(option)}
              value={getWorkerByValue(selectedWorker)}
              onChange={(event, newValue) => {
                onWorkerSelect(newValue ? newValue._id : '');
              }}
              filterOptions={(options, { inputValue }) => {
                return (options || []).filter(option =>
                  formatWorkerName(option)
                    .toLowerCase()
                    .includes(inputValue.toLowerCase()),
                );
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  placeholder={PLACEHOLDERS.worker}
                  variant='outlined'
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      minHeight: UI_CONFIG.MIN_INPUT_HEIGHT,
                      fontSize: UI_CONFIG.INPUT_FONT_SIZE,
                    },
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component='li' {...props} sx={{ p: 2 }}>
                  <Avatar
                    sx={{
                      mr: 2,
                      ...UI_CONFIG.AVATAR_SIZE.MEDIUM,
                      bgcolor: 'primary.main',
                    }}
                  >
                    {option.ad[0]}
                    {option.soyad[0]}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant='body1' fontWeight='bold'>
                      {formatWorkerName(option)}
                    </Typography>
                  </Box>
                </Box>
              )}
              noOptionsText={getNoOptionsText()}
            />

            {/* Puanlanmış Çalışanlar Listesi */}
            {(unavailableWorkers || []).length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography
                  variant='subtitle2'
                  sx={{
                    mb: 2,
                    fontWeight: 'bold',
                    color: 'text.secondary',
                  }}
                >
                  Son 4 Saat İçinde Puanlanmış Çalışanlar
                </Typography>
                <Grid container spacing={2}>
                  {(unavailableWorkers || []).map(worker => (
                    <Grid item xs={12} sm={6} md={4} key={worker._id}>
                      <WorkerCard worker={worker} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Grid>

          {/* Makina Seçimi */}
          <Grid item xs={12} md={6}>
            <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 'bold' }}>
              Makina (İsteğe Bağlı)
            </Typography>
            <Autocomplete
              options={machines || []}
              getOptionLabel={option => formatMachineInfo(option)}
              value={
                (machines || []).find(m => m._id === selectedMachine) || null
              }
              onChange={(event, newValue) => {
                onMachineSelect(newValue ? newValue._id : '');
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  placeholder={PLACEHOLDERS.machine}
                  variant='outlined'
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      minHeight: UI_CONFIG.MIN_INPUT_HEIGHT,
                    },
                  }}
                />
              )}
            />
          </Grid>

          {/* Kalıp Seçimi */}
          <Grid item xs={12} md={6}>
            <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 'bold' }}>
              Kalıp (İsteğe Bağlı)
            </Typography>
            <Autocomplete
              options={kalips || []}
              getOptionLabel={option => formatKalipInfo(option)}
              value={(kalips || []).find(k => k._id === selectedKalip) || null}
              onChange={(event, newValue) => {
                onKalipSelect(newValue ? newValue._id : '');
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  placeholder={PLACEHOLDERS.kalip}
                  variant='outlined'
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      minHeight: UI_CONFIG.MIN_INPUT_HEIGHT,
                    },
                  }}
                />
              )}
            />
          </Grid>

          {/* Hammadde */}
          <Grid item xs={12}>
            <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 'bold' }}>
              Hammadde (İsteğe Bağlı)
            </Typography>
            <TextField
              fullWidth
              placeholder={PLACEHOLDERS.hammadde}
              value={hammadde}
              onChange={e => onHammaddeChange(e.target.value)}
              variant='outlined'
              sx={{
                '& .MuiOutlinedInput-root': {
                  minHeight: UI_CONFIG.MIN_INPUT_HEIGHT,
                  fontSize: UI_CONFIG.INPUT_FONT_SIZE,
                },
              }}
            />
          </Grid>
        </Grid>
      </Collapse>
    </Paper>
  );
};

// PropTypes for WorkerCard
WorkerCard.propTypes = {
  worker: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    ad: PropTypes.string.isRequired,
    soyad: PropTypes.string.isRequired,
    basariYuzdesi: PropTypes.number,
    toplamPuan: PropTypes.number,
    maksimumPuan: PropTypes.number,
    sonDegerlendirme: PropTypes.string,
    degerlendirmeSayisi: PropTypes.number,
    puanlanamaSebebi: PropTypes.string,
  }).isRequired,
};

// PropTypes for WorkerSelector
WorkerSelector.propTypes = {
  availableWorkers: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      ad: PropTypes.string.isRequired,
      soyad: PropTypes.string.isRequired,
    }),
  ).isRequired,
  unavailableWorkers: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      ad: PropTypes.string.isRequired,
      soyad: PropTypes.string.isRequired,
      basariYuzdesi: PropTypes.number,
      toplamPuan: PropTypes.number,
      maksimumPuan: PropTypes.number,
      sonDegerlendirme: PropTypes.string,
      degerlendirmeSayisi: PropTypes.number,
      puanlanamaSebebi: PropTypes.string,
    }),
  ).isRequired,
  selectedWorker: PropTypes.string.isRequired,
  machines: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      kod: PropTypes.string.isRequired,
      ad: PropTypes.string.isRequired,
    }),
  ).isRequired,
  kalips: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      kod: PropTypes.string.isRequired,
      ad: PropTypes.string.isRequired,
    }),
  ).isRequired,
  selectedMachine: PropTypes.string.isRequired,
  selectedKalip: PropTypes.string.isRequired,
  hammadde: PropTypes.string.isRequired,
  expanded: PropTypes.bool.isRequired,
  onWorkerSelect: PropTypes.func.isRequired,
  onMachineSelect: PropTypes.func.isRequired,
  onKalipSelect: PropTypes.func.isRequired,
  onHammaddeChange: PropTypes.func.isRequired,
  onToggleExpanded: PropTypes.func.isRequired,
};

export default WorkerSelector;
