import React from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Box,
  Typography,
  IconButton,
  Collapse,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  Button,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import {
  ALERT_MESSAGES,
  TEMPLATE_CARD_CONFIG,
} from '../../../utils/qualityEvaluationConfig';

const TemplateSelector = ({
  templates,
  selectedTemplate,
  expanded,
  onTemplateSelect,
  onToggleExpanded,
  onLoadDebugInfo,
}) => {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
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
          <AssignmentIcon sx={{ mr: 1 }} />
          Değerlendirme Şablonu
        </Typography>
        <IconButton>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography
                variant='h6'
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                Değerlendirme Şablonu Seçin
              </Typography>
              <IconButton onClick={onToggleExpanded}>
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            {templates.length === 0 ? (
              <Alert severity='warning'>
                <Typography variant='body1' sx={{ fontWeight: 'bold', mb: 1 }}>
                  {ALERT_MESSAGES.NO_TEMPLATES.title}
                </Typography>
                <Typography variant='body2' sx={{ mb: 2 }}>
                  Bu durumun nedenleri:
                </Typography>
                <Typography component='ul' variant='body2' sx={{ ml: 2 }}>
                  {ALERT_MESSAGES.NO_TEMPLATES.reasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </Typography>
                <Button
                  variant='outlined'
                  size='small'
                  onClick={onLoadDebugInfo}
                  sx={{ mt: 2 }}
                >
                  Şablon Durumunu Kontrol Et
                </Button>
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {templates.map(template => (
                  <Grid item xs={12} sm={6} key={template._id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        ...(selectedTemplate === template._id
                          ? TEMPLATE_CARD_CONFIG.selectedStyle
                          : TEMPLATE_CARD_CONFIG.defaultStyle),
                      }}
                      onClick={() => onTemplateSelect(template._id)}
                    >
                      <CardContent sx={{ py: 2 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Box>
                            <Typography variant='subtitle1' fontWeight='bold'>
                              {template.ad}
                            </Typography>
                            <Chip
                              label={template.rol.ad}
                              size='small'
                              color='primary'
                            />
                            <Typography
                              variant='caption'
                              display='block'
                              color='text.secondary'
                            >
                              {template.maddeler.length} madde -{' '}
                              {template.maddeler.reduce(
                                (sum, m) => sum + m.maksimumPuan,
                                0,
                              )}{' '}
                              puan
                            </Typography>
                          </Box>
                          {selectedTemplate === template._id && (
                            <CheckCircleIcon color='primary' />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      </Collapse>
    </Paper>
  );
};

TemplateSelector.propTypes = {
  templates: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      ad: PropTypes.string.isRequired,
      rol: PropTypes.shape({
        ad: PropTypes.string.isRequired,
      }).isRequired,
      maddeler: PropTypes.arrayOf(
        PropTypes.shape({
          maksimumPuan: PropTypes.number.isRequired,
        }),
      ).isRequired,
    }),
  ).isRequired,
  selectedTemplate: PropTypes.string.isRequired,
  expanded: PropTypes.bool.isRequired,
  onTemplateSelect: PropTypes.func.isRequired,
  onToggleExpanded: PropTypes.func.isRequired,
  onLoadDebugInfo: PropTypes.func.isRequired,
};

export default TemplateSelector;
