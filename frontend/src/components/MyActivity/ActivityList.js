import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  CircularProgress,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import {
  getCategoryColor,
  getDurumColor,
  getDurumText,
  formatDate,
} from '../../utils/myActivityHelpers';

const ActivityList = ({
  activities,
  loading,
  pagination,
  filters: _filters, // eslint-disable-line no-unused-vars
  onFilterChange,
  onPageChange,
  onShowTaskDetails,
}) => {
  // ActivityList için özel filters state'i
  const [localFilters, setLocalFilters] = React.useState({
    durum: '',
    tarih: '',
  });

  const handleLocalFilterChange = (filterType, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
    // Ana component'e de bildir
    if (onFilterChange) {
      onFilterChange(filterType, value);
    }
  };
  return (
    <>
      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant='h6' sx={{ mb: 2 }}>
          Filtreler
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Durum</InputLabel>
              <Select
                value={localFilters.durum}
                label='Durum'
                onChange={e => handleLocalFilterChange('durum', e.target.value)}
              >
                <MenuItem value=''>Tümü</MenuItem>
                <MenuItem value='Tamamlandı'>Tamamlandı</MenuItem>
                <MenuItem value='Beklemede'>Beklemede</MenuItem>
                <MenuItem value='İptal'>İptal</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              type='date'
              label='Tarih'
              value={localFilters.tarih}
              onChange={e => handleLocalFilterChange('tarih', e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Activity List */}
      <Paper sx={{ p: 3 }}>
        <Typography variant='h6' sx={{ mb: 2 }}>
          Detaylı Aktiviteler
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {activities.map((activity, index) => (
              <Card
                key={`${activity.tip || 'activity'}_${activity._id}_${index}`}
                sx={{ mb: 2 }}
              >
                <CardContent>
                  <Grid container spacing={2} alignItems='center'>
                    <Grid item xs={12} md={6}>
                      <Typography variant='h6' gutterBottom>
                        {activity.checklist?.ad || activity.gorevAdi || 'Görev'}
                      </Typography>

                      {/* Checklist Detayları */}
                      <Box sx={{ mb: 2 }}>
                        {activity.makina && (
                          <Typography
                            variant='body2'
                            color='text.secondary'
                            sx={{ mb: 0.5 }}
                          >
                            <span role='img' aria-label='location'>
                              📍
                            </span>{' '}
                            Makina:{' '}
                            {activity.makina.ad || activity.makina.makinaNo}
                          </Typography>
                        )}

                        {activity.puanlayanKullanici && (
                          <Typography
                            variant='body2'
                            color='text.secondary'
                            sx={{ mb: 0.5 }}
                          >
                            <span role='img' aria-label='person'>
                              👤
                            </span>{' '}
                            Puanlayan: {activity.puanlayanKullanici.ad}{' '}
                            {activity.puanlayanKullanici.soyad}
                          </Typography>
                        )}

                        {/* WorkTask özel alanları */}
                        {activity.tip === 'worktask' && (
                          <>
                            {/* İnen Kalıp */}
                            {activity.indirilenKalip && (
                              <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{ mb: 0.5 }}
                              >
                                <span role='img' aria-label='down-arrow'>
                                  🔽
                                </span>{' '}
                                İnen Kalıp:{' '}
                                {activity.indirilenKalip.ad ||
                                  activity.indirilenKalip.envanterKodu}
                              </Typography>
                            )}

                            {/* Yazılan Kalıp */}
                            {activity.yazılanKalip && (
                              <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{ mb: 0.5 }}
                              >
                                <span role='img' aria-label='up-arrow'>
                                  🔼
                                </span>{' '}
                                Yazılan Kalıp:{' '}
                                {activity.yazılanKalip.ad ||
                                  activity.yazılanKalip.envanterKodu}
                              </Typography>
                            )}

                            {/* Makina Durma Saati */}
                            {activity.makinaDurmaSaati && (
                              <Typography
                                variant='body2'
                                color='warning.main'
                                sx={{ mb: 0.5 }}
                              >
                                <span role='img' aria-label='stop'>
                                  ⏹️
                                </span>{' '}
                                Makina Durma:{' '}
                                {new Date(
                                  activity.makinaDurmaSaati,
                                ).toLocaleString('tr-TR')}
                              </Typography>
                            )}

                            {/* Makina Başlatma Saati */}
                            {activity.yeniKalipAktifSaati && (
                              <Typography
                                variant='body2'
                                color='success.main'
                                sx={{ mb: 0.5 }}
                              >
                                <span role='img' aria-label='start'>
                                  ▶️
                                </span>{' '}
                                Makina Başlatma:{' '}
                                {new Date(
                                  activity.yeniKalipAktifSaati,
                                ).toLocaleString('tr-TR')}
                              </Typography>
                            )}
                          </>
                        )}

                        {/* Buddy Bilgisi */}
                        {activity.isBuddy && activity.anaKullanici && (
                          <Typography
                            variant='body2'
                            color='warning.main'
                            sx={{ mb: 0.5, fontWeight: 'medium' }}
                          >
                            <span role='img' aria-label='buddy'>
                              🤝
                            </span>{' '}
                            Buddy Görevi: {activity.anaKullanici.ad}{' '}
                            {activity.anaKullanici.soyad} ile birlikte
                          </Typography>
                        )}

                        {/* Ana Kullanıcı olduğunda buddy bilgisi */}
                        {!activity.isBuddy && activity.buddyKullanici && (
                          <Typography
                            variant='body2'
                            color='info.main'
                            sx={{ mb: 0.5, fontWeight: 'medium' }}
                          >
                            <span role='img' aria-label='buddy'>
                              👥
                            </span>{' '}
                            Buddy: {activity.buddyKullanici.ad}{' '}
                            {activity.buddyKullanici.soyad}
                          </Typography>
                        )}

                        {activity.kontrolTarihi && (
                          <Typography
                            variant='body2'
                            color='text.secondary'
                            sx={{ mb: 0.5 }}
                          >
                            <span role='img' aria-label='calendar'>
                              📅
                            </span>{' '}
                            Puanlama Tarihi:{' '}
                            {formatDate(activity.kontrolTarihi)}
                          </Typography>
                        )}

                        {activity.onaylayan && (
                          <Typography
                            variant='body2'
                            color='text.secondary'
                            sx={{ mb: 0.5 }}
                          >
                            <span role='img' aria-label='check'>
                              ✅
                            </span>{' '}
                            Onaylayan: {activity.onaylayan.ad}{' '}
                            {activity.onaylayan.soyad}
                          </Typography>
                        )}

                        {/* Kalite Kontrol özel alanları */}
                        {activity.tip === 'quality_control' && (
                          <>
                            {activity.kalip && (
                              <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{ mb: 0.5 }}
                              >
                                <span role='img' aria-label='tool'>
                                  🔧
                                </span>{' '}
                                Kalıp:{' '}
                                {activity.kalip.ad ||
                                  activity.kalip.envanterKodu}
                              </Typography>
                            )}
                            {activity.hammadde && (
                              <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{ mb: 0.5 }}
                              >
                                <span role='img' aria-label='material'>
                                  📦
                                </span>{' '}
                                Hammadde: {activity.hammadde}
                              </Typography>
                            )}
                            {activity.vardiya && (
                              <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{ mb: 0.5 }}
                              >
                                <span role='img' aria-label='time'>
                                  ⏰
                                </span>{' '}
                                Vardiya: {activity.vardiya}
                              </Typography>
                            )}
                            {activity.basariYuzdesi && (
                              <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{ mb: 0.5 }}
                              >
                                <span role='img' aria-label='percent'>
                                  📊
                                </span>{' '}
                                Başarı: %{activity.basariYuzdesi}
                              </Typography>
                            )}
                          </>
                        )}

                        {/* İK özel alanları */}
                        {activity.tip?.startsWith('hr_') && (
                          <>
                            {activity.maksimumPuan && (
                              <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{ mb: 0.5 }}
                              >
                                <span role='img' aria-label='max'>
                                  🎯
                                </span>{' '}
                                Maksimum Puan: {activity.maksimumPuan}
                              </Typography>
                            )}
                          </>
                        )}

                        {/* Bonus Evaluation özel alanları */}
                        {activity.tip === 'bonus_evaluation' && (
                          <>
                            {activity.bonusKategorisi && (
                              <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{ mb: 0.5 }}
                              >
                                <span role='img' aria-label='category'>
                                  🏷️
                                </span>{' '}
                                Bonus Kategorisi: {activity.bonusKategorisi}
                              </Typography>
                            )}
                            {activity.basariYuzdesi && (
                              <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{ mb: 0.5 }}
                              >
                                <span role='img' aria-label='percent'>
                                  📊
                                </span>{' '}
                                Başarı: %{activity.basariYuzdesi}
                              </Typography>
                            )}
                            {activity.bonusHakEdilenMi !== undefined && (
                              <Typography
                                variant='body2'
                                color={
                                  activity.bonusHakEdilenMi
                                    ? 'success.main'
                                    : 'error.main'
                                }
                                sx={{ mb: 0.5 }}
                              >
                                <span role='img' aria-label='bonus'>
                                  {activity.bonusHakEdilenMi ? '🎁' : '❌'}
                                </span>{' '}
                                Bonus:{' '}
                                {activity.bonusHakEdilenMi
                                  ? 'Hak Edildi'
                                  : 'Hak Edilmedi'}
                              </Typography>
                            )}
                            {activity.departman?.ad && (
                              <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{ mb: 0.5 }}
                              >
                                <span role='img' aria-label='department'>
                                  🏢
                                </span>{' '}
                                Departman: {activity.departman.ad}
                              </Typography>
                            )}
                          </>
                        )}

                        {/* Control Pending özel alanları */}
                        {activity.tip === 'control_pending' && (
                          <>
                            {activity.isPuanlandi && (
                              <Typography
                                variant='body2'
                                color='success.main'
                                sx={{ mb: 0.5 }}
                              >
                                <span role='img' aria-label='scored'>
                                  ✅
                                </span>{' '}
                                Durum: Puanlandı
                              </Typography>
                            )}
                            {activity.kontrolDurumu && (
                              <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{ mb: 0.5 }}
                              >
                                <span role='img' aria-label='status'>
                                  📋
                                </span>{' '}
                                Kontrol: {activity.kontrolDurumu}
                              </Typography>
                            )}
                          </>
                        )}

                        {/* Control Score özel alanları */}
                        {activity.tip === 'control_score' && (
                          <>
                            {activity.puanlananKullanici && (
                              <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{ mb: 0.5 }}
                              >
                                <span role='img' aria-label='user'>
                                  👤
                                </span>{' '}
                                Puanlanan: {activity.puanlananKullanici.ad}{' '}
                                {activity.puanlananKullanici.soyad}
                              </Typography>
                            )}
                            {activity.gorevTipi && (
                              <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{ mb: 0.5 }}
                              >
                                <span role='img' aria-label='type'>
                                  📋
                                </span>{' '}
                                Görev Tipi:{' '}
                                {activity.gorevTipi === 'WorkTask'
                                  ? 'İşe Bağlı Görev'
                                  : activity.gorevTipi === 'Task'
                                    ? 'Rutin Checklist'
                                    : activity.gorevTipi}
                              </Typography>
                            )}
                            {activity.sablonAdi && (
                              <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{ mb: 0.5 }}
                              >
                                <span role='img' aria-label='template'>
                                  🎯
                                </span>{' '}
                                Şablon: {activity.sablonAdi}
                              </Typography>
                            )}
                            {activity.aciklama && (
                              <Typography
                                variant='body2'
                                color='text.secondary'
                                sx={{ mb: 0.5 }}
                              >
                                <span role='img' aria-label='description'>
                                  📝
                                </span>{' '}
                                Açıklama: {activity.aciklama}
                              </Typography>
                            )}
                          </>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={
                            activity.checklist?.kategori ||
                            activity.kategori ||
                            'Genel'
                          }
                          size='small'
                          sx={{
                            bgcolor: getCategoryColor(
                              activity.checklist?.kategori || activity.kategori,
                            ),
                            color: 'white',
                          }}
                        />
                        <Chip
                          label={getDurumText(activity.durum)}
                          color={getDurumColor(activity.durum)}
                          size='small'
                        />
                        {activity.tip && (
                          <Chip
                            label={
                              activity.tip === 'checklist'
                                ? 'Rutin Checklist'
                                : activity.tip === 'worktask'
                                  ? activity.isBuddy
                                    ? 'İşe Bağlı Görev (Buddy)'
                                    : 'İşe Bağlı Görev'
                                  : activity.tip === 'quality_control'
                                    ? 'Kalite Kontrol'
                                    : activity.tip === 'hr_checklist'
                                      ? 'İK Checklist'
                                      : activity.tip === 'hr_mesai'
                                        ? 'İK Mesai'
                                        : activity.tip === 'hr_devamsizlik'
                                          ? 'İK Devamsızlık'
                                          : activity.tip === 'bonus_evaluation'
                                            ? 'Bonus Değerlendirme'
                                            : activity.tip === 'control_pending'
                                              ? 'Kontrol Puanları'
                                              : activity.tip === 'control_score'
                                                ? 'Kontrol Puanı (Verilen)'
                                                : 'Diğer'
                            }
                            variant='outlined'
                            size='small'
                            color={
                              activity.tip === 'checklist'
                                ? 'primary'
                                : activity.tip === 'worktask'
                                  ? activity.isBuddy
                                    ? 'warning' // Buddy için farklı renk
                                    : 'secondary'
                                  : activity.tip === 'quality_control'
                                    ? 'info'
                                    : activity.tip?.startsWith('hr_')
                                      ? 'warning'
                                      : activity.tip === 'bonus_evaluation'
                                        ? 'success'
                                        : activity.tip === 'control_pending'
                                          ? 'info'
                                          : activity.tip === 'control_score'
                                            ? 'error' // Kontrol puanı için kırmızı
                                            : 'default'
                            }
                          />
                        )}
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <CalendarIcon sx={{ color: 'text.secondary', mb: 1 }} />
                        <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                          Tamamlanma:{' '}
                          {formatDate(
                            activity.tamamlanmaTarihi || activity.tarih,
                          )}
                        </Typography>

                        {/* Puan Bilgisi */}
                        {(activity.kontrolToplamPuani || activity.puan) && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant='h6' color='primary'>
                              {activity.kontrolToplamPuani || activity.puan}{' '}
                              Puan
                            </Typography>
                            {/* Maksimum puan gösterimi */}
                            {activity.checklist?.maddeler &&
                              activity.checklist.maddeler.length > 0 && (
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                >
                                  /{' '}
                                  {activity.checklist.maddeler.reduce(
                                    (total, madde) =>
                                      total +
                                      (madde.puan || madde.maksimumPuan || 0),
                                    0,
                                  )}{' '}
                                  Maksimum
                                </Typography>
                              )}
                            {activity.maksimumPuan && (
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                / {activity.maksimumPuan} Maksimum
                              </Typography>
                            )}
                            {/* Başarı yüzdesi */}
                            {activity.basariYuzdesi && (
                              <Typography
                                variant='caption'
                                color='success.main'
                                sx={{ display: 'block' }}
                              >
                                (%{activity.basariYuzdesi} başarı)
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Button
                          variant='outlined'
                          startIcon={<VisibilityIcon />}
                          onClick={() => onShowTaskDetails(activity._id)}
                          size='small'
                          fullWidth
                        >
                          Detay Görüntüle
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {pagination?.toplamSayfa > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={pagination.toplamSayfa}
                  page={pagination.mevcutSayfa}
                  onChange={(event, page) => onPageChange?.(page)}
                  color='primary'
                  size='large'
                />
              </Box>
            )}

            {activities.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant='h6' color='text.secondary'>
                  Henüz aktivite bulunamadı
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Filtre ayarlarınızı değiştirerek tekrar deneyin
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>
    </>
  );
};

export default ActivityList;
