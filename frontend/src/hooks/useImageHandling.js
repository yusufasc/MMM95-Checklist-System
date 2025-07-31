import { useState, useCallback } from 'react';

export const useImageHandling = () => {
  const [imagePreview, setImagePreview] = useState(null);
  const [imageDialog, setImageDialog] = useState(false);
  const [selectedImageInfo, setSelectedImageInfo] = useState(null);

  const openImagePreview = useCallback((imageUrl, imageInfo = null) => {
    setImagePreview(imageUrl);
    setSelectedImageInfo(imageInfo);
    setImageDialog(true);
  }, []);

  const closeImagePreview = useCallback(() => {
    setImagePreview(null);
    setSelectedImageInfo(null);
    setImageDialog(false);
  }, []);

  const isValidImageUrl = useCallback(url => {
    if (!url) {
      return false;
    }
    try {
      const _url = new URL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  const getImagePreviewProps = useCallback(
    () => ({
      src: imagePreview,
      alt: selectedImageInfo?.alt || 'Önizleme',
      title: selectedImageInfo?.title || '',
    }),
    [imagePreview, selectedImageInfo],
  );

  const compressImage = useCallback((file, maxWidth = 800, quality = 0.8) => {
    return new Promise(resolve => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleFileUpload = useCallback(
    async (event, onUpload) => {
      const file = event.target.files[0];
      if (!file) {
        return;
      }

      // Dosya tipi kontrolü
      if (!file.type.startsWith('image/')) {
        throw new Error('Sadece resim dosyaları kabul edilir');
      }

      // Dosya boyutu kontrolü (5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Dosya boyutu çok büyük (Max: 5MB)');
      }

      try {
        const compressedImage = await compressImage(file);
        if (onUpload) {
          onUpload(compressedImage);
        }
      } catch (error) {
        throw new Error('Resim işlenirken hata oluştu');
      }
    },
    [compressImage],
  );

  const getImageThumbnail = useCallback((imageUrl, size = 'small') => {
    if (!imageUrl) {
      return null;
    }

    const sizeMap = {
      small: { width: 40, height: 40 },
      medium: { width: 80, height: 80 },
      large: { width: 120, height: 120 },
    };

    return {
      ...sizeMap[size],
      objectFit: 'cover',
      borderRadius: '4px',
      cursor: 'pointer',
    };
  }, []);

  const downloadImage = useCallback((imageUrl, filename = 'image') => {
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Resim indirilemedi:', error);
    }
  }, []);

  return {
    // State
    imagePreview,
    imageDialog,
    selectedImageInfo,

    // Actions
    openImagePreview,
    closeImagePreview,
    handleFileUpload,
    downloadImage,

    // Utilities
    isValidImageUrl,
    getImagePreviewProps,
    getImageThumbnail,
    compressImage,
  };
};
