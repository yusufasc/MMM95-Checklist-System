import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  IconButton,
  Switch,
  FormControlLabel,
  Chip,
  Autocomplete,
  Card,
  CardContent,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  Close as CloseIcon,
  QrCode as QrCodeIcon,
  PhotoCamera as PhotoCameraIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const ItemDialog = ({
  open,
  onClose,
  item,
  categories,
  fieldTemplates,
  users,
  departments,
  onCategoryChange,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    kategoriId: '',
    envanterKodu: '',
    ad: '',
    aciklama: '',
    durum: 'aktif',
    lokasyon: '',
    departman: '',
    sorumluKisi: '',
    alisFiyati: '',
    guncelDeger: '',
    tedarikci: '',
    garantiBitisTarihi: '',
    bakimPeriyodu: 30,
    bakimSorumlusu: '',
    qrKodu: '',
    barkod: '',
    oncelikSeviyesi: 'orta',
    etiketler: [],
    resimler: [],
    belgeler: [],
    dinamikAlanlar: {},
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldTemplatesLoading, setFieldTemplatesLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryFieldTemplates, setCategoryFieldTemplates] = useState([]);

  // Durum seçenekleri
  const statusOptions = [
    { value: 'aktif', label: 'Aktif', color: 'success' },
    { value: 'bakim', label: 'Bakımda', color: 'warning' },
    { value: 'bozuk', label: 'Bozuk', color: 'error' },
    { value: 'hurda', label: 'Hurda', color: 'default' },
    { value: 'yedek', label: 'Yedek', color: 'info' },
    { value: 'kirada', label: 'Kirada', color: 'secondary' },
  ];

  // Öncelik seçenekleri
  const priorityOptions = [
    { value: 'dusuk', label: 'Düşük' },
    { value: 'orta', label: 'Orta' },
    { value: 'yuksek', label: 'Yüksek' },
    { value: 'kritik', label: 'Kritik' },
  ];

  useEffect(() => {
    if (item) {
      setFormData({
        kategoriId: item.kategoriId?._id || item.kategoriId || '',
        envanterKodu: item.envanterKodu || '',
        ad: item.ad || '',
        aciklama: item.aciklama || '',
        durum: item.durum || 'aktif',
        lokasyon: item.lokasyon || '',
        departman: item.departman?._id || item.departman || '',
        sorumluKisi: item.sorumluKisi?._id || item.sorumluKisi || '',
        alisFiyati: item.alisFiyati || '',
        guncelDeger: item.guncelDeger || '',
        tedarikci: item.tedarikci || '',
        garantiBitisTarihi: item.garantiBitisTarihi ? item.garantiBitisTarihi.split('T')[0] : '',
        bakimPeriyodu: item.bakimPeriyodu || 30,
        bakimSorumlusu: item.bakimSorumlusu?._id || item.bakimSorumlusu || '',
        qrKodu: item.qrKodu || '',
        barkod: item.barkod || '',
        oncelikSeviyesi: item.oncelikSeviyesi || 'orta',
        etiketler: item.etiketler || [],
        resimler: item.resimler || [],
        belgeler: item.belgeler || [],
        dinamikAlanlar: item.dinamikAlanlar || {},
      });
      if (item.kategoriId) {
        const categoryId = item.kategoriId._id || item.kategoriId;
        const category = categories.find(cat => cat._id === categoryId);
        setSelectedCategory(category);
      }
    } else {
      setFormData({
        kategoriId: '',
        envanterKodu: '',
        ad: '',
        aciklama: '',
        durum: 'aktif',
        lokasyon: '',
        departman: '',
        sorumluKisi: '',
        alisFiyati: '',
        guncelDeger: '',
        tedarikci: '',
        garantiBitisTarihi: '',
        bakimPeriyodu: 30,
        bakimSorumlusu: '',
        qrKodu: '',
        barkod: '',
        oncelikSeviyesi: 'orta',
        etiketler: [],
        resimler: [],
        belgeler: [],
        dinamikAlanlar: {},
      });
      setSelectedCategory(null);
    }
    setError('');
  }, [item, open, categories]);

  useEffect(() => {
    if (formData.kategoriId) {
      // Kategoriye ait field template'leri filtrele
      const templates = fieldTemplates
        .filter(template => template.kategoriId === formData.kategoriId && template.aktif !== false)
        .sort((a, b) => {
          // Önce grup adına göre, sonra sıra numarasına göre sırala
          if (a.grup !== b.grup) {
            return (a.grup || 'Genel Bilgiler').localeCompare(b.grup || 'Genel Bilgiler');
          }
          return (a.siraNo || 0) - (b.siraNo || 0);
        });

      setCategoryFieldTemplates(templates);

      // Eğer yeni kategori seçildiyse ve mevcut item'in kategorisi farklıysa dinamik alanları sıfırla
      if (!item || (item.kategoriId?._id || item.kategoriId) !== formData.kategoriId) {
        const newDynamicFields = {};
        templates.forEach(template => {
          if (template.varsayilanDeger !== undefined && template.varsayilanDeger !== null) {
            newDynamicFields[template.alanAdi] = template.varsayilanDeger;
          }
        });
        setFormData(prev => ({
          ...prev,
          dinamikAlanlar: newDynamicFields,
        }));
      }
    } else {
      setCategoryFieldTemplates([]);
    }
  }, [formData.kategoriId, fieldTemplates, item]);

  const handleChange = field => event => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setError('');
  };

  const handleCategoryChange = async event => {
    const categoryId = event.target.value;

    const category = categories.find(cat => cat._id === categoryId);
    setSelectedCategory(category);
    setFormData(prev => ({
      ...prev,
      kategoriId: categoryId,
      dinamikAlanlar: {}, // Kategori değiştiğinde dinamik alanları sıfırla
    }));

    // Field template'leri yükle
    if (onCategoryChange && categoryId) {
      setFieldTemplatesLoading(true);
      try {
        await onCategoryChange(categoryId);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Kategori alanları yükleme hatası:', error);
        }
        setError('Kategori alanları yüklenirken hata oluştu');
      } finally {
        setFieldTemplatesLoading(false);
      }
    }
  };

  const handleDynamicFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      dinamikAlanlar: {
        ...prev.dinamikAlanlar,
        [fieldName]: value,
      },
    }));
  };

  const handleImageUpload = event => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setError("Fotoğraf boyutu 5MB'dan küçük olmalıdır");
        return;
      }

      const reader = new FileReader();
      reader.onload = e => {
        const imageObject = {
          url: e.target.result, // base64 data URL
          aciklama: file.name || 'Envanter fotoğrafı',
          yuklemeTarihi: new Date(),
        };

        setFormData(prev => ({
          ...prev,
          resimler: [...(prev.resimler || []), imageObject],
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const generateQRCode = () => {
    const qrCode = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    setFormData(prev => ({
      ...prev,
      qrKodu: qrCode,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.kategoriId) {
      setError('Kategori seçimi gereklidir');
      return;
    }
    if (!formData.ad.trim()) {
      setError('Öğe adı gereklidir');
      return;
    }

    // Zorunlu dinamik alanları kontrol et
    for (const template of categoryFieldTemplates) {
      if (
        template.zorunlu &&
        (!formData.dinamikAlanlar[template.alanAdi] ||
          formData.dinamikAlanlar[template.alanAdi].toString().trim() === '')
      ) {
        setError(`${template.alanAdi} alanı zorunludur`);
        return;
      }
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
      };

      // Boş envanter kodunu backend'e gönderme, otomatik oluşsun
      if (!submitData.envanterKodu?.trim()) {
        delete submitData.envanterKodu;
      }

      await onSave(submitData);
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Envanter öğesi kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const renderDynamicField = template => {
    const value = formData.dinamikAlanlar[template.alanAdi] || '';

    switch (template.alanTipi) {
      case 'text':
      case 'email':
      case 'url':
      case 'tel':
        return (
          <TextField
            fullWidth
            label={template.alanAdi}
            value={value}
            onChange={e => handleDynamicFieldChange(template.alanAdi, e.target.value)}
            required={template.zorunlu}
            type={template.alanTipi === 'text' ? 'text' : template.alanTipi}
            helperText={template.aciklama}
            placeholder={template.placeholder}
            variant="outlined"
          />
        );

      case 'number':
        return (
          <TextField
            fullWidth
            label={template.alanAdi}
            value={value}
            onChange={e => handleDynamicFieldChange(template.alanAdi, e.target.value)}
            required={template.zorunlu}
            type="number"
            helperText={template.aciklama}
            placeholder={template.placeholder}
            variant="outlined"
            inputProps={{
              min: template.validasyon?.min || undefined,
              max: template.validasyon?.max || undefined,
            }}
          />
        );

      case 'date':
        return (
          <TextField
            fullWidth
            label={template.alanAdi}
            value={value}
            onChange={e => handleDynamicFieldChange(template.alanAdi, e.target.value)}
            required={template.zorunlu}
            type="date"
            helperText={template.aciklama}
            variant="outlined"
            InputLabelProps={{ shrink: true }}
          />
        );

      case 'textarea':
        return (
          <TextField
            fullWidth
            label={template.alanAdi}
            value={value}
            onChange={e => handleDynamicFieldChange(template.alanAdi, e.target.value)}
            required={template.zorunlu}
            multiline
            rows={3}
            helperText={template.aciklama}
            placeholder={template.placeholder}
            variant="outlined"
          />
        );

      case 'select':
        return (
          <FormControl fullWidth required={template.zorunlu}>
            <InputLabel>{template.alanAdi}</InputLabel>
            <Select
              value={value}
              onChange={e => handleDynamicFieldChange(template.alanAdi, e.target.value)}
              label={template.alanAdi}
            >
              {template.secenekler?.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'multiselect':
        return (
          <Autocomplete
            multiple
            options={template.secenekler || []}
            value={value ? value.split(',').filter(Boolean) : []}
            onChange={(event, newValue) => {
              handleDynamicFieldChange(template.alanAdi, newValue.join(','));
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip key={index} variant="outlined" label={option} {...getTagProps({ index })} />
              ))
            }
            renderInput={params => (
              <TextField
                {...params}
                label={template.alanAdi}
                helperText={template.aciklama}
                required={template.zorunlu}
              />
            )}
          />
        );

      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={value === 'true' || value === true}
                onChange={e => handleDynamicFieldChange(template.alanAdi, e.target.checked)}
              />
            }
            label={template.alanAdi}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: 600,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Typography variant="h6" component="div">
          {item ? 'Envanter Öğesi Düzenle' : 'Yeni Envanter Öğesi'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Temel Bilgiler */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Temel Bilgiler
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Kategori</InputLabel>
                      <Select
                        value={formData.kategoriId}
                        onChange={handleCategoryChange}
                        label="Kategori"
                      >
                        {categories.map(category => (
                          <MenuItem key={category._id} value={category._id}>
                            {category.ad}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Öğe Adı"
                      value={formData.ad}
                      onChange={handleChange('ad')}
                      required
                      variant="outlined"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Envanter Kodu"
                      value={formData.envanterKodu}
                      onChange={handleChange('envanterKodu')}
                      placeholder="Örn: EKP-001"
                      variant="outlined"
                      helperText="Boş bırakılırsa otomatik oluşturulur"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Açıklama"
                      value={formData.aciklama}
                      onChange={handleChange('aciklama')}
                      multiline
                      rows={2}
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Durum ve Konum */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Durum ve Konum
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Durum</InputLabel>
                      <Select value={formData.durum} onChange={handleChange('durum')} label="Durum">
                        {statusOptions.map(status => (
                          <MenuItem key={status.value} value={status.value}>
                            {status.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Lokasyon"
                      value={formData.lokasyon}
                      onChange={handleChange('lokasyon')}
                      variant="outlined"
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Öncelik Seviyesi</InputLabel>
                      <Select
                        value={formData.oncelikSeviyesi}
                        onChange={handleChange('oncelikSeviyesi')}
                        label="Öncelik Seviyesi"
                      >
                        {priorityOptions.map(priority => (
                          <MenuItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Departman</InputLabel>
                      <Select
                        value={formData.departman}
                        onChange={handleChange('departman')}
                        label="Departman"
                      >
                        {(departments || []).map(dept => (
                          <MenuItem key={dept._id} value={dept._id}>
                            {dept.ad}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Sorumlu Kişi</InputLabel>
                      <Select
                        value={formData.sorumluKisi}
                        onChange={handleChange('sorumluKisi')}
                        label="Sorumlu Kişi"
                      >
                        {(users || []).map(user => (
                          <MenuItem key={user._id} value={user._id}>
                            {user.ad} {user.soyad}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Mali Bilgiler ve Tarihler */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Mali Bilgiler ve Tarihler
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Alış Fiyatı"
                      value={formData.alisFiyati}
                      onChange={handleChange('alisFiyati')}
                      type="number"
                      variant="outlined"
                      InputProps={{
                        endAdornment: '₺',
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Güncel Değer"
                      value={formData.guncelDeger}
                      onChange={handleChange('guncelDeger')}
                      type="number"
                      variant="outlined"
                      InputProps={{
                        endAdornment: '₺',
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Tedarikçi"
                      value={formData.tedarikci}
                      onChange={handleChange('tedarikci')}
                      variant="outlined"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Garanti Bitiş Tarihi"
                      value={formData.garantiBitisTarihi}
                      onChange={handleChange('garantiBitisTarihi')}
                      type="date"
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Bakım Sorumlusu</InputLabel>
                      <Select
                        value={formData.bakimSorumlusu}
                        onChange={handleChange('bakimSorumlusu')}
                        label="Bakım Sorumlusu"
                      >
                        {(users || []).map(user => (
                          <MenuItem key={user._id} value={user._id}>
                            {user.ad} {user.soyad}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Kodlar */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Kodlar ve Tanımlayıcılar
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Barkod"
                      value={formData.barkod}
                      onChange={handleChange('barkod')}
                      variant="outlined"
                    />
                  </Grid>

                  <Grid item xs={12} md={8}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        label="QR Kod"
                        value={formData.qrKodu}
                        onChange={handleChange('qrKodu')}
                        variant="outlined"
                      />
                      <Button
                        variant="outlined"
                        onClick={generateQRCode}
                        startIcon={<QrCodeIcon />}
                        sx={{ minWidth: 120 }}
                      >
                        Oluştur
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Dinamik Alanlar */}
          {formData.kategoriId && (
            <Grid item xs={12}>
              {fieldTemplatesLoading ? (
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <CircularProgress size={24} />
                      <Typography variant="h6">Kategori alanları yükleniyor...</Typography>
                    </Box>
                    {[...Array(3)].map((_, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Skeleton variant="text" width="30%" height={20} />
                        <Skeleton variant="rectangular" width="100%" height={56} />
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              ) : categoryFieldTemplates.length > 0 ? (
                (() => {
                  // Field template'leri gruplara ayır
                  const groupedFields = {};
                  categoryFieldTemplates.forEach(template => {
                    const grupAdi = template.grup || 'Genel Bilgiler';
                    if (!groupedFields[grupAdi]) {
                      groupedFields[grupAdi] = [];
                    }
                    groupedFields[grupAdi].push(template);
                  });

                  return Object.entries(groupedFields).map(([grupAdi, templates]) => (
                    <Card key={grupAdi} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography
                          variant="h6"
                          gutterBottom
                          sx={{
                            color: 'primary.main',
                            borderBottom: '2px solid',
                            borderColor: 'primary.main',
                            pb: 1,
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: 'primary.main',
                            }}
                          />
                          {grupAdi}
                          <Chip
                            label={`${templates.length} alan`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Typography>
                        <Grid container spacing={2}>
                          {templates.map(template => (
                            <Grid item xs={12} md={6} key={template._id}>
                              {renderDynamicField(template)}
                            </Grid>
                          ))}
                        </Grid>
                      </CardContent>
                    </Card>
                  ));
                })()
              ) : (
                <Card variant="outlined">
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        py: 4,
                        color: 'text.secondary',
                      }}
                    >
                      <SettingsIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                      <Typography variant="h6" gutterBottom>
                        Bu kategori için özel alan bulunamadı
                      </Typography>
                      <Typography variant="body2" textAlign="center">
                        {selectedCategory?.ad} kategorisi için henüz özel alanlar tanımlanmamış.
                        Yönetici ile iletişime geçin.
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Grid>
          )}

          {/* Fotoğraf ve Dökümanlar */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Fotoğraf ve Dökümanlar
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box>
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="image-upload"
                        type="file"
                        onChange={handleImageUpload}
                      />
                      <label htmlFor="image-upload">
                        <Button
                          variant="outlined"
                          component="span"
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
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
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
                                    size="small"
                                    sx={{
                                      position: 'absolute',
                                      top: 4,
                                      right: 4,
                                      backgroundColor: 'rgba(255,255,255,0.8)',
                                      '&:hover': {
                                        backgroundColor: 'rgba(255,255,255,0.9)',
                                      },
                                    }}
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        resimler: prev.resimler.filter((_, i) => i !== index),
                                      }));
                                    }}
                                  >
                                    <CloseIcon fontSize="small" />
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
                        setFormData(prev => ({
                          ...prev,
                          etiketler: newValue,
                        }));
                      }}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            key={index}
                            variant="outlined"
                            label={option}
                            {...getTagProps({ index })}
                          />
                        ))
                      }
                      renderInput={params => (
                        <TextField
                          {...params}
                          label="Etiketler"
                          placeholder="Etiket ekleyin"
                          helperText="Enter ile etiket ekleyebilirsiniz"
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading}>
          İptal
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.kategoriId || !formData.ad.trim()}
        >
          {loading ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ItemDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      ad: PropTypes.string.isRequired,
    }),
  ).isRequired,
  fieldTemplates: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      kategoriId: PropTypes.string.isRequired,
      ad: PropTypes.string.isRequired,
      tip: PropTypes.string.isRequired,
      gerekli: PropTypes.bool,
      grup: PropTypes.string,
      siraNo: PropTypes.number,
      aktif: PropTypes.bool,
      secenekler: PropTypes.arrayOf(PropTypes.string),
      validasyon: PropTypes.object,
      varsayilanDeger: PropTypes.string,
      aciklama: PropTypes.string,
    }),
  ).isRequired,
  users: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      ad: PropTypes.string.isRequired,
      soyad: PropTypes.string.isRequired,
    }),
  ).isRequired,
  departments: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      ad: PropTypes.string.isRequired,
    }),
  ).isRequired,
  item: PropTypes.shape({
    _id: PropTypes.string,
    kategoriId: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        ad: PropTypes.string.isRequired,
      }),
    ]),
    envanterKodu: PropTypes.string,
    ad: PropTypes.string,
    aciklama: PropTypes.string,
    durum: PropTypes.string,
    lokasyon: PropTypes.string,
    departman: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        ad: PropTypes.string.isRequired,
      }),
    ]),
    sorumluKisi: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        ad: PropTypes.string.isRequired,
        soyad: PropTypes.string.isRequired,
      }),
    ]),
    alisFiyati: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    guncelDeger: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    tedarikci: PropTypes.string,
    garantiBitisTarihi: PropTypes.string,
    bakimPeriyodu: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    bakimSorumlusu: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        ad: PropTypes.string.isRequired,
        soyad: PropTypes.string.isRequired,
      }),
    ]),
    qrKodu: PropTypes.string,
    barkod: PropTypes.string,
    oncelikSeviyesi: PropTypes.string,
    etiketler: PropTypes.arrayOf(PropTypes.string),
    resimler: PropTypes.arrayOf(PropTypes.string),
    belgeler: PropTypes.arrayOf(PropTypes.object),
    dinamikAlanlar: PropTypes.object,
  }),
};

export default ItemDialog;
