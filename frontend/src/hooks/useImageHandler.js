import { useState } from 'react';

const useImageHandler = () => {
  const [imagePreview, setImagePreview] = useState(null);
  const [imageDialog, setImageDialog] = useState(false);

  const handleImageUpload = (
    index,
    event,
    taskData,
    setTaskData,
    onSuccess,
    onError,
  ) => {
    const file = event.target.files[0];
    if (file) {
      // Dosya boyutu kontrolü (5MB)
      if (file.size > 5 * 1024 * 1024) {
        onError("Dosya boyutu 5MB'dan küçük olmalıdır");
        return;
      }

      // Dosya tipi kontrolü
      if (!file.type.startsWith('image/')) {
        onError('Sadece resim dosyaları yüklenebilir');
        return;
      }

      const reader = new FileReader();
      reader.onload = e => {
        const newMaddeler = [...taskData.maddeler];
        newMaddeler[index].resimUrl = e.target.result;
        newMaddeler[index].resimFile = file;
        setTaskData({ ...taskData, maddeler: newMaddeler });
        onSuccess('Resim başarıyla yüklendi! 📸');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageDelete = (index, taskData, setTaskData, fileInputRefs) => {
    const newMaddeler = [...taskData.maddeler];
    newMaddeler[index].resimUrl = '';
    newMaddeler[index].resimFile = null;
    setTaskData({ ...taskData, maddeler: newMaddeler });

    // File input'u temizle
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index].value = '';
    }
  };

  const handleImagePreview = imageUrl => {
    setImagePreview(imageUrl);
    setImageDialog(true);
  };

  const closeImageDialog = () => {
    setImageDialog(false);
    setImagePreview(null);
  };

  return {
    imagePreview,
    imageDialog,
    handleImageUpload,
    handleImageDelete,
    handleImagePreview,
    closeImageDialog,
  };
};

export default useImageHandler;
