import React from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';

const TemplatesTab = ({
  templates,
  roles,
  onAddTemplate,
  onEditTemplate,
  onDeleteTemplate,
}) => {
  return (
    <Box>
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={3}
      >
        <Typography variant='h6'>Değerlendirme Şablonları</Typography>
        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={onAddTemplate}
          sx={{
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              transform: 'translateY(-2px)',
            },
          }}
        >
          Yeni Şablon
        </Button>
      </Box>

      {templates.length === 0 ? (
        <Card
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 4,
            background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
          }}
        >
          <AssignmentIcon
            sx={{ fontSize: 80, color: 'rgba(0,0,0,0.3)', mb: 2 }}
          />
          <Typography variant='h6' color='text.secondary' gutterBottom>
            Henüz değerlendirme şablonu bulunmuyor
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            İlk şablonunuzu oluşturmak için "Yeni Şablon" butonuna tıklayın
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {templates.map(template => (
            <Grid item xs={12} md={6} lg={4} key={template._id}>
              <Card
                elevation={4}
                sx={{
                  borderRadius: 4,
                  background:
                    'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                  border: '2px solid transparent',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                    borderColor: 'primary.main',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  {/* Header */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant='h6'
                        fontWeight='bold'
                        color='primary.main'
                        sx={{ mb: 1 }}
                      >
                        {template.ad}
                      </Typography>

                      <Chip
                        label={template.aktif ? 'Aktif' : 'Pasif'}
                        color={template.aktif ? 'success' : 'default'}
                        size='small'
                        sx={{ mb: 2 }}
                      />
                    </Box>

                    <Box>
                      <IconButton
                        size='small'
                        onClick={() => onEditTemplate(template)}
                        sx={{
                          bgcolor: 'action.hover',
                          mr: 1,
                          '&:hover': {
                            bgcolor: 'primary.main',
                            color: 'white',
                            transform: 'scale(1.1)',
                          },
                        }}
                      >
                        <EditIcon fontSize='small' />
                      </IconButton>
                      <IconButton
                        size='small'
                        onClick={() => onDeleteTemplate(template._id)}
                        sx={{
                          bgcolor: 'action.hover',
                          '&:hover': {
                            bgcolor: 'error.main',
                            color: 'white',
                            transform: 'scale(1.1)',
                          },
                        }}
                      >
                        <DeleteIcon fontSize='small' />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Description */}
                  {template.aciklama && (
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{ mb: 2 }}
                    >
                      {template.aciklama}
                    </Typography>
                  )}

                  {/* Target Roles */}
                  {template.hedefRoller && template.hedefRoller.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        gutterBottom
                      >
                        Hedef Roller:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {template.hedefRoller
                          .filter(rol => rol !== null && rol !== undefined)
                          .map(rol => {
                            const rolId =
                              typeof rol === 'object' && rol._id
                                ? rol._id
                                : rol;
                            const rolAdi =
                              typeof rol === 'object' && rol.ad
                                ? rol.ad
                                : roles.find(r => r._id === rol)?.ad;

                            if (!rolAdi || !rolId) {
                              return null;
                            }

                            return (
                              <Chip
                                key={rolId}
                                label={rolAdi}
                                color='primary'
                                variant='outlined'
                                size='small'
                              />
                            );
                          })
                          .filter(Boolean)}
                      </Box>
                    </Box>
                  )}

                  {/* Items Preview */}
                  <Typography
                    variant='body2'
                    sx={{ mt: 2, mb: 1 }}
                    color='text.secondary'
                  >
                    Maddeler ({template.maddeler?.length || 0}):
                  </Typography>

                  <List dense sx={{ bgcolor: 'grey.50', borderRadius: 2 }}>
                    {(template.maddeler || [])
                      .slice(0, 3)
                      .map((madde, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={madde.baslik}
                            secondary={`${madde.puan > 0 ? '+' : ''}${madde.puan} puan (${madde.periyot})`}
                            primaryTypographyProps={{ variant: 'body2' }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      ))}
                    {(template.maddeler?.length || 0) > 3 && (
                      <ListItem sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={`+${template.maddeler.length - 3} madde daha...`}
                          primaryTypographyProps={{
                            variant: 'caption',
                            color: 'text.secondary',
                            fontStyle: 'italic',
                          }}
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default TemplatesTab;
