import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
} from '@mui/material';
import { formatUserName, formatDate } from '../../utils/hrHelpers';

const ScoreHistory = ({
  scores,
  users,
  hrYetkileri,
  filterYear,
  filterMonth,
  filterUser,
  onFilterChange,
}) => {
  console.log('🔍 ScoreHistory Debug:', {
    scoresLength: scores?.length,
    sampleScore: scores?.[0],
    hrYetkileri,
  });

  // HRScore verilerini flatten etme - her checklist puanlamasını ayrı satır yap
  const flattenedScores = React.useMemo(() => {
    if (!scores || scores.length === 0) {
      return [];
    }

    const flattened = [];

    scores.forEach(hrScore => {
      console.log('📊 Processing HRScore:', {
        id: hrScore._id,
        kullanici: hrScore.kullanici?.ad,
        checklistCount: hrScore.checklistPuanlari?.length,
        genelToplam: hrScore.toplamPuanlar?.genelToplam,
        toplamPuan: hrScore.toplamPuan, // Legacy field
      });

      // Her checklist puanlamasını ayrı satır olarak ekle
      if (hrScore.checklistPuanlari && hrScore.checklistPuanlari.length > 0) {
        hrScore.checklistPuanlari.forEach((puanlama, index) => {
          console.log('📋 Processing Checklist Puanlama:', {
            sablon: puanlama.sablon?.ad,
            puan: puanlama.madde?.puan,
            tarih: puanlama.tarih,
          });

          flattened.push({
            id: `${hrScore._id}_${index}`,
            kullanici: hrScore.kullanici,
            sablon: puanlama.sablon,
            puan: puanlama.madde?.puan || 0,
            maksimumPuan:
              puanlama.madde?.maksimumPuan || puanlama.madde?.puan || 0,
            genelNot: puanlama.notlar || '',
            tarih: puanlama.tarih,
            degerlendiren: puanlama.degerlendiren,
            donem: hrScore.donem,
            tip: 'checklist',
          });
        });
      }

      // Mesai kayıtlarını da ekle
      if (hrScore.mesaiKayitlari && hrScore.mesaiKayitlari.length > 0) {
        hrScore.mesaiKayitlari.forEach((mesai, index) => {
          flattened.push({
            id: `${hrScore._id}_mesai_${index}`,
            kullanici: hrScore.kullanici,
            sablon: { ad: 'Fazla Mesai' },
            puan: mesai.puan || 0,
            maksimumPuan: mesai.puan || 0,
            genelNot: mesai.aciklama || `${mesai.saat} saat fazla mesai`,
            tarih: mesai.tarih,
            degerlendiren: mesai.olusturanKullanici,
            donem: hrScore.donem,
            tip: 'mesai',
          });
        });
      }

      // Devamsızlık kayıtlarını da ekle
      if (
        hrScore.devamsizlikKayitlari &&
        hrScore.devamsizlikKayitlari.length > 0
      ) {
        hrScore.devamsizlikKayitlari.forEach((devamsizlik, index) => {
          flattened.push({
            id: `${hrScore._id}_devamsizlik_${index}`,
            kullanici: hrScore.kullanici,
            sablon: { ad: 'Devamsızlık' },
            puan: devamsizlik.puan || 0,
            maksimumPuan: Math.abs(devamsizlik.puan || 0),
            genelNot:
              devamsizlik.aciklama ||
              `${devamsizlik.miktar} ${devamsizlik.tur === 'saat' ? 'saat' : 'gün'} devamsızlık`,
            tarih: devamsizlik.tarih,
            degerlendiren: devamsizlik.olusturanKullanici,
            donem: hrScore.donem,
            tip: 'devamsizlik',
          });
        });
      }
    });

    // Tarihe göre sırala (en yeni önce)
    return flattened.sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
  }, [scores]);

  console.log('📊 Flattened Scores:', {
    originalCount: scores?.length,
    flattenedCount: flattenedScores.length,
    sampleFlattened: flattenedScores[0],
  });

  if (!hrYetkileri?.raporGorebilir) {
    return (
      <Alert severity='warning'>
        Puanlama geçmişi görüntüleme yetkisine sahip değilsiniz.
      </Alert>
    );
  }

  const handleFilterChange = (field, value) => {
    onFilterChange({ [field]: value });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: 'Ocak' },
    { value: 2, label: 'Şubat' },
    { value: 3, label: 'Mart' },
    { value: 4, label: 'Nisan' },
    { value: 5, label: 'Mayıs' },
    { value: 6, label: 'Haziran' },
    { value: 7, label: 'Temmuz' },
    { value: 8, label: 'Ağustos' },
    { value: 9, label: 'Eylül' },
    { value: 10, label: 'Ekim' },
    { value: 11, label: 'Kasım' },
    { value: 12, label: 'Aralık' },
  ];

  const getTypeColor = tip => {
    switch (tip) {
      case 'checklist':
        return 'primary';
      case 'mesai':
        return 'success';
      case 'devamsizlik':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTypeLabel = tip => {
    switch (tip) {
      case 'checklist':
        return 'Şablon';
      case 'mesai':
        return 'Mesai';
      case 'devamsizlik':
        return 'Devamsızlık';
      default:
        return 'Diğer';
    }
  };

  return (
    <Box>
      <Typography variant='h6' component='h2' sx={{ mb: 3 }}>
        Puanlama Geçmişi
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Yıl</InputLabel>
              <Select
                value={filterYear}
                label='Yıl'
                onChange={e => handleFilterChange('year', e.target.value)}
              >
                {years.map(year => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Ay</InputLabel>
              <Select
                value={filterMonth}
                label='Ay'
                onChange={e => handleFilterChange('month', e.target.value)}
              >
                {months.map(month => (
                  <MenuItem key={month.value} value={month.value}>
                    {month.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Kullanıcı</InputLabel>
              <Select
                value={filterUser}
                label='Kullanıcı'
                onChange={e => handleFilterChange('user', e.target.value)}
              >
                <MenuItem value=''>Tümü</MenuItem>
                {users.map(user => (
                  <MenuItem key={user._id} value={user._id}>
                    {formatUserName(user)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Scores Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.50' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Kullanıcı</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Tip</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Şablon/Kategori</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Puan</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Açıklama</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Tarih</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Dönem</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {flattenedScores.map(scoreItem => (
              <TableRow
                key={scoreItem.id}
                sx={{
                  '&:hover': { bgcolor: 'action.hover' },
                  '&:nth-of-type(odd)': { bgcolor: 'action.selected' },
                }}
              >
                <TableCell>
                  <Typography variant='body2' fontWeight='medium'>
                    {formatUserName(scoreItem.kullanici)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getTypeLabel(scoreItem.tip)}
                    size='small'
                    color={getTypeColor(scoreItem.tip)}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant='body2'>
                    {scoreItem.sablon?.ad || 'Bilinmiyor'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant='h6'
                      component='span'
                      color={
                        scoreItem.puan >= 0 ? 'success.main' : 'error.main'
                      }
                      fontWeight='bold'
                    >
                      {scoreItem.puan}
                    </Typography>
                    {scoreItem.maksimumPuan > 0 && (
                      <Typography variant='body2' color='text.secondary'>
                        / {scoreItem.maksimumPuan}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography
                    variant='body2'
                    sx={{
                      maxWidth: 250,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={scoreItem.genelNot}
                  >
                    {scoreItem.genelNot || 'Açıklama yok'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant='body2'>
                    {formatDate(scoreItem.tarih)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant='body2' color='text.secondary'>
                    {scoreItem.donem?.ay}/{scoreItem.donem?.yil}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
            {flattenedScores.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align='center' sx={{ py: 4 }}>
                  <Typography color='text.secondary'>
                    Seçilen kriterlere uygun puanlama kaydı bulunmamaktadır.
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mt: 1 }}
                  >
                    {scores?.length > 0
                      ? `${scores.length} HR kaydı bulundu ancak puanlama detayı yok.`
                      : 'Hiç HR kaydı bulunamadı.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ScoreHistory;
