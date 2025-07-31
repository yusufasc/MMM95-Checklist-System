import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  EmojiEvents as TrophyIcon,
  Security as SecurityIcon,
  Science as ScienceIcon,
  Build as BuildIcon,
  ChecklistRtl as ChecklistIcon,
} from '@mui/icons-material';
import { debugScoreCalculation } from '../../utils/scoreCalculations';

/**
 * ScoreBreakdown Cards Component
 * ScoreBreakdown.js'den ayrılan kart componentları
 * Geçmiş problemler: NaN display, duplicate keys, field mapping
 * Çözümler: Güvenli fallbacks, unique keys, proper field mapping
 */

/**
 * İK Puanları Kartı
 */
export const IKScoreCard = ({ ikToplamPuan, hrScores, ik }) => {
  // Debug logging
  debugScoreCalculation('İK Puan Hesaplama', {
    hrScoresExists: !!hrScores,
    hrScoresLength: hrScores?.length,
    ikToplam: ik.toplam,
    ikToplamPuan,
  });

  return (
    <Grid item xs={12} md={6}>
      <Card sx={{ height: '100%', position: 'relative' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AssessmentIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant='h6' fontWeight='bold'>
              İK Puanları
            </Typography>
          </Box>

          <Typography
            variant='h3'
            color='primary.main'
            fontWeight='bold'
            sx={{ mb: 2 }}
          >
            {ikToplamPuan || 0}
          </Typography>

          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant='body1' color='text.secondary' sx={{ mb: 1 }}>
              Bu Ay Toplam
            </Typography>
            <Typography variant='body2' fontWeight='bold'>
              {hrScores?.length || ik.gorevSayisi || 0} değerlendirme
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
};

/**
 * Bonus Puanları Kartı
 */
export const BonusScoreCard = ({ bonusToplamPuan, bonusEvaluations }) => {
  // Bonus evaluations'ları template'e göre grupla
  const groupedBonuses =
    bonusEvaluations?.reduce((acc, evaluation) => {
      const templateName =
        evaluation.template?.ad ||
        evaluation.checklistAdi ||
        'Bilinmeyen Değerlendirme';
      if (!acc[templateName]) {
        acc[templateName] = { count: 0, totalScore: 0 };
      }
      acc[templateName].count += 1;
      acc[templateName].totalScore +=
        evaluation.toplamPuan || evaluation.puan || 0;
      return acc;
    }, {}) || {};

  return (
    <Grid item xs={12} md={6}>
      <Card sx={{ height: '100%', position: 'relative' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TrophyIcon sx={{ mr: 1, color: '#E91E63' }} />
            <Typography variant='h6' fontWeight='bold'>
              Değerlendirme Puanlarım
            </Typography>
          </Box>

          <Typography
            variant='h3'
            sx={{ color: '#E91E63', fontWeight: 'bold', mb: 2 }}
          >
            {bonusToplamPuan || 0}
          </Typography>

          {Object.keys(groupedBonuses).length > 0 ? (
            <Box sx={{ mb: 2 }}>
              {Object.entries(groupedBonuses).map(([templateName, data]) => (
                <Box
                  key={templateName}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1,
                    borderBottom: '1px solid rgba(0,0,0,0.1)',
                  }}
                >
                  <Typography variant='body2' fontWeight='bold'>
                    {templateName}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {data.count} adet = {data.totalScore} puan
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant='body2' color='text.secondary'>
                Bu dönemde değerlendirme bulunmuyor.
              </Typography>
            </Box>
          )}

          <Box sx={{ textAlign: 'center', py: 1 }}>
            <Typography variant='body1' color='text.secondary' sx={{ mb: 1 }}>
              Bu Ay Toplam
            </Typography>
            <Typography variant='body2' fontWeight='bold'>
              {bonusEvaluations?.length || 0} değerlendirme
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
};

/**
 * Kontrol Puanları Kartı
 */
export const ControlScoreCard = ({ kontrolKartiPuani, controlSummary }) => {
  return (
    <Grid item xs={12} md={6}>
      <Card sx={{ height: '100%', position: 'relative' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SecurityIcon sx={{ mr: 1, color: '#9C27B0' }} />
            <Typography variant='h6' fontWeight='bold'>
              Kontrol Puanlarım
            </Typography>
          </Box>

          <Typography
            variant='h3'
            sx={{ color: '#9C27B0', fontWeight: 'bold', mb: 2 }}
          >
            {kontrolKartiPuani || 0}
          </Typography>

          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant='body1' color='text.secondary' sx={{ mb: 1 }}>
              Bu Ay Toplam
            </Typography>
            <Typography variant='body2' fontWeight='bold'>
              {controlSummary?.genel?.kontrolSayisi || 0} puanlama
            </Typography>
            <Typography
              variant='caption'
              color='text.secondary'
              sx={{ mt: 1, display: 'block' }}
            >
              Başkalarını puanlarken aldığım kontrol puanları
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
};

/**
 * Kalite Kontrol Puanları Kartı
 */
export const QualityControlScoreCard = ({
  kaliteKontrolToplamPuan,
  qualityScores,
}) => {
  return (
    <Grid item xs={12} md={6}>
      <Card sx={{ height: '100%', position: 'relative' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ScienceIcon sx={{ mr: 1, color: '#9C27B0' }} />
            <Typography variant='h6' fontWeight='bold'>
              Kalite Kontrol Puanları
            </Typography>
          </Box>

          <Typography
            variant='h3'
            sx={{ color: '#9C27B0', fontWeight: 'bold', mb: 2 }}
          >
            {kaliteKontrolToplamPuan || 0}
          </Typography>

          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant='body1' color='text.secondary' sx={{ mb: 1 }}>
              Bu Ay Toplam
            </Typography>
            <Typography variant='body2' fontWeight='bold'>
              {qualityScores?.length || 0} değerlendirme
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
};

/**
 * İşe Bağlı Görevler Kartı
 */
export const WorkTaskScoreCard = ({ workTaskToplamPuan, workTaskScores }) => {
  return (
    <Grid item xs={12} md={6}>
      <Card sx={{ height: '100%', position: 'relative' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <BuildIcon sx={{ mr: 1, color: '#FF9800' }} />
            <Typography variant='h6' fontWeight='bold'>
              İşe Bağlı Görev Puanlarım
            </Typography>
          </Box>

          <Typography
            variant='h3'
            sx={{ color: '#FF9800', fontWeight: 'bold', mb: 2 }}
          >
            {workTaskToplamPuan || 0}
          </Typography>

          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant='body1' color='text.secondary' sx={{ mb: 1 }}>
              Bu Ay Toplam
            </Typography>
            <Typography variant='body2' fontWeight='bold'>
              {workTaskScores?.length || 0} görev
            </Typography>
            <Typography
              variant='caption'
              color='text.secondary'
              sx={{ mt: 1, display: 'block' }}
            >
              Tamamladığım görevlere verilen puanlar
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
};

/**
 * Checklist Şablonları Kartı
 */
export const ChecklistTemplateScoreCard = ({
  kontrolToplamPuan,
  checklistSablonlari,
}) => {
  return (
    <Grid item xs={12} md={6}>
      <Card sx={{ height: '100%', position: 'relative' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ChecklistIcon sx={{ mr: 1, color: '#795548' }} />
            <Typography variant='h6' fontWeight='bold'>
              Checklist Puanlarım
            </Typography>
          </Box>

          <Typography
            variant='h3'
            sx={{ color: '#795548', fontWeight: 'bold', mb: 2 }}
          >
            {kontrolToplamPuan || 0}
          </Typography>

          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant='body1' color='text.secondary' sx={{ mb: 1 }}>
              Bu Ay Toplam
            </Typography>
            <Typography variant='body2' fontWeight='bold'>
              {checklistSablonlari?.gorevSayisi || 0} görev
            </Typography>
            <Typography
              variant='caption'
              color='text.secondary'
              sx={{ mt: 1, display: 'block' }}
            >
              Rutin görevlere verilen puanlar
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
};

/**
 * Genel Toplam Kartı
 */
export const GrandTotalCard = ({ duzeltilmisGenelToplam }) => {
  return (
    <Grid item xs={12}>
      <Card
        sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TrophyIcon sx={{ mr: 1, color: 'white' }} />
            <Typography variant='h6' fontWeight='bold' color='white'>
              Genel Toplam
            </Typography>
          </Box>

          <Typography
            variant='h2'
            color='white'
            fontWeight='bold'
            sx={{ mb: 2 }}
          >
            {duzeltilmisGenelToplam.tumPuanlar || 0}
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant='h4' color='white' fontWeight='bold'>
                  {duzeltilmisGenelToplam.tumGorevler || 0}
                </Typography>
                <Typography variant='body2' color='rgba(255,255,255,0.8)'>
                  Toplam Görev
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant='h4' color='white' fontWeight='bold'>
                  {duzeltilmisGenelToplam.ortalamaPuan?.toFixed(1) || '0.0'}
                </Typography>
                <Typography variant='body2' color='rgba(255,255,255,0.8)'>
                  Ortalama Puan
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant='h4' color='white' fontWeight='bold'>
                  %
                  {((duzeltilmisGenelToplam.ortalamaPuan || 0) * 10).toFixed(0)}
                </Typography>
                <Typography variant='body2' color='rgba(255,255,255,0.8)'>
                  Başarı Oranı
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant='determinate'
              value={Math.min(
                (duzeltilmisGenelToplam.ortalamaPuan || 0) * 10,
                100,
              )}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.3)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 'white',
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
};
