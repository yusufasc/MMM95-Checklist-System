import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  LinearProgress,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Fade,
  Zoom,
  Collapse,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  Analytics as AnalyticsIcon,
  CompareArrows as CompareIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

// Custom hooks ve utilities
import { useScoreBreakdownData } from '../../hooks/useScoreBreakdownData';
import {
  calculateIKTotalScore,
  calculateWorkTaskTotalScore,
  calculateQualityControlTotalScore,
  calculateBonusTotalScore,
  calculateControlScore,
  calculateControlCardScore,
  calculateTotalTaskCount,
  calculateGrandTotal,
} from '../../utils/scoreCalculations';

/**
 * Modern & Innovative ScoreBreakdown Component
 *
 * Yeni Özellikler:
 * - Interactive Dashboard Layout
 * - Performance Analytics
 * - Trend Analysis
 * - Gamification Elements
 * - Advanced Visualizations
 * - Mobile-First Design
 */
const ScoreBreakdown = ({
  loading: _parentLoading,
  error: parentError,
  filters,
  monthlyTotals: parentMonthlyTotals,
  onFilterChange,
  onRefresh,
}) => {
  // State management
  const [viewMode, setViewMode] = useState('dashboard'); // dashboard, analytics, comparison
  const [expandedCards, setExpandedCards] = useState({});

  // Custom hook ile veri yönetimi
  const {
    monthlyTotals: hookMonthlyTotals,
    hrScores,
    workTaskScores,
    bonusEvaluations,
    qualityScores,
    controlSummary,
    loading,
    error,
    controlError,
    refreshAllData,
    selectedMonth,
    selectedYear,
  } = useScoreBreakdownData(filters);

  // Parent'dan gelen monthlyTotals'ı öncelikle kullan
  const monthlyData = parentMonthlyTotals || hookMonthlyTotals;

  // Güvenli destructuring
  const {
    ik = { toplam: 0, gorevSayisi: 0 },
    kaliteKontrol = { toplamPuan: 0, gorevSayisi: 0 },
    workTask = { toplamPuan: 0, gorevSayisi: 0 },
    checklistSablonlari = { toplam: 0, gorevSayisi: 0 },
    kontrol = { toplamPuan: 0, gorevSayisi: 0 },
    genelToplam = { tumPuanlar: 0, tumGorevler: 0, ortalamaPuan: 0 },
  } = monthlyData || {};

  // Puan hesaplamaları
  const ikToplamPuan = calculateIKTotalScore(hrScores, ik);
  const workTaskToplamPuan = calculateWorkTaskTotalScore(
    workTaskScores,
    workTask,
    checklistSablonlari,
  );
  const kaliteKontrolToplamPuan = calculateQualityControlTotalScore(
    qualityScores,
    kaliteKontrol,
  );
  const bonusToplamPuan = calculateBonusTotalScore(bonusEvaluations);
  const kontrolToplamPuan = calculateControlScore(checklistSablonlari, kontrol);
  const kontrolKartiPuani = calculateControlCardScore(controlSummary);
  const toplamGorevSayisi = calculateTotalTaskCount({
    hrScores,
    qualityScores,
    workTaskScores,
    bonusEvaluations,
    ik,
    kaliteKontrol,
    workTask,
    kontrol,
    checklistSablonlari,
    controlSummary,
  });
  const duzeltilmisGenelToplam = calculateGrandTotal({
    ikToplamPuan,
    kaliteKontrolToplamPuan,
    workTaskToplamPuan,
    kontrolToplamPuan,
    kontrolKartiPuani,
    bonusToplamPuan,
    toplamGorevSayisi,
    genelToplam,
  });

  // Performance metrics
  const performanceLevel =
    duzeltilmisGenelToplam.ortalamaPuan >= 8
      ? 'excellent'
      : duzeltilmisGenelToplam.ortalamaPuan >= 6
        ? 'good'
        : duzeltilmisGenelToplam.ortalamaPuan >= 4
          ? 'average'
          : 'needs-improvement';

  const performanceColor = {
    excellent: '#4CAF50',
    good: '#2196F3',
    average: '#FF9800',
    'needs-improvement': '#F44336',
  }[performanceLevel];

  const performanceText = {
    excellent: 'Mükemmel',
    good: 'İyi',
    average: 'Orta',
    'needs-improvement': 'Geliştirilmeli',
  }[performanceLevel];

  // Score categories for analytics
  const scoreCategories = [
    {
      name: 'İK Puanları',
      value: ikToplamPuan,
      color: '#2196F3',
      icon: '👥',
      tasks: hrScores?.length || 0,
    },
    {
      name: 'Kalite Kontrol',
      value: kaliteKontrolToplamPuan,
      color: '#9C27B0',
      icon: '🔬',
      tasks: qualityScores?.length || 0,
    },
    {
      name: 'İşe Bağlı Görevler',
      value: workTaskToplamPuan,
      color: '#FF9800',
      icon: '🔧',
      tasks: workTaskScores?.length || 0,
    },
    {
      name: 'Checklist Görevleri',
      value: kontrolToplamPuan,
      color: '#795548',
      icon: '📋',
      tasks: checklistSablonlari?.gorevSayisi || 0,
    },
    {
      name: 'Değerlendirme Puanları',
      value: bonusToplamPuan,
      color: '#E91E63',
      icon: '🎁',
      tasks: bonusEvaluations?.length || 0,
    },
    {
      name: 'Kontrol Puanları',
      value: kontrolKartiPuani,
      color: '#673AB7',
      icon: '🎯',
      tasks: controlSummary?.genel?.kontrolSayisi || 0,
    },
  ];

  // Event handlers
  const handleCardExpand = cardId => {
    setExpandedCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
    refreshAllData();
  };

  // Loading state
  if (loading) {
    return (
      <Card
        sx={{
          m: 2,
          p: 4,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Box sx={{ py: 4 }}>
          <SpeedIcon
            sx={{
              fontSize: 80,
              color: 'white',
              mb: 2,
              animation: 'spin 2s linear infinite',
            }}
          />
          <Typography variant='h5' color='white' gutterBottom>
            Performans Analizi Yükleniyor...
          </Typography>
          <LinearProgress
            sx={{
              mt: 2,
              width: '60%',
              mx: 'auto',
              '& .MuiLinearProgress-bar': { backgroundColor: 'white' },
            }}
          />
        </Box>
      </Card>
    );
  }

  // Error state
  if (error || parentError || controlError) {
    return (
      <Card
        sx={{ m: 2, p: 3, textAlign: 'center', border: '2px solid #f44336' }}
      >
        <Box sx={{ py: 4 }}>
          <AssessmentIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
          <Typography variant='h5' color='error.main' gutterBottom>
            Veri Yükleme Hatası
          </Typography>
          <Typography variant='body1' color='text.secondary' sx={{ mb: 2 }}>
            {error || parentError || controlError}
          </Typography>
          <Button
            variant='contained'
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Tekrar Dene
          </Button>
        </Box>
      </Card>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Modern Header with Glassmorphism */}
      <Card
        sx={{
          mb: 3,
          background:
            'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <CardContent>
          {/* Header Row */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: performanceColor, width: 56, height: 56 }}>
                <TrophyIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography
                  variant='h4'
                  fontWeight='bold'
                  sx={{
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Performans Dashboard
                </Typography>
                <Typography variant='subtitle1' color='text.secondary'>
                  {new Date(0, selectedMonth - 1).toLocaleDateString('tr-TR', {
                    month: 'long',
                  })}{' '}
                  {selectedYear} Dönemi
                </Typography>
              </Box>
            </Box>

            {/* Controls */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <FormControl size='small' sx={{ minWidth: 120 }}>
                <InputLabel>Ay</InputLabel>
                <Select
                  value={selectedMonth}
                  label='Ay'
                  onChange={e => onFilterChange?.('month', e.target.value)}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <MenuItem key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleDateString('tr-TR', {
                        month: 'long',
                      })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size='small' sx={{ minWidth: 100 }}>
                <InputLabel>Yıl</InputLabel>
                <Select
                  value={selectedYear}
                  label='Yıl'
                  onChange={e => onFilterChange?.('year', e.target.value)}
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              <Tooltip title='Verileri Yenile'>
                <IconButton
                  onClick={handleRefresh}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Performance Summary Bar */}
          <Paper
            sx={{
              p: 2,
              background: `linear-gradient(90deg, ${performanceColor}15 0%, ${performanceColor}05 100%)`,
              border: `1px solid ${performanceColor}30`,
            }}
          >
            <Grid container spacing={2} alignItems='center'>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant='h2'
                    sx={{ color: performanceColor, fontWeight: 'bold' }}
                  >
                    {duzeltilmisGenelToplam.tumPuanlar || 0}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Toplam Puan
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant='h3'
                    sx={{ color: performanceColor, fontWeight: 'bold' }}
                  >
                    {duzeltilmisGenelToplam.tumGorevler || 0}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Toplam Görev
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant='h3'
                    sx={{ color: performanceColor, fontWeight: 'bold' }}
                  >
                    {duzeltilmisGenelToplam.ortalamaPuan?.toFixed(1) || '0.0'}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Ortalama Puan
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Chip
                    label={performanceText}
                    sx={{
                      bgcolor: performanceColor,
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      height: 40,
                    }}
                    icon={<StarIcon sx={{ color: 'white !important' }} />}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* View Mode Toggles */}
          <Box
            sx={{
              mt: 2,
              display: 'flex',
              gap: 1,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {[
              { id: 'dashboard', label: 'Dashboard', icon: <AnalyticsIcon /> },
              { id: 'analytics', label: 'Analitik', icon: <TimelineIcon /> },
              {
                id: 'comparison',
                label: 'Karşılaştırma',
                icon: <CompareIcon />,
              },
            ].map(mode => (
              <Button
                key={mode.id}
                variant={viewMode === mode.id ? 'contained' : 'outlined'}
                startIcon={mode.icon}
                onClick={() => setViewMode(mode.id)}
                sx={{ borderRadius: 3 }}
              >
                {mode.label}
              </Button>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Dynamic Content Based on View Mode */}
      <Fade in timeout={500}>
        <Box>
          {viewMode === 'dashboard' && (
            <DashboardView
              scoreCategories={scoreCategories}
              expandedCards={expandedCards}
              onCardExpand={handleCardExpand}
            />
          )}
          {viewMode === 'analytics' && (
            <AnalyticsView scoreCategories={scoreCategories} />
          )}
          {viewMode === 'comparison' && (
            <ComparisonView scoreCategories={scoreCategories} />
          )}
        </Box>
      </Fade>
    </Box>
  );
};

// Dashboard View Component
const DashboardView = ({ scoreCategories, expandedCards, onCardExpand }) => (
  <Grid container spacing={3}>
    {scoreCategories.map(category => (
      <Grid item xs={12} sm={6} md={4} key={category.name}>
        <Zoom in timeout={300}>
          <Card
            sx={{
              height: '100%',
              background: `linear-gradient(135deg, ${category.color}15 0%, ${category.color}05 100%)`,
              border: `1px solid ${category.color}30`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 8px 25px ${category.color}40`,
              },
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  mb: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant='h4'>{category.icon}</Typography>
                  <Typography variant='h6' fontWeight='bold'>
                    {category.name}
                  </Typography>
                </Box>
                <IconButton
                  size='small'
                  onClick={() => onCardExpand(category.name)}
                >
                  {expandedCards[category.name] ? (
                    <ExpandLessIcon />
                  ) : (
                    <ExpandMoreIcon />
                  )}
                </IconButton>
              </Box>

              <Typography
                variant='h3'
                sx={{ color: category.color, fontWeight: 'bold', mb: 1 }}
              >
                {category.value || 0}
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant='body2' color='text.secondary'>
                  {category.tasks} görev
                </Typography>
                <Chip
                  size='small'
                  label={category.value > 0 ? 'Aktif' : 'Boş'}
                  color={category.value > 0 ? 'success' : 'default'}
                />
              </Box>

              <LinearProgress
                variant='determinate'
                value={Math.min((category.value / 100) * 100, 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: `${category.color}20`,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: category.color,
                  },
                }}
              />

              <Collapse in={expandedCards[category.name]}>
                <Box
                  sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}
                >
                  <Typography variant='body2' color='text.secondary'>
                    Bu kategoride {category.tasks} adet görev tamamlandı ve
                    toplam {category.value} puan kazanıldı.
                  </Typography>
                  {category.value > 0 && (
                    <Typography
                      variant='caption'
                      sx={{
                        color: category.color,
                        fontWeight: 'bold',
                        mt: 1,
                        display: 'block',
                      }}
                    >
                      Ortalama:{' '}
                      {category.tasks > 0
                        ? (category.value / category.tasks).toFixed(1)
                        : '0.0'}{' '}
                      puan/görev
                    </Typography>
                  )}
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        </Zoom>
      </Grid>
    ))}
  </Grid>
);

// Analytics View Component
const AnalyticsView = ({ scoreCategories }) => (
  <Grid container spacing={3}>
    <Grid item xs={12}>
      <Card
        sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <CardContent>
          <Typography
            variant='h5'
            color='white'
            fontWeight='bold'
            sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <TimelineIcon /> Performans Analizi
          </Typography>

          <Grid container spacing={3}>
            {scoreCategories.map(category => (
              <Grid item xs={12} sm={6} md={4} key={category.name}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <Typography variant='h4' sx={{ mb: 1 }}>
                    {category.icon}
                  </Typography>
                  <Typography variant='h6' color='white' fontWeight='bold'>
                    {category.name}
                  </Typography>
                  <Typography
                    variant='h4'
                    color='white'
                    fontWeight='bold'
                    sx={{ my: 1 }}
                  >
                    {category.value}
                  </Typography>
                  <Typography variant='body2' color='rgba(255,255,255,0.8)'>
                    {category.tasks} görev •{' '}
                    {category.tasks > 0
                      ? (category.value / category.tasks).toFixed(1)
                      : '0.0'}{' '}
                    ort.
                  </Typography>
                  <LinearProgress
                    variant='determinate'
                    value={Math.min(
                      (category.value /
                        Math.max(...scoreCategories.map(c => c.value))) *
                        100,
                      100,
                    )}
                    sx={{
                      mt: 1,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      '& .MuiLinearProgress-bar': { backgroundColor: 'white' },
                    }}
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
);

// Comparison View Component
const ComparisonView = ({ scoreCategories }) => {
  const maxScore = Math.max(...scoreCategories.map(c => c.value));

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography
              variant='h5'
              fontWeight='bold'
              sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <CompareIcon /> Kategori Karşılaştırması
            </Typography>

            {scoreCategories.map(category => (
              <Box key={category.name} sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant='h6'>{category.icon}</Typography>
                    <Typography variant='body1' fontWeight='bold'>
                      {category.name}
                    </Typography>
                  </Box>
                  <Typography
                    variant='h6'
                    sx={{ color: category.color, fontWeight: 'bold' }}
                  >
                    {category.value}
                  </Typography>
                </Box>
                <LinearProgress
                  variant='determinate'
                  value={maxScore > 0 ? (category.value / maxScore) * 100 : 0}
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: `${category.color}20`,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: category.color,
                      borderRadius: 6,
                    },
                  }}
                />
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ mt: 0.5, display: 'block' }}
                >
                  {category.tasks} görev • %
                  {maxScore > 0
                    ? ((category.value / maxScore) * 100).toFixed(1)
                    : '0'}{' '}
                  oranında
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ScoreBreakdown;
