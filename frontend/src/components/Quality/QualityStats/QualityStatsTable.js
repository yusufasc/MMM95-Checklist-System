import React from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Box,
  IconButton,
  Chip,
  Collapse,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Visibility as VisibilityIcon,
  ExpandLess as ExpandLessIcon,
  Star as StarIcon,
  Category as CategoryIcon,
  Build as BuildIcon,
  Note as NoteIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import {
  formatDate,
  formatScore,
  getPerformanceColor,
  getPerformanceLabel,
  getStatusChipConfig,
  TABLE_COLUMNS,
  ROWS_PER_PAGE_OPTIONS,
} from '../../../utils/qualityStatsConfig';

// Evaluation Detail Component
const EvaluationDetail = ({ evaluation }) => (
  <Box sx={{ margin: 2 }}>
    <Paper
      sx={{
        p: 3,
        bgcolor: 'grey.50',
        borderRadius: 2,
      }}
    >
      <Typography
        variant='h6'
        gutterBottom
        sx={{
          color: 'primary.main',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <StarIcon sx={{ mr: 1 }} />
        Değerlendirme Detayları
      </Typography>

      <Grid container spacing={3}>
        {/* Genel Bilgiler */}
        <Grid item xs={12} md={6}>
          <Card variant='outlined' sx={{ height: '100%' }}>
            <CardContent>
              <Typography
                variant='subtitle1'
                fontWeight='bold'
                gutterBottom
                sx={{
                  color: 'secondary.main',
                  display: 'flex',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <AssignmentIcon sx={{ mr: 1, fontSize: 20 }} />
                Genel Bilgiler
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <StarIcon
                    sx={{
                      mr: 1,
                      color: 'warning.main',
                      fontSize: 16,
                    }}
                  />
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ minWidth: 80 }}
                  >
                    Vardiya:
                  </Typography>
                  <Typography variant='body2' fontWeight='medium'>
                    {evaluation.vardiya || '-'}
                  </Typography>
                </Box>

                {evaluation.kalip && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CategoryIcon
                      sx={{
                        mr: 1,
                        color: 'info.main',
                        fontSize: 16,
                      }}
                    />
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{ minWidth: 80 }}
                    >
                      Kalıp:
                    </Typography>
                    <Typography variant='body2' fontWeight='medium'>
                      {evaluation.kalip?.kod && evaluation.kalip?.ad
                        ? `${evaluation.kalip.kod} - ${evaluation.kalip.ad}`
                        : evaluation.kalip?.kod ||
                          evaluation.kalip?.ad ||
                          'Kalıp bilgisi eksik'}
                    </Typography>
                  </Box>
                )}

                {evaluation.hammadde && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BuildIcon
                      sx={{
                        mr: 1,
                        color: 'success.main',
                        fontSize: 16,
                      }}
                    />
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{ minWidth: 80 }}
                    >
                      Hammadde:
                    </Typography>
                    <Typography variant='body2' fontWeight='medium'>
                      {evaluation.hammadde}
                    </Typography>
                  </Box>
                )}

                {evaluation.notlar && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <NoteIcon
                      sx={{
                        mr: 1,
                        color: 'warning.main',
                        fontSize: 16,
                        mt: 0.2,
                      }}
                    />
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Notlar:
                      </Typography>
                      <Typography
                        variant='body2'
                        fontWeight='medium'
                        sx={{
                          bgcolor: 'warning.50',
                          p: 1,
                          borderRadius: 1,
                          mt: 0.5,
                          fontStyle: 'italic',
                        }}
                      >
                        {evaluation.notlar}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Puanlama Detayları */}
        <Grid item xs={12} md={6}>
          <Card variant='outlined' sx={{ height: '100%' }}>
            <CardContent>
              <Typography
                variant='subtitle1'
                fontWeight='bold'
                gutterBottom
                sx={{
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <StarIcon sx={{ mr: 1, fontSize: 20 }} />
                Puanlama Özeti
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <Typography variant='body2' color='text.secondary'>
                    Toplam Başarı
                  </Typography>
                  <Typography
                    variant='h6'
                    fontWeight='bold'
                    color='primary.main'
                  >
                    {evaluation.basariYuzdesi}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant='determinate'
                  value={evaluation.basariYuzdesi}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getPerformanceColor(
                        evaluation.basariYuzdesi,
                      ),
                      borderRadius: 4,
                    },
                  }}
                />
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mt: 1,
                  }}
                >
                  <Typography variant='caption' color='text.secondary'>
                    {formatScore(
                      evaluation.toplamPuan,
                      evaluation.maksimumPuan,
                    )}{' '}
                    puan
                  </Typography>
                  <Chip
                    label={getPerformanceLabel(evaluation.basariYuzdesi)}
                    size='small'
                    sx={{
                      backgroundColor: getPerformanceColor(
                        evaluation.basariYuzdesi,
                      ),
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '0.7rem',
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Madde Bazlı Puanlamalar */}
        <Grid item xs={12}>
          <Card variant='outlined'>
            <CardContent>
              <Typography
                variant='subtitle1'
                fontWeight='bold'
                gutterBottom
                sx={{
                  color: 'success.main',
                  display: 'flex',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <CheckCircleIcon sx={{ mr: 1, fontSize: 20 }} />
                Madde Bazlı Puanlamalar ({evaluation.puanlamalar?.length || 0})
              </Typography>

              {evaluation.puanlamalar && evaluation.puanlamalar.length > 0 ? (
                <Grid container spacing={2}>
                  {evaluation.puanlamalar.map((puanlama, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Paper
                        sx={{
                          p: 2,
                          bgcolor:
                            puanlama.puan === puanlama.maksimumPuan
                              ? 'success.50'
                              : 'warning.50',
                          border: '1px solid',
                          borderColor:
                            puanlama.puan === puanlama.maksimumPuan
                              ? 'success.200'
                              : 'warning.200',
                          borderRadius: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant='body2'
                            fontWeight='bold'
                            sx={{
                              color:
                                puanlama.puan === puanlama.maksimumPuan
                                  ? 'success.dark'
                                  : 'warning.dark',
                            }}
                          >
                            #{index + 1}
                          </Typography>
                          <Chip
                            label={formatScore(
                              puanlama.puan,
                              puanlama.maksimumPuan,
                            )}
                            size='small'
                            color={
                              puanlama.puan === puanlama.maksimumPuan
                                ? 'success'
                                : 'warning'
                            }
                            sx={{ fontWeight: 'bold' }}
                          />
                        </Box>
                        <Typography
                          variant='body2'
                          sx={{
                            fontWeight: 'medium',
                            mb: 1,
                            lineHeight: 1.4,
                          }}
                        >
                          {puanlama.maddeBaslik}
                        </Typography>
                        {puanlama.aciklama && (
                          <Typography
                            variant='caption'
                            sx={{
                              color: 'text.secondary',
                              fontStyle: 'italic',
                              display: 'block',
                              bgcolor: 'rgba(255,255,255,0.7)',
                              p: 0.5,
                              borderRadius: 1,
                            }}
                          >
                            {puanlama.aciklama}
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity='info' sx={{ mt: 1 }}>
                  Bu değerlendirme için detaylı puanlama bilgisi bulunmuyor.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  </Box>
);

// Main Table Component
const QualityStatsTable = ({
  loading,
  evaluations,
  paginatedEvaluations,
  page,
  rowsPerPage,
  expandedRow,
  onChangePage,
  onChangeRowsPerPage,
  onRowExpand,
}) => {
  return (
    <Paper sx={{ mb: 3 }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {TABLE_COLUMNS.map(column => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={TABLE_COLUMNS.length}
                  align='center'
                  sx={{ py: 4 }}
                >
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : paginatedEvaluations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={TABLE_COLUMNS.length}
                  align='center'
                  sx={{ py: 4 }}
                >
                  <Alert severity='info'>
                    Seçilen kriterlere uygun değerlendirme bulunamadı.
                  </Alert>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {paginatedEvaluations.map(evaluation => (
                  <React.Fragment key={evaluation._id}>
                    <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
                      {/* Tarih */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ScheduleIcon
                            sx={{
                              mr: 1,
                              color: 'text.secondary',
                              fontSize: 16,
                            }}
                          />
                          {formatDate(evaluation.degerlendirmeTarihi)}
                        </Box>
                      </TableCell>

                      {/* Değerlendirilen */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon
                            sx={{
                              mr: 1,
                              color: 'primary.main',
                              fontSize: 16,
                            }}
                          />
                          {evaluation.degerlendirilenKullanici?.ad}{' '}
                          {evaluation.degerlendirilenKullanici?.soyad}
                        </Box>
                      </TableCell>

                      {/* Değerlendiren */}
                      <TableCell>
                        {evaluation.degerlendirenKullanici?.ad}{' '}
                        {evaluation.degerlendirenKullanici?.soyad}
                      </TableCell>

                      {/* Şablon */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AssignmentIcon
                            sx={{
                              mr: 1,
                              color: 'secondary.main',
                              fontSize: 16,
                            }}
                          />
                          {evaluation.sablon?.ad}
                        </Box>
                      </TableCell>

                      {/* Makina */}
                      <TableCell>
                        {evaluation.makina
                          ? `${evaluation.makina.kod} - ${evaluation.makina.ad}`
                          : '-'}
                      </TableCell>

                      {/* Puan */}
                      <TableCell>
                        <Typography variant='body2' fontWeight='bold'>
                          {formatScore(
                            evaluation.toplamPuan,
                            evaluation.maksimumPuan,
                          )}
                        </Typography>
                      </TableCell>

                      {/* Başarı % */}
                      <TableCell>
                        <Chip
                          label={`${evaluation.basariYuzdesi}%`}
                          size='small'
                          sx={{
                            backgroundColor: getPerformanceColor(
                              evaluation.basariYuzdesi,
                            ),
                            color: 'white',
                            fontWeight: 'bold',
                          }}
                        />
                      </TableCell>

                      {/* Durum */}
                      <TableCell>
                        <Chip
                          label={evaluation.durum}
                          size='small'
                          {...getStatusChipConfig(evaluation.durum)}
                        />
                      </TableCell>

                      {/* Detay Button */}
                      <TableCell align='center'>
                        <IconButton
                          size='small'
                          onClick={() => onRowExpand(evaluation._id)}
                          sx={{
                            color:
                              expandedRow === evaluation._id
                                ? 'primary.main'
                                : 'text.secondary',
                            backgroundColor:
                              expandedRow === evaluation._id
                                ? 'primary.50'
                                : 'transparent',
                            '&:hover': {
                              backgroundColor: 'primary.100',
                            },
                          }}
                        >
                          {expandedRow === evaluation._id ? (
                            <ExpandLessIcon />
                          ) : (
                            <VisibilityIcon />
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>

                    {/* Detay Satırı */}
                    <TableRow>
                      <TableCell
                        style={{ paddingBottom: 0, paddingTop: 0 }}
                        colSpan={TABLE_COLUMNS.length}
                      >
                        <Collapse
                          in={expandedRow === evaluation._id}
                          timeout='auto'
                          unmountOnExit
                        >
                          <EvaluationDetail evaluation={evaluation} />
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component='div'
        count={evaluations.length}
        page={page}
        onPageChange={onChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onChangeRowsPerPage}
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        labelRowsPerPage='Sayfa başına kayıt:'
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
      />
    </Paper>
  );
};

// PropTypes
EvaluationDetail.propTypes = {
  evaluation: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    basariYuzdesi: PropTypes.number.isRequired,
    toplamPuan: PropTypes.number.isRequired,
    maksimumPuan: PropTypes.number.isRequired,
    vardiya: PropTypes.string,
    hammadde: PropTypes.string,
    notlar: PropTypes.string,
    kalip: PropTypes.shape({
      kod: PropTypes.string,
      ad: PropTypes.string,
    }),
    puanlamalar: PropTypes.arrayOf(
      PropTypes.shape({
        puan: PropTypes.number.isRequired,
        maksimumPuan: PropTypes.number.isRequired,
        maddeBaslik: PropTypes.string.isRequired,
        aciklama: PropTypes.string,
      }),
    ),
  }).isRequired,
};

QualityStatsTable.propTypes = {
  loading: PropTypes.bool.isRequired,
  evaluations: PropTypes.array.isRequired,
  paginatedEvaluations: PropTypes.array.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  expandedRow: PropTypes.string,
  onChangePage: PropTypes.func.isRequired,
  onChangeRowsPerPage: PropTypes.func.isRequired,
  onRowExpand: PropTypes.func.isRequired,
};

export default QualityStatsTable;
