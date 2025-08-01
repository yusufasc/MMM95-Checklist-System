import { useState, useEffect } from 'react';

export const useItemForm = ({
  item,
  open,
  categories,
  fieldTemplates,
  onCategoryChange,
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

  // Initialize form data when item changes
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
        garantiBitisTarihi: item.garantiBitisTarihi
          ? item.garantiBitisTarihi.split('T')[0]
          : '',
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

  // Handle category field templates
  useEffect(() => {
    if (formData.kategoriId) {
      const templates = fieldTemplates
        .filter(
          template =>
            template.kategoriId === formData.kategoriId &&
            template.aktif !== false,
        )
        .sort((a, b) => {
          if (a.grup !== b.grup) {
            return (a.grup || 'Genel Bilgiler').localeCompare(
              b.grup || 'Genel Bilgiler',
            );
          }
          return (a.siraNo || 0) - (b.siraNo || 0);
        });

      setCategoryFieldTemplates(templates);

      if (
        !item ||
        (item.kategoriId?._id || item.kategoriId) !== formData.kategoriId
      ) {
        const newDynamicFields = {};
        templates.forEach(template => {
          const fieldName = template.ad || template.alanAdi;
          if (
            template.varsayilanDeger !== undefined &&
            template.varsayilanDeger !== null
          ) {
            newDynamicFields[fieldName] = template.varsayilanDeger;
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

  // Form handlers
  const handleChange = field => event => {
    const value =
      event.target.type === 'checkbox'
        ? event.target.checked
        : event.target.value;
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
      dinamikAlanlar: {},
    }));

    if (onCategoryChange && categoryId) {
      setFieldTemplatesLoading(true);
      try {
        await onCategoryChange(categoryId);
      } catch (error) {
        if (
          typeof process !== 'undefined' &&
          process.env?.NODE_ENV === 'development'
        ) {
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
        setError("Fotoğraf boyutu 5MB'dan küçük olmalıdır");
        return;
      }

      const reader = new FileReader();
      reader.onload = e => {
        const imageObject = {
          url: e.target.result,
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

  const removeImage = index => {
    setFormData(prev => ({
      ...prev,
      resimler: prev.resimler.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    if (!formData.kategoriId) {
      setError('Kategori seçimi gereklidir');
      return false;
    }
    if (!formData.ad.trim()) {
      setError('Öğe adı gereklidir');
      return false;
    }

    for (const template of categoryFieldTemplates) {
      const fieldName = template.ad || template.alanAdi;
      const isRequired =
        template.gerekli !== undefined ? template.gerekli : template.zorunlu;
      if (
        isRequired &&
        (!formData.dinamikAlanlar[fieldName] ||
          formData.dinamikAlanlar[fieldName].toString().trim() === '')
      ) {
        setError(`${fieldName} alanı zorunludur`);
        return false;
      }
    }
    return true;
  };

  return {
    formData,
    setFormData,
    error,
    setError,
    loading,
    setLoading,
    fieldTemplatesLoading,
    selectedCategory,
    categoryFieldTemplates,
    handleChange,
    handleCategoryChange,
    handleDynamicFieldChange,
    handleImageUpload,
    generateQRCode,
    removeImage,
    validateForm,
  };
};
