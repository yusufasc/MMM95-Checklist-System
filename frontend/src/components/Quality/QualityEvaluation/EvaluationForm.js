import React from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Box,
  Typography,
  IconButton,
  Collapse,
  Alert,
  List,
  TextField,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import EvaluationItem from './EvaluationItem';
import {
  formatWorkerName,
  PLACEHOLDERS,
} from '../../../utils/qualityEvaluationConfig';

const EvaluationForm = ({
  selectedTemplateData,
  selectedWorkerData,
  evaluationData,
  notes,
  totalScore,
  expanded,
  fileInputRefs,
  onEvaluationChange,
  onImageUpload,
  onPreviewImage,
  onNotesChange,
  onToggleExpanded,
}) => {
  if (!selectedTemplateData || !selectedWorkerData) {
    return null;
  }

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
          <CheckCircleIcon sx={{ mr: 1 }} />
          Değerlendirme - {totalScore.current}/{totalScore.max} Puan
        </Typography>
        <IconButton>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ mt: 2 }}>
          <Alert severity='info' sx={{ mb: 2 }}>
            <strong>Değerlendirilen:</strong>{' '}
            {formatWorkerName(selectedWorkerData)}
          </Alert>

          <List sx={{ p: 0 }}>
            {selectedTemplateData.maddeler.map((madde, index) => (
              <EvaluationItem
                key={index}
                madde={madde}
                index={index}
                evaluationData={evaluationData[index] || {}}
                fileInputRef={el => (fileInputRefs.current[index] = el)}
                onEvaluationChange={onEvaluationChange}
                onImageUpload={onImageUpload}
                onPreviewImage={onPreviewImage}
              />
            ))}
          </List>

          {/* Genel Yorum */}
          <TextField
            fullWidth
            label='Genel Değerlendirme Notu'
            multiline
            rows={3}
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            placeholder={PLACEHOLDERS.generalNotes}
            sx={{ mt: 2 }}
          />
        </Box>
      </Collapse>
    </Paper>
  );
};

EvaluationForm.propTypes = {
  selectedTemplateData: PropTypes.shape({
    maddeler: PropTypes.arrayOf(
      PropTypes.shape({
        baslik: PropTypes.string.isRequired,
        aciklama: PropTypes.string,
        maksimumPuan: PropTypes.number.isRequired,
      }),
    ).isRequired,
  }),
  selectedWorkerData: PropTypes.shape({
    ad: PropTypes.string.isRequired,
    soyad: PropTypes.string.isRequired,
  }),
  evaluationData: PropTypes.object.isRequired,
  notes: PropTypes.string.isRequired,
  totalScore: PropTypes.shape({
    current: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
  }).isRequired,
  expanded: PropTypes.bool.isRequired,
  fileInputRefs: PropTypes.object.isRequired,
  onEvaluationChange: PropTypes.func.isRequired,
  onImageUpload: PropTypes.func.isRequired,
  onPreviewImage: PropTypes.func.isRequired,
  onNotesChange: PropTypes.func.isRequired,
  onToggleExpanded: PropTypes.func.isRequired,
};

export default EvaluationForm;
