import { useState, useCallback } from 'react';

export const useWorkTaskForm = () => {
  const [formData, setFormData] = useState({
    makinaId: '',
    indirilenKalip: '',
    baglananHamade: '',
    makinaDurmaSaati: new Date(),
    yeniKalipAktifSaati: new Date(),
    bakimaGitsinMi: false,
    bakimSebebi: '',
    bakimResimUrl: '',
  });

  const [errors, setErrors] = useState({});

  const handleFormChange = useCallback(
    (field, value) => {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({
          ...prev,
          [field]: null,
        }));
      }
    },
    [errors],
  );

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.makinaId) {
      newErrors.makinaId = 'Makina seçimi zorunludur';
    }

    if (!formData.indirilenKalip) {
      newErrors.indirilenKalip = 'Kalıp seçimi zorunludur';
    }

    if (!formData.baglananHamade) {
      newErrors.baglananHamade = 'Hammadde seçimi zorunludur';
    }

    if (formData.bakimaGitsinMi && !formData.bakimSebebi) {
      newErrors.bakimSebebi = 'Bakım sebebi girmelisiniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData({
      makinaId: '',
      indirilenKalip: '',
      baglananHamade: '',
      makinaDurmaSaati: new Date(),
      yeniKalipAktifSaati: new Date(),
      bakimaGitsinMi: false,
      bakimSebebi: '',
      bakimResimUrl: '',
    });
    setErrors({});
  }, []);

  const updateFormData = useCallback(data => {
    setFormData(data);
  }, []);

  return {
    formData,
    errors,
    handleFormChange,
    validateForm,
    resetForm,
    updateFormData,
    setErrors,
  };
};
