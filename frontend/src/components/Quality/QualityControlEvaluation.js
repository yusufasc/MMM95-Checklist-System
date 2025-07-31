import React from 'react';
import { Box, CircularProgress } from '@mui/material';

import { useQualityEvaluation } from '../../hooks/useQualityEvaluation';
import TemplateSelector from './QualityEvaluation/TemplateSelector';
import WorkerSelector from './QualityEvaluation/WorkerSelector';
import EvaluationForm from './QualityEvaluation/EvaluationForm';
import SaveButton from './QualityEvaluation/SaveButton';
import ImagePreviewDialog from './QualityEvaluation/ImagePreviewDialog';

const QualityControlEvaluation = () => {
  const {
    // Loading state
    loading,

    // Data states
    templates,
    machines,
    kalips,
    availableWorkers,
    unavailableWorkers,

    // Form states
    selectedTemplate,
    selectedWorker,
    selectedMachine,
    selectedKalip,
    hammadde,
    evaluationData,
    notes,

    // UI states
    expandedSections,
    previewImage,
    fileInputRefs,

    // Computed values
    selectedTemplateData,
    selectedWorkerData,
    totalScore,

    // Handlers
    handleTemplateSelect,
    handleWorkerSelect,
    handleMachineSelect,
    handleKalipSelect,
    handleHammaddeChange,
    handleNotesChange,
    handleEvaluationChange,
    handleImageUpload,
    handlePreviewImage,
    closePreviewImage,
    handleSaveEvaluation,
    toggleSection,
    loadDebugInfo,
  } = useQualityEvaluation();

  // Loading state
  if (loading && templates.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 10 }}>
      {/* Şablon Seçimi */}
      <TemplateSelector
        templates={templates}
        selectedTemplate={selectedTemplate}
        expanded={expandedSections.template}
        onTemplateSelect={handleTemplateSelect}
        onToggleExpanded={() => toggleSection('template')}
        onLoadDebugInfo={loadDebugInfo}
      />

      {/* Seçimler */}
      {selectedTemplate && (
        <WorkerSelector
          availableWorkers={availableWorkers}
          unavailableWorkers={unavailableWorkers}
          selectedWorker={selectedWorker}
          machines={machines}
          kalips={kalips}
          selectedMachine={selectedMachine}
          selectedKalip={selectedKalip}
          hammadde={hammadde}
          expanded={expandedSections.selections}
          onWorkerSelect={handleWorkerSelect}
          onMachineSelect={handleMachineSelect}
          onKalipSelect={handleKalipSelect}
          onHammaddeChange={handleHammaddeChange}
          onToggleExpanded={() => toggleSection('selections')}
        />
      )}

      {/* Değerlendirme */}
      <EvaluationForm
        selectedTemplateData={selectedTemplateData}
        selectedWorkerData={selectedWorkerData}
        evaluationData={evaluationData}
        notes={notes}
        totalScore={totalScore}
        expanded={expandedSections.evaluation}
        fileInputRefs={fileInputRefs}
        onEvaluationChange={handleEvaluationChange}
        onImageUpload={handleImageUpload}
        onPreviewImage={handlePreviewImage}
        onNotesChange={handleNotesChange}
        onToggleExpanded={() => toggleSection('evaluation')}
      />

      {/* Kaydet Butonu */}
      <SaveButton
        loading={loading}
        onSave={handleSaveEvaluation}
        visible={Boolean(selectedTemplate && selectedWorker)}
      />

      {/* Fotoğraf Önizleme Dialog */}
      <ImagePreviewDialog
        open={!!previewImage}
        imageUrl={previewImage}
        onClose={closePreviewImage}
      />
    </Box>
  );
};

export default QualityControlEvaluation;
