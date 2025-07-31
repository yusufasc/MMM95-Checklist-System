import { useState, useCallback } from 'react';

/**
 * Ortak form handling hook - spageti kod çözümü
 * Tüm form state management'ları için standardize edilmiş pattern
 */
const useFormHandler = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tek field validation
  const validateField = useCallback(
    (name, value) => {
      const rule = validationRules[name];
      if (!rule) {
        return true; // Kural yoksa geçerli kabul et
      }

      let error = '';

      if (rule.required && (!value || value.toString().trim() === '')) {
        error = rule.message || `${name} zorunludur`;
      } else if (rule.minLength && value && value.length < rule.minLength) {
        error =
          rule.message || `${name} en az ${rule.minLength} karakter olmalıdır`;
      } else if (rule.maxLength && value && value.length > rule.maxLength) {
        error =
          rule.message ||
          `${name} en fazla ${rule.maxLength} karakter olmalıdır`;
      } else if (rule.pattern && value && !rule.pattern.test(value)) {
        error = rule.message || `${name} geçerli bir format değil`;
      } else if (rule.custom && value) {
        error = rule.custom(value) || '';
      }

      setErrors(prev => ({
        ...prev,
        [name]: error,
      }));

      return error === '' ? true : false;
    },
    [validationRules],
  );

  // Tek field güncellemesi
  const handleChange = useCallback(
    (name, value) => {
      setValues(prev => ({
        ...prev,
        [name]: value,
      }));

      // Eğer field daha önce touch edilmişse hemen validate et
      if (touched[name]) {
        validateField(name, value);
      }
    },
    [touched, validateField],
  );

  // Event handler - input onChange için
  const handleInputChange = useCallback(
    event => {
      const { name, value, type, checked } = event.target;
      const fieldValue = type === 'checkbox' ? checked : value;
      handleChange(name, fieldValue);
    },
    [handleChange],
  );

  // Field touch handling
  const handleBlur = useCallback(
    name => {
      setTouched(prev => ({
        ...prev,
        [name]: true,
      }));
      validateField(name, values[name]);
    },
    [values, validateField],
  );

  // Tüm form validation
  const validateForm = useCallback(() => {
    let isValid = true;

    Object.keys(validationRules).forEach(name => {
      const isFieldValid = validateField(name, values[name]);
      if (!isFieldValid) {
        isValid = false;
      }
    });

    return isValid;
  }, [values, validationRules, validateField]);

  // Form submit
  const handleSubmit = useCallback(
    async onSubmit => {
      setIsSubmitting(true);

      // Tüm alanları touched olarak işaretle
      const allTouched = Object.keys(validationRules).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
      setTouched(allTouched);

      try {
        const isValid = validateForm();
        if (isValid) {
          await onSubmit(values);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Form submit error:', error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validateForm, validationRules],
  );

  // Form reset
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Bulk value update
  const setFormValues = useCallback(newValues => {
    setValues(prev => ({
      ...prev,
      ...newValues,
    }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleInputChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFormValues,
    validateForm,
    isValid:
      Object.keys(errors).length === 0 && Object.keys(touched).length > 0,
  };
};

export default useFormHandler;
