import { useState, useCallback, useEffect } from 'react';

/**
 * 📝 Meeting Form Management Hook
 * Meeting oluşturma/düzenleme form'u için state yönetimi
 */
export const useMeetingForm = (
  initialData = null,
  _users = [],
  _departments = [],
  _machines = [],
  _checklists = [],
) => {
  // Form data state
  const [formData, setFormData] = useState({
    baslik: '',
    aciklama: '',
    kategori: 'rutin',
    tarih: '',
    baslangicSaati: '',
    bitisSaati: '',
    lokasyon: '',
    oncelik: 'normal',
    departman: '',
    makina: '',
    katilimcilar: [],
    gundem: [],
    kararlar: [],
    tekrarlamaAyarlari: {
      tip: 'yok',
      aralik: 1,
      bitisTarihi: '',
      tekrarSayisi: null,
    },
    ilgiliChecklist: '',
  });

  // Form validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Initialize form with data (for editing)
   */
  useEffect(() => {
    if (initialData) {
      setFormData({
        baslik: initialData.baslik || '',
        aciklama: initialData.aciklama || '',
        kategori: initialData.kategori || 'rutin',
        tarih: initialData.tarih
          ? new Date(initialData.tarih).toISOString().split('T')[0]
          : '',
        baslangicSaati: initialData.baslangicSaati || '',
        bitisSaati: initialData.bitisSaati || '',
        lokasyon: initialData.lokasyon || '',
        oncelik: initialData.oncelik || 'normal',
        departman: initialData.departman?._id || initialData.departman || '',
        makina: initialData.makina?._id || initialData.makina || '',
        katilimcilar: initialData.katilimcilar || [],
        gundem: initialData.gundem || [],
        kararlar: initialData.kararlar || [],
        tekrarlamaAyarlari: initialData.tekrarlamaAyarlari || {
          tip: 'yok',
          aralik: 1,
          bitisTarihi: '',
          tekrarSayisi: null,
        },
        ilgiliChecklist:
          initialData.ilgiliChecklist?._id || initialData.ilgiliChecklist || '',
      });
    }
  }, [initialData]);

  /**
   * Handle input changes
   */
  const handleChange = useCallback(
    (field, value) => {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({
          ...prev,
          [field]: '',
        }));
      }

      // Mark field as touched
      setTouched(prev => ({
        ...prev,
        [field]: true,
      }));
    },
    [errors],
  );

  /**
   * Handle nested object changes (tekrarlamaAyarlari)
   */
  const handleNestedChange = useCallback((parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  }, []);

  /**
   * Add participant
   */
  const addParticipant = useCallback((kullanici, rol = 'katılımcı') => {
    setFormData(prev => ({
      ...prev,
      katilimcilar: [
        ...prev.katilimcilar.filter(k => k.kullanici !== kullanici),
        {
          kullanici,
          rol,
          katilimDurumu: 'davetli',
        },
      ],
    }));
  }, []);

  /**
   * Remove participant
   */
  const removeParticipant = useCallback(kullanici => {
    setFormData(prev => ({
      ...prev,
      katilimcilar: prev.katilimcilar.filter(k => k.kullanici !== kullanici),
    }));
  }, []);

  /**
   * Update participant role
   */
  const updateParticipantRole = useCallback((kullanici, rol) => {
    setFormData(prev => ({
      ...prev,
      katilimcilar: prev.katilimcilar.map(k =>
        k.kullanici === kullanici ? { ...k, rol } : k,
      ),
    }));
  }, []);

  /**
   * Add agenda item
   */
  const addAgendaItem = useCallback(item => {
    setFormData(prev => ({
      ...prev,
      gundem: [
        ...prev.gundem,
        {
          baslik: item.baslik,
          aciklama: item.aciklama || '',
          siraNo: prev.gundem.length + 1,
          sure: item.sure || 10,
          sorumlu: item.sorumlu || '',
          durum: 'bekliyor',
        },
      ],
    }));
  }, []);

  /**
   * Remove agenda item
   */
  const removeAgendaItem = useCallback(index => {
    setFormData(prev => ({
      ...prev,
      gundem: prev.gundem
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, siraNo: i + 1 })),
    }));
  }, []);

  /**
   * Update agenda item
   */
  const updateAgendaItem = useCallback((index, updatedItem) => {
    setFormData(prev => ({
      ...prev,
      gundem: prev.gundem.map((item, i) =>
        i === index ? { ...item, ...updatedItem } : item,
      ),
    }));
  }, []);

  /**
   * Validate form
   */
  const validateForm = useCallback(() => {
    const newErrors = {};

    // Required fields
    if (!formData.baslik.trim()) {
      newErrors.baslik = 'Toplantı başlığı zorunludur';
    }

    if (!formData.tarih) {
      newErrors.tarih = 'Toplantı tarihi zorunludur';
    }

    if (!formData.baslangicSaati) {
      newErrors.baslangicSaati = 'Başlangıç saati zorunludur';
    }

    // Validate date is not in the past (for new meetings)
    if (formData.tarih && !initialData) {
      const selectedDate = new Date(formData.tarih);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.tarih = 'Geçmiş tarihli toplantı oluşturulamaz';
      }
    }

    // Validate time range
    if (formData.baslangicSaati && formData.bitisSaati) {
      const startTime = new Date(`2000-01-01T${formData.baslangicSaati}`);
      const endTime = new Date(`2000-01-01T${formData.bitisSaati}`);

      if (endTime <= startTime) {
        newErrors.bitisSaati =
          'Bitiş saati başlangıç saatinden sonra olmalıdır';
      }
    }

    // Validate participants
    if (formData.katilimcilar.length === 0) {
      newErrors.katilimcilar = 'En az bir katılımcı seçmelisiniz';
    }

    // Validate recurring settings
    if (formData.tekrarlamaAyarlari.tip !== 'yok') {
      if (
        !formData.tekrarlamaAyarlari.bitisTarihi &&
        !formData.tekrarlamaAyarlari.tekrarSayisi
      ) {
        newErrors.tekrarlamaAyarlari =
          'Tekrarlama için bitiş tarihi veya tekrar sayısı belirtmelisiniz';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, initialData]);

  /**
   * Submit form
   */
  const handleSubmit = useCallback(
    async onSubmit => {
      setIsSubmitting(true);

      try {
        // Mark all fields as touched for validation display
        const allFields = Object.keys(formData);
        setTouched(
          allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}),
        );

        // Validate
        if (!validateForm()) {
          setIsSubmitting(false);
          return { success: false, error: 'Lütfen formdaki hataları düzeltin' };
        }

        // Prepare submission data
        const submissionData = {
          ...formData,
          // Ensure proper data types
          tarih: new Date(formData.tarih).toISOString(),
          departman: formData.departman || null,
          makina: formData.makina || null,
          ilgiliChecklist: formData.ilgiliChecklist || null,
          // Clean up tekrarlamaAyarlari
          tekrarlamaAyarlari:
            formData.tekrarlamaAyarlari.tip === 'yok'
              ? { tip: 'yok' }
              : formData.tekrarlamaAyarlari,
        };

        console.log('📝 Submitting meeting form:', submissionData);

        const result = await onSubmit(submissionData);
        setIsSubmitting(false);
        return result;
      } catch (error) {
        console.error('❌ Form submission error:', error);
        setIsSubmitting(false);
        return { success: false, error: 'Form gönderilirken hata oluştu' };
      }
    },
    [formData, validateForm],
  );

  /**
   * Reset form
   */
  const resetForm = useCallback(() => {
    setFormData({
      baslik: '',
      aciklama: '',
      kategori: 'rutin',
      tarih: '',
      baslangicSaati: '',
      bitisSaati: '',
      lokasyon: '',
      oncelik: 'normal',
      departman: '',
      makina: '',
      katilimcilar: [],
      gundem: [],
      kararlar: [],
      tekrarlamaAyarlari: {
        tip: 'yok',
        aralik: 1,
        bitisTarihi: '',
        tekrarSayisi: null,
      },
      ilgiliChecklist: '',
    });
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, []);

  /**
   * Get field props for input components
   */
  const getFieldProps = useCallback(
    field => ({
      value: formData[field] || '',
      onChange: e => handleChange(field, e.target.value),
      onBlur: () => setTouched(prev => ({ ...prev, [field]: true })),
      error: touched[field] && !!errors[field],
      helperText: touched[field] && errors[field],
    }),
    [formData, handleChange, touched, errors],
  );

  return {
    // Form data
    formData,
    errors,
    touched,
    isSubmitting,

    // Handlers
    handleChange,
    handleNestedChange,
    handleSubmit,
    resetForm,
    getFieldProps,

    // Participants
    addParticipant,
    removeParticipant,
    updateParticipantRole,

    // Agenda
    addAgendaItem,
    removeAgendaItem,
    updateAgendaItem,

    // Validation
    validateForm,

    // Computed values
    isValid: Object.keys(errors).length === 0,
    isDirty: Object.keys(touched).length > 0,
  };
};
