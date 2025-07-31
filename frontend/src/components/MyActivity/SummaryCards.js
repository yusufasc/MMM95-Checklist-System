import React from 'react';
import { Grid, Card, CardContent, Box, Typography } from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Build as BuildIcon,
  Star as StarIcon,
  WorkOutline as WorkOutlineIcon,
  EmojiEvents as BonusIcon,
  Security as ControlIcon,
  ChecklistRtl as ChecklistIcon,
} from '@mui/icons-material';
import CountUp from 'react-countup';
import { getSuccessRate } from '../../utils/myActivityHelpers';

const SummaryCards = ({ summary, detailedScores }) => {
  if (!summary) {
    return null;
  }

  const stats = summary.genelIstatistikler || {};

  // Eğer detailedScores varsa onları kullan, yoksa fallback değerler
  const toplamGorevSayisi =
    detailedScores?.toplamGorevSayisi || stats.toplamGorevSayisi || 0;
  const tamamlananGorevSayisi = stats.tamamlananGorevSayisi || 0;
  const toplamPuan = detailedScores?.toplamPuan || stats.toplamPuan || 0;
  const gunlukOrtalama =
    toplamGorevSayisi > 0
      ? (toplamPuan / 30).toFixed(1)
      : stats.gunlukOrtalama || 0;

  // Detaylı puanları kullan
  const iseBagliGorevSayisi =
    detailedScores?.workTaskGorevSayisi ||
    stats.iseBagliGorevSayisi ||
    summary.iseBagliGorevleri ||
    0;
  const iseBagliPuani = detailedScores?.workTaskToplamPuan || 0;

  const bonusDegerlendirmeleri =
    detailedScores?.bonusGorevSayisi || summary.bonusDegerlendirmeleri || 0;
  const bonusPuani = detailedScores?.bonusToplamPuan || 0;

  const kontrolPuanlari =
    detailedScores?.kontrolGorevSayisi || summary.kontrolPuanlari || 0;
  const kontrolPuani = detailedScores?.kontrolToplamPuan || 0;

  // ✅ DÜZELTME: Checklist şablonları için doğru veri kaynağı
  const checklistSablonlariSayisi =
    detailedScores?.checklistGorevSayisi || summary.checklistSablonlari || 0;
  const checklistSablonlariPuani =
    detailedScores?.checklistSablonlariPuani || 0;

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {/* Toplam Görevler */}
      <Grid item xs={6} sm={4} md={3} lg={12 / 7}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
            color: 'white',
            borderRadius: 2,
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <AssignmentIcon sx={{ fontSize: 40 }} />
              <Typography variant='h3' sx={{ fontWeight: 'bold' }}>
                <CountUp end={toplamGorevSayisi} duration={1} />
              </Typography>
            </Box>
            <Typography variant='h6' gutterBottom>
              Toplam Görevler
            </Typography>
            <Typography variant='body2' sx={{ opacity: 0.9 }}>
              Son 30 günde yapılan
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Tamamlanan Görevler */}
      <Grid item xs={6} sm={4} md={3} lg={12 / 7}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)',
            color: 'white',
            borderRadius: 2,
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <WorkOutlineIcon sx={{ fontSize: 40 }} />
              <Typography variant='h3' sx={{ fontWeight: 'bold' }}>
                <CountUp end={tamamlananGorevSayisi} duration={1} />
              </Typography>
            </Box>
            <Typography variant='h6' gutterBottom>
              Tamamlanan
            </Typography>
            <Typography variant='body2' sx={{ opacity: 0.9 }}>
              Başarı oranı: %
              {getSuccessRate(tamamlananGorevSayisi, toplamGorevSayisi)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Toplam Puan */}
      <Grid item xs={6} sm={4} md={3} lg={12 / 7}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
            color: 'white',
            borderRadius: 2,
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <StarIcon sx={{ fontSize: 40 }} />
              <Typography variant='h3' sx={{ fontWeight: 'bold' }}>
                <CountUp end={toplamPuan} duration={1} />
              </Typography>
            </Box>
            <Typography variant='h6' gutterBottom>
              Toplam Puan
            </Typography>
            <Typography variant='body2' sx={{ opacity: 0.9 }}>
              Günlük ort: {gunlukOrtalama}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Checklist Şablonları */}
      <Grid item xs={6} sm={4} md={3} lg={12 / 7}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
            color: 'white',
            borderRadius: 2,
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <ChecklistIcon sx={{ fontSize: 40 }} />
              <Typography variant='h3' sx={{ fontWeight: 'bold' }}>
                <CountUp end={checklistSablonlariSayisi} duration={1} />
              </Typography>
            </Box>
            <Typography variant='h6' gutterBottom>
              Checklist Şablonları
            </Typography>
            <Typography variant='body2' sx={{ opacity: 0.9 }}>
              {checklistSablonlariPuani > 0
                ? `${checklistSablonlariPuani.toFixed(1)} puan`
                : 'Rutin görevler'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* İşe Bağlı Görevler */}
      <Grid item xs={6} sm={4} md={3} lg={12 / 7}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
            color: 'white',
            borderRadius: 2,
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <BuildIcon sx={{ fontSize: 40 }} />
              <Typography variant='h3' sx={{ fontWeight: 'bold' }}>
                <CountUp end={iseBagliGorevSayisi} duration={1} />
              </Typography>
            </Box>
            <Typography variant='h6' gutterBottom>
              İşe Bağlı Görevler
            </Typography>
            <Typography variant='body2' sx={{ opacity: 0.9 }}>
              {iseBagliPuani > 0
                ? `${iseBagliPuani.toFixed(1)} puan`
                : 'Operasyon görevleri'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Bonus Değerlendirmeleri */}
      <Grid item xs={6} sm={4} md={3} lg={12 / 7}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #E91E63 0%, #F06292 100%)',
            color: 'white',
            borderRadius: 2,
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <BonusIcon sx={{ fontSize: 40 }} />
              <Typography variant='h3' sx={{ fontWeight: 'bold' }}>
                <CountUp end={bonusDegerlendirmeleri} duration={1} />
              </Typography>
            </Box>
            <Typography variant='h6' gutterBottom>
              Bonus Puanları
            </Typography>
            <Typography variant='body2' sx={{ opacity: 0.9 }}>
              {bonusPuani > 0
                ? `${bonusPuani.toFixed(1)} puan`
                : 'Özel değerlendirmeler'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Kontrol Puanları */}
      <Grid item xs={6} sm={4} md={3} lg={12 / 7}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #00BCD4 0%, #4DD0E1 100%)',
            color: 'white',
            borderRadius: 2,
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <ControlIcon sx={{ fontSize: 40 }} />
              <Typography variant='h3' sx={{ fontWeight: 'bold' }}>
                <CountUp end={kontrolPuanlari} duration={1} />
              </Typography>
            </Box>
            <Typography variant='h6' gutterBottom>
              Kontrol Puanları
            </Typography>
            <Typography variant='body2' sx={{ opacity: 0.9 }}>
              {kontrolPuani > 0
                ? `${kontrolPuani.toFixed(1)} puan`
                : 'Başkalarını değerlendirme'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default SummaryCards;
