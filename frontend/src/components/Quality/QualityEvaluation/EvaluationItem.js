import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Slider,
  TextField,
  Button,
  Chip,
} from '@mui/material';
import { PhotoCamera as PhotoCameraIcon } from '@mui/icons-material';
import {
  SLIDER_CONFIG,
  UI_CONFIG,
  PLACEHOLDERS,
} from '../../../utils/qualityEvaluationConfig';

const EvaluationItem = ({
  madde,
  index,
  evaluationData,
  fileInputRef,
  onEvaluationChange,
  onImageUpload,
  onPreviewImage,
}) => {
  const localFileInputRef = useRef(null);
  const currentScore = evaluationData.puan || 0;
  const comment = evaluationData.yorum || '';
  const photo = evaluationData.fotograf;

  const handleScoreChange = (event, value) => {
    onEvaluationChange(index, 'puan', value);
  };

  const handleCommentChange = event => {
    onEvaluationChange(index, 'yorum', event.target.value);
  };

  const handleImageUploadClick = () => {
    if (localFileInputRef.current) {
      localFileInputRef.current.click();
    }
  };

  const handleImageChange = event => {
    onImageUpload(index, event);
  };

  const handlePreviewClick = () => {
    if (photo) {
      onPreviewImage(photo);
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant='subtitle1' fontWeight='bold' sx={{ mb: 1 }}>
          {index + 1}. {madde.baslik}
        </Typography>

        {madde.aciklama && (
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            {madde.aciklama}
          </Typography>
        )}

        {/* Puan Slider */}
        <Box sx={{ mb: 2 }}>
          <Typography gutterBottom>
            Puan: {currentScore} / {madde.maksimumPuan}
          </Typography>
          <Slider
            value={currentScore}
            onChange={handleScoreChange}
            min={0}
            max={madde.maksimumPuan}
            marks
            step={1}
            valueLabelDisplay='auto'
            sx={{
              '& .MuiSlider-thumb': {
                height: SLIDER_CONFIG.thumb.height,
                width: SLIDER_CONFIG.thumb.width,
              },
              '& .MuiSlider-track': {
                height: SLIDER_CONFIG.track.height,
              },
              '& .MuiSlider-rail': {
                height: SLIDER_CONFIG.rail.height,
              },
            }}
          />
        </Box>

        {/* Yorum */}
        <TextField
          fullWidth
          label={PLACEHOLDERS.comment}
          multiline
          rows={2}
          value={comment}
          onChange={handleCommentChange}
          size='small'
          sx={{ mb: 2 }}
        />

        {/* Fotoğraf */}
        <Box>
          <input
            type='file'
            accept='image/*'
            capture='environment'
            style={{ display: 'none' }}
            ref={el => {
              localFileInputRef.current = el;
              if (fileInputRef) {
                fileInputRef(el);
              }
            }}
            onChange={handleImageChange}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant='outlined'
              startIcon={<PhotoCameraIcon />}
              onClick={handleImageUploadClick}
              size='small'
            >
              {photo ? 'Fotoğrafı Değiştir' : 'Fotoğraf Ekle (İsteğe Bağlı)'}
            </Button>

            <Chip label='İsteğe Bağlı' size='small' color='info' />
          </Box>

          {photo && (
            <Box sx={{ mt: 1 }}>
              <Box
                component='button'
                onClick={handlePreviewClick}
                sx={{
                  border: 'none',
                  background: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  '&:focus': {
                    outline: '2px solid primary.main',
                    outlineOffset: 2,
                  },
                }}
                aria-label='Fotoğrafı büyüt'
              >
                <img
                  src={photo}
                  alt='Değerlendirme fotoğrafı'
                  style={{
                    width: UI_CONFIG.PREVIEW_IMAGE_SIZE.width,
                    height: UI_CONFIG.PREVIEW_IMAGE_SIZE.height,
                    objectFit: 'cover',
                    borderRadius: '8px',
                  }}
                />
              </Box>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

EvaluationItem.propTypes = {
  madde: PropTypes.shape({
    baslik: PropTypes.string.isRequired,
    aciklama: PropTypes.string,
    maksimumPuan: PropTypes.number.isRequired,
  }).isRequired,
  index: PropTypes.number.isRequired,
  evaluationData: PropTypes.shape({
    puan: PropTypes.number,
    yorum: PropTypes.string,
    fotograf: PropTypes.string,
  }).isRequired,
  fileInputRef: PropTypes.func.isRequired,
  onEvaluationChange: PropTypes.func.isRequired,
  onImageUpload: PropTypes.func.isRequired,
  onPreviewImage: PropTypes.func.isRequired,
};

export default EvaluationItem;
