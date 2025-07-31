import { useState } from 'react';

export const useControlPendingDialog = () => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [scoreDialog, setScoreDialog] = useState(false);
  const [scoringData, setScoringData] = useState({
    maddeler: [],
    kontrolNotu: '',
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageDialog, setImageDialog] = useState(false);
  const [showComments, setShowComments] = useState({});

  // Handle score task
  const handleScoreTask = task => {
    setSelectedTask(task);
    setScoringData({
      maddeler: task.maddeler.map(madde => ({
        ...madde,
        kontrolPuani:
          madde.kontrolPuani !== null && madde.kontrolPuani !== undefined
            ? madde.kontrolPuani
            : madde.maxPuan || madde.puan,
        kontrolYorumu: madde.kontrolYorumu || '',
        kontrolResimUrl: madde.kontrolResimUrl || '',
      })),
      kontrolNotu: '',
    });
    setScoreDialog(true);
  };

  // Handle score close
  const handleScoreClose = () => {
    setScoreDialog(false);
    setSelectedTask(null);
    setScoringData({ maddeler: [], kontrolNotu: '' });
    setImagePreview(null);
    setImageDialog(false);
    setShowComments({});
  };

  // Handle madde score change
  const handleMaddeScoreChange = (index, field, value) => {
    const newMaddeler = [...scoringData.maddeler];
    newMaddeler[index][field] = value;
    setScoringData({ ...scoringData, maddeler: newMaddeler });
  };

  // Handle image preview
  const handleImagePreview = imageUrl => {
    setImagePreview(imageUrl);
    setImageDialog(true);
  };

  // Toggle comment section
  const toggleComment = index => {
    setShowComments(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return {
    // State
    selectedTask,
    scoreDialog,
    scoringData,
    imagePreview,
    imageDialog,
    showComments,

    // Setters
    setScoringData,

    // Methods
    handleScoreTask,
    handleScoreClose,
    handleMaddeScoreChange,
    handleImagePreview,
    toggleComment,
  };
};
