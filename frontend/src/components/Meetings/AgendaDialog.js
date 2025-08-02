import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  List,
  IconButton,
  Chip,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Card,
  CardContent,
  Alert,
  Grid,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';

import EmojiWrapper from '../EmojiWrapper';

/**
 * 📋 AgendaDialog Component
 * Gündem maddesi ekleme/düzenleme ve sorumlu atama dialog'ı
 */
const AgendaDialog = ({
  open,
  onClose,
  onSave,
  participants = [],
  agenda = [],
  title = 'Gündem Düzenle',
  readonly = false,
}) => {
  // Local state
  const [localAgenda, setLocalAgenda] = useState([]);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [newItem, setNewItem] = useState({
    baslik: '',
    aciklama: '',
    sure: 10,
    sorumlu: null,
    durum: 'bekliyor',
    siraNo: 1,
  });
  const [errors, setErrors] = useState({});

  // Initialize local agenda from props
  useEffect(() => {
    if (open) {
      setLocalAgenda([...agenda]);
      setEditingIndex(-1);
      setNewItem({
        baslik: '',
        aciklama: '',
        sure: 10,
        sorumlu: null,
        durum: 'bekliyor',
        siraNo: agenda.length + 1,
      });
      setErrors({});
    }
  }, [open, agenda]);

  // Participants options for autocomplete
  const participantOptions = useMemo(() => {
    return participants.map(p => ({
      id: p._id || p.kullanici?._id || p.id,
      label: p.isim || p.kullanici?.isim || p.ad || p.name || 'İsimsiz',
      email: p.email || p.kullanici?.email || '',
      rol: p.rol || 'katılımcı',
    }));
  }, [participants]);

  // Validate agenda item
  const validateItem = item => {
    const newErrors = {};

    if (!item.baslik?.trim()) {
      newErrors.baslik = 'Madde başlığı gerekli';
    }
    if (!item.sure || item.sure < 1) {
      newErrors.sure = 'Süre en az 1 dakika olmalı';
    }

    return newErrors;
  };

  // Add new agenda item
  const handleAddItem = () => {
    const itemErrors = validateItem(newItem);

    if (Object.keys(itemErrors).length > 0) {
      setErrors(itemErrors);
      return;
    }

    const newAgendaItem = {
      ...newItem,
      siraNo: localAgenda.length + 1,
    };

    setLocalAgenda([...localAgenda, newAgendaItem]);
    setNewItem({
      baslik: '',
      aciklama: '',
      sure: 10,
      sorumlu: null,
      durum: 'bekliyor',
      siraNo: localAgenda.length + 2,
    });
    setErrors({});
  };

  // Start editing agenda item
  const handleEditItem = index => {
    setEditingIndex(index);
    setNewItem({ ...localAgenda[index] });
  };

  // Save edited agenda item
  const handleSaveEdit = () => {
    const itemErrors = validateItem(newItem);

    if (Object.keys(itemErrors).length > 0) {
      setErrors(itemErrors);
      return;
    }

    const updatedAgenda = [...localAgenda];
    updatedAgenda[editingIndex] = { ...newItem };
    setLocalAgenda(updatedAgenda);

    setEditingIndex(-1);
    setNewItem({
      baslik: '',
      aciklama: '',
      sure: 10,
      sorumlu: null,
      durum: 'bekliyor',
      siraNo: localAgenda.length + 1,
    });
    setErrors({});
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingIndex(-1);
    setNewItem({
      baslik: '',
      aciklama: '',
      sure: 10,
      sorumlu: null,
      durum: 'bekliyor',
      siraNo: localAgenda.length + 1,
    });
    setErrors({});
  };

  // Delete agenda item
  const handleDeleteItem = index => {
    const updatedAgenda = localAgenda.filter((_, i) => i !== index);
    // Re-number agenda items
    const renumberedAgenda = updatedAgenda.map((item, i) => ({
      ...item,
      siraNo: i + 1,
    }));
    setLocalAgenda(renumberedAgenda);
  };

  // Save all changes
  const handleSave = () => {
    if (localAgenda.length === 0) {
      setErrors({ general: 'En az bir gündem maddesi gerekli' });
      return;
    }

    onSave(localAgenda);
    onClose();
  };


  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <EmojiWrapper emoji="📋" label="Gündem" />
            <Typography variant="h6">{title}</Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {errors.general && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.general}
          </Alert>
        )}

        {/* Existing Agenda Items */}
        {localAgenda.length > 0 && (
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              <EmojiWrapper emoji="📝" label="Mevcut Maddeler" /> Gündem Maddeleri ({localAgenda.length})
            </Typography>

            <List>
              {localAgenda.map((item, index) => (
                <Card key={index} sx={{ mb: 1 }}>
                  <CardContent sx={{ py: 2 }}>
                    <Box display="flex" alignItems="flex-start" gap={2}>
                      <Chip
                        label={item.siraNo}
                        size="small"
                        color="primary"
                        sx={{ mt: 0.5 }}
                      />

                      <Box flex={1}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {item.baslik}
                        </Typography>

                        {item.aciklama && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {item.aciklama}
                          </Typography>
                        )}

                        <Box display="flex" alignItems="center" gap={2} mt={1} flexWrap="wrap">
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <TimeIcon sx={{ fontSize: 16 }} />
                            <Typography variant="caption">
                              {item.sure} dakika
                            </Typography>
                          </Box>

                          {item.sorumlu && (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Avatar sx={{ width: 20, height: 20, fontSize: 12 }}>
                                <PersonIcon sx={{ fontSize: 12 }} />
                              </Avatar>
                              <Typography variant="caption">
                                {participantOptions.find(p => p.id === item.sorumlu)?.label || 'Bilinmeyen'}
                              </Typography>
                            </Box>
                          )}

                          <Chip
                            label={item.durum}
                            size="small"
                            variant="outlined"
                            color={item.durum === 'tamamlandı' ? 'success' : 'default'}
                          />
                        </Box>
                      </Box>

                      {!readonly && (
                        <Box display="flex" flexDirection="column" gap={0.5}>
                          <Tooltip title="Düzenle">
                            <IconButton
                              size="small"
                              onClick={() => handleEditItem(index)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Sil">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteItem(index)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </List>
          </Box>
        )}

        {!readonly && (
          <>
            <Divider sx={{ my: 2 }} />

            {/* Add/Edit Form */}
            <Typography variant="h6" gutterBottom>
              <EmojiWrapper emoji="➕" label="Yeni Madde" />
              {editingIndex >= 0 ? ' Madde Düzenle' : ' Yeni Madde Ekle'}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Madde Başlığı *"
                  value={newItem.baslik}
                  onChange={e => setNewItem({ ...newItem, baslik: e.target.value })}
                  error={!!errors.baslik}
                  helperText={errors.baslik}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Açıklama"
                  value={newItem.aciklama}
                  onChange={e => setNewItem({ ...newItem, aciklama: e.target.value })}
                  multiline
                  rows={2}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Süre (dakika) *"
                  type="number"
                  value={newItem.sure}
                  onChange={e => setNewItem({ ...newItem, sure: parseInt(e.target.value) || 0 })}
                  error={!!errors.sure}
                  helperText={errors.sure}
                  variant="outlined"
                  inputProps={{ min: 1, max: 120 }}
                />
              </Grid>

              <Grid item xs={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Durum</InputLabel>
                  <Select
                    value={newItem.durum}
                    onChange={e => setNewItem({ ...newItem, durum: e.target.value })}
                    label="Durum"
                  >
                    <MenuItem value="bekliyor">Bekliyor</MenuItem>
                    <MenuItem value="devam-ediyor">Devam Ediyor</MenuItem>
                    <MenuItem value="tartışıldı">Tartışıldı</MenuItem>
                    <MenuItem value="karar-verildi">Karar Verildi</MenuItem>
                    <MenuItem value="tamamlandı">Tamamlandı</MenuItem>
                    <MenuItem value="ertelendi">Ertelendi</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  options={participantOptions}
                  value={participantOptions.find(p => p.id === newItem.sorumlu) || null}
                  onChange={(_, value) => setNewItem({ ...newItem, sorumlu: value?.id || null })}
                  getOptionLabel={option => option.label}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Sorumlu Kişi"
                      variant="outlined"
                      placeholder="Sorumlu kişi seçin..."
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: 12 }}>
                        <PersonIcon sx={{ fontSize: 14 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2">{option.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.rol} {option.email && `• ${option.email}`}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" gap={1} justifyContent="flex-end">
                  {editingIndex >= 0 ? (
                    <>
                      <Button
                        onClick={handleCancelEdit}
                        variant="outlined"
                      >
                        İptal
                      </Button>
                      <Button
                        onClick={handleSaveEdit}
                        variant="contained"
                        startIcon={<SaveIcon />}
                      >
                        Kaydet
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleAddItem}
                      variant="contained"
                      startIcon={<AddIcon />}
                    >
                      Madde Ekle
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          İptal
        </Button>
        {!readonly && (
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={localAgenda.length === 0}
          >
            Gündem Kaydet
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AgendaDialog;