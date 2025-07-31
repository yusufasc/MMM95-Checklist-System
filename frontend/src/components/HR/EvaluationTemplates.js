import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  Paper,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  People as PeopleIcon,
} from '@mui/icons-material';

const EvaluationTemplates = ({
  templates,
  hrYetkileri,
  onTemplateEvaluate,
}) => {
  // Debug log
  console.log('🔍 EvaluationTemplates Debug:', {
    hrYetkileri,
    puanlamaYapabilir: hrYetkileri?.puanlamaYapabilir,
    templatesCount: templates?.length,
    templates: templates?.map(t => ({ id: t._id, ad: t.ad, aktif: t.aktif })),
  });

  if (!hrYetkileri?.puanlamaYapabilir) {
    return (
      <Alert severity='warning'>
        Puanlama yapma yetkisine sahip değilsiniz.
        <br />
        Debug: {JSON.stringify(hrYetkileri)}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant='h6' component='h2' sx={{ mb: 3 }}>
        Puanlama Şablonları
      </Typography>

      {templates.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography color='text.secondary'>
            Henüz aktif puanlama şablonu bulunmamaktadır.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {templates.map(template => (
            <Grid item xs={12} md={6} lg={4} key={template._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AssessmentIcon
                      color='primary'
                      sx={{ mr: 1, fontSize: 24 }}
                    />
                    <Typography variant='h6' component='h3' sx={{ flex: 1 }}>
                      {template.ad}
                    </Typography>
                  </Box>

                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mb: 2, minHeight: 40 }}
                  >
                    {template.aciklama || 'Açıklama bulunmamaktadır.'}
                  </Typography>

                  <Box
                    sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}
                  >
                    <Chip
                      icon={<PeopleIcon />}
                      label={`${template.maddeler?.length || 0} Madde`}
                      size='small'
                      color='primary'
                      variant='outlined'
                    />
                    <Chip
                      label={template.aktif ? 'Aktif' : 'Pasif'}
                      size='small'
                      color={template.aktif ? 'success' : 'default'}
                    />
                  </Box>

                  {template.maddeler && template.maddeler.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='body2'
                        sx={{ fontWeight: 'medium', mb: 1 }}
                      >
                        Değerlendirme Maddeleri:
                      </Typography>
                      <Box sx={{ maxHeight: 100, overflow: 'auto' }}>
                        {template.maddeler.slice(0, 3).map((madde, index) => (
                          <Typography
                            key={index}
                            variant='caption'
                            sx={{ display: 'block', color: 'text.secondary' }}
                          >
                            • {madde.baslik}
                          </Typography>
                        ))}
                        {template.maddeler.length > 3 && (
                          <Typography
                            variant='caption'
                            sx={{
                              color: 'text.secondary',
                              fontStyle: 'italic',
                            }}
                          >
                            +{template.maddeler.length - 3} madde daha...
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                </CardContent>

                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant='contained'
                    startIcon={<AssessmentIcon />}
                    onClick={() => onTemplateEvaluate(template)}
                    disabled={!template.aktif}
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      background: template.aktif
                        ? 'linear-gradient(45deg, #1976d2, #42a5f5)'
                        : undefined,
                    }}
                  >
                    Puanlama Yap
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default EvaluationTemplates;
