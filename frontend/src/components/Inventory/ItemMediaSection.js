import React from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  IconButton,
  TextField,
  Autocomplete,
  Chip,
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const ItemMediaSection = ({
  formData,
  onImageUpload,
  onRemoveImage,
  onFieldChange,
}) => {
  return (
    <Grid item xs={12}>
      <Card variant='outlined'>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Fotoğraf ve Dökümanlar
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box>
                <input
                  accept='image/*'
                  style={{ display: 'none' }}
                  id='image-upload'
                  type='file'
                  onChange={onImageUpload}
                />
                <label htmlFor='image-upload'>
                  <Button
                    variant='outlined'
                    component='span'
                    startIcon={<PhotoCameraIcon />}
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    Fotoğraf Yükle
                  </Button>
                </label>

                {/* Fotoğraf Galerisi */}
                {formData.resimler && formData.resimler.length > 0 && (
                  <Box>
                    <Typography variant='subtitle2' sx={{ mb: 1 }}>
                      Yüklenen Fotoğraflar ({formData.resimler.length})
                    </Typography>
                    <Grid container spacing={1}>
                      {formData.resimler.map((resim, index) => (
                        <Grid item xs={6} sm={4} key={index}>
                          <Box sx={{ position: 'relative' }}>
                            <img
                              src={resim.url || resim}
                              alt={resim.aciklama || `Fotoğraf ${index + 1}`}
                              style={{
                                width: '100%',
                                height: 100,
                                objectFit: 'cover',
                                borderRadius: 8,
                                border: '1px solid #e0e0e0',
                              }}
                            />
                            <IconButton
                              size='small'
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                backgroundColor: 'rgba(255,255,255,0.8)',
                                '&:hover': {
                                  backgroundColor: 'rgba(255,255,255,0.9)',
                                },
                              }}
                              onClick={() => onRemoveImage(index)}
                            >
                              <CloseIcon fontSize='small' />
                            </IconButton>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={formData.etiketler}
                onChange={(event, newValue) => {
                  onFieldChange('etiketler', newValue);
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      key={index}
                      variant='outlined'
                      label={option}
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={params => (
                  <TextField
                    {...params}
                    label='Etiketler'
                    placeholder='Etiket ekleyin'
                    helperText='Enter ile etiket ekleyebilirsiniz'
                  />
                )}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
};

ItemMediaSection.propTypes = {
  formData: PropTypes.shape({
    resimler: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          url: PropTypes.string,
          aciklama: PropTypes.string,
        }),
      ]),
    ),
    etiketler: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  onImageUpload: PropTypes.func.isRequired,
  onRemoveImage: PropTypes.func.isRequired,
  onFieldChange: PropTypes.func.isRequired,
};

export default ItemMediaSection;
